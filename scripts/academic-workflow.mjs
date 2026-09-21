import { access, lstat, mkdir, readFile, readdir, rename, rm, rmdir, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { chromium } from "@playwright/test";
import MarkdownIt from "markdown-it";
import { parse, parseDocument, Scalar, stringify } from "yaml";
import { extractPdfText, findSecretLabels, textVariants } from "./publication-safety.mjs";

const WORK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function exists(path) {
  return access(path).then(() => true, () => false);
}

function requireWorkId(id) {
  if (!WORK_ID.test(id)) {
    throw new Error("Identificador inválido: use apenas letras minúsculas, números e hífens.");
  }
}

function workSourcePaths(root, id) {
  const workDirectory = resolve(root, "src/content/works", id);
  return {
    workDirectory,
    documentPath: resolve(workDirectory, "work.md"),
    pagePath: resolve(workDirectory, "index.md"),
  };
}

async function assertNoSymlink(root, targetPath) {
  const rootPath = resolve(root);
  const target = resolve(targetPath);
  const relativePath = relative(rootPath, target);
  if (relativePath === "" || relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Caminho fora da raiz controlada: ${targetPath}`);
  }
  let current = rootPath;
  for (const segment of relativePath.split(/[\\/]+/)) {
    current = resolve(current, segment);
    try {
      if ((await lstat(current)).isSymbolicLink()) {
        throw new Error(`Link simbólico não permitido no fluxo acadêmico: ${current}`);
      }
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
  }
}

function dateOnly(value, label) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`${label} deve usar uma data ISO.`);
  }
  const instant = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const parsed = new Date(instant);
  if (
    parsed.getUTCFullYear() !== Number(match[1]) ||
    parsed.getUTCMonth() !== Number(match[2]) - 1 ||
    parsed.getUTCDate() !== Number(match[3])
  ) {
    throw new Error(`${label} contém uma data impossível.`);
  }
  return instant;
}

function calculateCourseWeek(startsOn, dueAt) {
  const isoDateTime = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00))$/;
  if (typeof dueAt !== "string" || !isoDateTime.test(dueAt) || !Number.isFinite(Date.parse(dueAt))) {
    throw new Error("dueAt deve usar uma data e hora ISO.");
  }
  const elapsedDays = Math.floor((dateOnly(dueAt.slice(0, 10), "dueAt") - dateOnly(startsOn, "startsOn")) / 86_400_000);
  if (elapsedDays < 0) {
    throw new Error("O prazo não pode ser anterior ao início da disciplina.");
  }
  return Math.floor(elapsedDays / 7) + 1;
}

function documentTemplate(deliverable) {
  return `# ${deliverable.title}

> Substitua todos os marcadores entre colchetes antes de finalizar o trabalho.

## Resumo

[Escreva aqui o texto integral do trabalho.]

## Considerações críticas

[Registre aqui sua análise autoral, se a atividade exigir.]

## Referências

[Informe as referências utilizadas.]

## Declaração de uso de inteligência artificial

[Descreva como a inteligência artificial foi utilizada ou declare que ela não foi utilizada.]
`;
}

function pageTemplate(deliverable, date, courseWeek) {
  const frontmatter = stringify({
    title: deliverable.title,
    description: "Apresentação pública a revisar antes da publicação.",
    publishedAt: date,
    tags: ["trabalho"],
    draft: true,
    revisions: [{ date, description: "Estrutura inicial criada pelo fluxo acadêmico." }],
    type: deliverable.type,
    status: "in-progress",
    dueAt: deliverable.dueAt,
    courseWeek,
    featured: false,
    artifact: `/documents/works/${deliverable.id}.pdf`,
    aiUsage: "Consulte a declaração completa de uso de inteligência artificial no documento.",
  });
  return `---\n${frontmatter}---\n\n[Escreva aqui uma apresentação pública breve do trabalho, sem repetir o texto integral.]\n`;
}

export async function createWork({ root, id, date, operations = {} }) {
  requireWorkId(id);
  dateOnly(date, "date");

  const deliverablesPath = resolve(root, "src/data/deliverables.yml");
  const coursePath = resolve(root, "src/data/course.yml");
  const { workDirectory, documentPath, pagePath } = workSourcePaths(root, id);

  await Promise.all([
    assertNoSymlink(root, deliverablesPath),
    assertNoSymlink(root, coursePath),
    assertNoSymlink(root, documentPath),
    assertNoSymlink(root, pagePath),
  ]);
  if (await exists(documentPath) || await exists(pagePath)) {
    throw new Error(`O trabalho ${id} já existe; nenhum arquivo foi sobrescrito.`);
  }

  const [deliverablesSource, courseSource] = await Promise.all([
    readFile(deliverablesPath, "utf8"),
    readFile(coursePath, "utf8"),
  ]);
  const deliverables = parse(deliverablesSource);
  const course = parse(courseSource);
  if (!Array.isArray(deliverables)) {
    throw new Error("src/data/deliverables.yml deve conter uma lista.");
  }
  const deliverable = deliverables.find((item) => item?.id === id);
  if (!deliverable) {
    throw new Error(`Entrega não encontrada em src/data/deliverables.yml: ${id}`);
  }
  if (typeof course?.startsOn !== "string") {
    throw new Error("src/data/course.yml deve informar startsOn.");
  }
  const courseWeek = calculateCourseWeek(course.startsOn, deliverable.dueAt);

  const document = parseDocument(deliverablesSource, { keepSourceTokens: true });
  const index = deliverables.findIndex((item) => item?.id === id);
  document.setIn([index, "status"], "in-progress");

  const workDirectoryExisted = await exists(workDirectory);
  await mkdir(workDirectory, { recursive: true });
  const nonce = `${process.pid}-${Date.now()}`;
  const stagedDocumentPath = `${documentPath}.${nonce}.staging`;
  const stagedPagePath = `${pagePath}.${nonce}.staging`;
  const stagedDeliverablesPath = `${deliverablesPath}.${nonce}.staging`;
  const stagedPaths = [stagedDocumentPath, stagedPagePath, stagedDeliverablesPath];
  try {
    await Promise.all(stagedPaths.map((path) => assertNoSymlink(root, path)));
    await writeFile(stagedDocumentPath, documentTemplate(deliverable), { encoding: "utf8", flag: "wx" });
    await writeFile(stagedPagePath, pageTemplate(deliverable, date, courseWeek), { encoding: "utf8", flag: "wx" });
    await writeFile(stagedDeliverablesPath, document.toString(), { encoding: "utf8", flag: "wx" });
    await replaceStagedFiles([
      { target: documentPath, staged: stagedDocumentPath, nonce },
      { target: pagePath, staged: stagedPagePath, nonce },
      { target: deliverablesPath, staged: stagedDeliverablesPath, nonce },
    ], operations.rename ?? rename);
  } catch (error) {
    await Promise.all(stagedPaths.map((path) => rm(path, { force: true }).catch(() => undefined)));
    if (!workDirectoryExisted) {
      await rmdir(workDirectory).catch(() => undefined);
    }
    throw error;
  }

  return { documentPath, pagePath };
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pdfHtml({ title, course, institution, markdown }) {
  const renderer = new MarkdownIt({ html: false, linkify: true, typographer: true });
  const bodySource = markdown.replace(/^#\s+.*(?:\r?\n)+/, "");
  const body = renderer.render(bodySource);
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 24mm 22mm 22mm; }
    :root { color: #171717; font-family: Georgia, "Times New Roman", serif; font-size: 11pt; line-height: 1.55; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    header { border-bottom: 1px solid #777; margin-bottom: 1.8rem; padding-bottom: 1rem; text-align: center; }
    .institution, .course { font-size: 9.5pt; letter-spacing: 0.02em; margin: 0.15rem 0; text-transform: uppercase; }
    h1 { font-size: 18pt; line-height: 1.25; margin: 1.2rem 0 0; }
    h2 { font-size: 13pt; margin: 1.6rem 0 0.65rem; break-after: avoid; }
    h3 { font-size: 11.5pt; margin: 1.2rem 0 0.5rem; break-after: avoid; }
    p { margin: 0 0 0.85rem; orphans: 3; text-align: justify; widows: 3; }
    li { margin-bottom: 0.35rem; }
    a { color: inherit; text-decoration-thickness: 0.06em; }
    blockquote { border-left: 3px solid #888; color: #444; margin: 1rem 0; padding-left: 1rem; }
    code { font-family: "Cascadia Mono", Consolas, monospace; font-size: 9pt; }
    pre { background: #f3f3f3; padding: 0.8rem; white-space: pre-wrap; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <header>
    <p class="institution">${escapeHtml(institution)}</p>
    <p class="course">${escapeHtml(course)}</p>
    <h1>${escapeHtml(title)}</h1>
  </header>
  <main>${body}</main>
</body>
</html>`;
}

async function renderWorkPdf({ root, id, outputPath }) {
  requireWorkId(id);
  const { documentPath: sourcePath } = workSourcePaths(root, id);
  const deliverablesPath = resolve(root, "src/data/deliverables.yml");
  const coursePath = resolve(root, "src/data/course.yml");
  await Promise.all([
    assertNoSymlink(root, sourcePath),
    assertNoSymlink(root, deliverablesPath),
    assertNoSymlink(root, coursePath),
    assertNoSymlink(root, outputPath),
  ]);
  const [markdown, deliverablesSource, courseSource] = await Promise.all([
    readFile(sourcePath, "utf8"),
    readFile(deliverablesPath, "utf8"),
    readFile(coursePath, "utf8"),
  ]);
  const deliverables = parse(deliverablesSource);
  const course = parse(courseSource);
  const deliverable = Array.isArray(deliverables) ? deliverables.find((item) => item?.id === id) : null;
  if (!deliverable) {
    throw new Error(`Entrega não encontrada em src/data/deliverables.yml: ${id}`);
  }
  if (typeof course?.name !== "string" || typeof course?.institution !== "string") {
    throw new Error("src/data/course.yml deve informar name e institution.");
  }

  const outputDirectory = dirname(outputPath);
  await mkdir(outputDirectory, { recursive: true });
  await assertNoSymlink(root, outputPath);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent(pdfHtml({
      title: deliverable.title,
      course: `${course.code ?? ""} — ${course.name}`.replace(/^ — /, ""),
      institution: course.institution,
      markdown,
    }), { waitUntil: "load" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: { top: "24mm", right: "22mm", bottom: "22mm", left: "22mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: '<div style="font-size:8px;text-align:center;width:100%;"><span class="pageNumber"></span></div>',
    });
  } finally {
    await browser.close();
  }
  return outputPath;
}

export async function generateWorkPdf({ root, id }) {
  requireWorkId(id);
  const outputPath = resolve(root, ".work-previews", `${id}.pdf`);
  return renderWorkPdf({ root, id, outputPath });
}

export async function generateAllWorkPdfs({ root }) {
  const worksDirectory = resolve(root, "src/content/works");
  const publicDirectory = resolve(root, "public/documents/works");
  const deliverablesPath = resolve(root, "src/data/deliverables.yml");
  await Promise.all([
    assertNoSymlink(root, worksDirectory),
    assertNoSymlink(root, publicDirectory),
    assertNoSymlink(root, deliverablesPath),
  ]);
  await rm(publicDirectory, { recursive: true, force: true });
  if (!await exists(worksDirectory)) {
    return [];
  }
  const deliverables = parse(await readFile(deliverablesPath, "utf8"));
  if (!Array.isArray(deliverables)) {
    throw new Error("src/data/deliverables.yml deve conter uma lista.");
  }
  const entries = await readdir(worksDirectory, { withFileTypes: true });
  const ids = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new Error(`Links simbólicos não são permitidos em src/content/works/: ${entry.name}`);
    }
    if (!entry.isDirectory()) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        throw new Error(`Estrutura legada não permitida em src/content/works/: ${entry.name}`);
      }
      continue;
    }
    requireWorkId(entry.name);
    const { documentPath: sourcePath, pagePath } = workSourcePaths(root, entry.name);
    await Promise.all([
      assertNoSymlink(root, sourcePath),
      assertNoSymlink(root, pagePath),
    ]);
    if (!await exists(sourcePath) || !await exists(pagePath)) {
      throw new Error(`O trabalho ${entry.name} deve conter index.md e work.md.`);
    }
    const pageSource = await readFile(pagePath, "utf8");
    const page = splitFrontmatter(pageSource, pagePath);
    const metadata = parse(page.yaml);
    const deliverable = deliverables.find((item) => item?.id === entry.name);
    const expectedArtifact = `/documents/works/${entry.name}.pdf`;
    if (
      deliverable?.status === "completed" &&
      metadata?.status === "completed" &&
      metadata?.draft === false &&
      metadata?.artifact === expectedArtifact
    ) {
      validateReadyForPublication(await readFile(sourcePath, "utf8"), page.body, pageSource);
      ids.push(entry.name);
    }
  }
  const generated = [];
  for (const id of ids.toSorted()) {
    const outputPath = resolve(publicDirectory, `${id}.pdf`);
    await renderWorkPdf({ root, id, outputPath });
    await verifyPdf(outputPath);
    generated.push(outputPath);
  }
  return generated;
}

function splitFrontmatter(source, path) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(source);
  if (!match) {
    throw new Error(`Frontmatter ausente ou inválido em ${path}.`);
  }
  return { yaml: match[1], body: match[2] };
}

function validateReadyForPublication(documentSource, pageBody, pageSource = pageBody) {
  const pendingMarker = /(?:\[[^\]]*(?:PLACEHOLDER|Escreva|Registre|Informe|Descreva|Insira|Preencha|Insert|Enter|Write|Describe|Provide|Add)[^\]]*\]|Substitua todos os marcadores|\b(?:PLACEHOLDER|PENDENTE|PREENCHER)\b|^\s*(?:\.{3}|…|_{3,}|-{3,})\s*$|^\s*(?:[-*+]|\d+[.)])\s*$|\{\{[^}]+\}\}|<!--[\s\S]*?-->)/im;
  const uppercasePendingMarker = /\b(?:TODO|TBD|FIXME)\b/;
  const emptyRomanNumeralListItem = /^\s*[IVXLCDM]+[.)]\s*$/m;
  const standaloneBracketPlaceholder = /^\s*\[.{4,}\]\s*$/m;
  const pendingInDocument = pendingMarker.test(documentSource)
    || uppercasePendingMarker.test(documentSource)
    || emptyRomanNumeralListItem.test(documentSource)
    || standaloneBracketPlaceholder.test(documentSource);
  const pendingInPage = pendingMarker.test(pageBody)
    || uppercasePendingMarker.test(pageBody)
    || emptyRomanNumeralListItem.test(pageBody)
    || standaloneBracketPlaceholder.test(pageBody);
  if (pendingInDocument || pendingInPage) {
    throw new Error(`O trabalho está incompleto ou contém marcadores pendentes (${pendingInDocument ? "documento" : "página"}).`);
  }
  const privateMarker = /(?:[A-Za-z]:\\Users\\|\/home\/|file:\/\/)/i;
  if (privateMarker.test(documentSource) || privateMarker.test(pageSource)) {
    throw new Error("O trabalho contém um caminho local privado e não pode ser publicado.");
  }
  const secretLabels = findSecretLabels([
    ...textVariants(documentSource),
    ...textVariants(pageSource),
  ]);
  if (secretLabels.length > 0) {
    throw new Error(`O trabalho contém um possível segredo ou credencial (${secretLabels.join(", ")}) e não pode ser publicado.`);
  }

  const headings = [...documentSource.matchAll(/^##\s+(.+?)\s*$/gm)];
  const sections = new Map();
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? documentSource.length;
    sections.set(heading[1].trim().toLocaleLowerCase("pt-BR"), documentSource.slice(start, end).trim());
  }
  const requiredSections = new Map([
    ["Resumo", 40],
    ["Referências", 15],
    ["Declaração de uso de inteligência artificial", 15],
  ]);
  for (const [section, minimumLength] of requiredSections) {
    const content = sections.get(section.toLocaleLowerCase("pt-BR"));
    if (!content) {
      throw new Error(`Seção obrigatória ausente no documento: ${section}.`);
    }
    if (meaningfulText(content).length < minimumLength) {
      throw new Error(`Seção obrigatória incompleta no documento: ${section}.`);
    }
  }
  if (meaningfulText(pageBody).length < 40) {
    throw new Error("A apresentação pública deve ter ao menos 40 caracteres.");
  }
}

function meaningfulText(markdown) {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/^#{1,6}\s+.*$/gm, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function verifyPdf(path) {
  const info = await stat(path);
  const bytes = await readFile(path);
  const signature = bytes.subarray(0, 5).toString("ascii");
  if (signature !== "%PDF-" || info.size <= 5_000) {
    throw new Error(`O PDF gerado é inválido ou está incompleto: ${path}`);
  }
  const secretLabels = findSecretLabels(textVariants(await extractPdfText(bytes)));
  if (secretLabels.length > 0) {
    throw new Error(`O PDF gerado contém um possível segredo ou credencial (${secretLabels.join(", ")}): ${path}`);
  }
}

async function replaceStagedFiles(items, renameFile) {
  const records = items.map((item) => ({ ...item, backup: `${item.target}.backup-${item.nonce}`, backedUp: false, installed: false }));
  try {
    for (const record of records) {
      if (await exists(record.target)) {
        await renameFile(record.target, record.backup);
        record.backedUp = true;
      }
    }
    for (const record of records) {
      await renameFile(record.staged, record.target);
      record.installed = true;
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const record of records.toReversed()) {
      try {
        if (record.installed) await rm(record.target, { force: true });
        if (record.backedUp) await renameFile(record.backup, record.target);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      await rm(record.staged, { force: true }).catch(() => undefined);
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError([error, ...rollbackErrors], "Falha na finalização e na restauração dos arquivos originais.");
    }
    throw error;
  }
  await Promise.all(records.map((record) => rm(record.backup, { force: true })));
}

export async function finalizeWork({ root, id, date, operations = {} }) {
  requireWorkId(id);
  dateOnly(date, "date");
  const { documentPath, pagePath } = workSourcePaths(root, id);
  const deliverablesPath = resolve(root, "src/data/deliverables.yml");
  await Promise.all([
    assertNoSymlink(root, documentPath),
    assertNoSymlink(root, pagePath),
    assertNoSymlink(root, deliverablesPath),
  ]);
  const [documentSource, pageSource, deliverablesSource] = await Promise.all([
    readFile(documentPath, "utf8"),
    readFile(pagePath, "utf8"),
    readFile(deliverablesPath, "utf8"),
  ]);
  const page = splitFrontmatter(pageSource, pagePath);
  validateReadyForPublication(documentSource, page.body, pageSource);

  const deliverables = parse(deliverablesSource);
  const deliverableIndex = Array.isArray(deliverables)
    ? deliverables.findIndex((item) => item?.id === id)
    : -1;
  if (deliverableIndex < 0) {
    throw new Error(`Entrega não encontrada em src/data/deliverables.yml: ${id}`);
  }

  const pageDocument = parseDocument(page.yaml, { keepSourceTokens: true });
  pageDocument.set("draft", false);
  pageDocument.set("status", "completed");
  pageDocument.set("artifact", `/documents/works/${id}.pdf`);
  const revisions = pageDocument.get("revisions", true);
  if (!revisions || !Array.isArray(revisions.items)) {
    throw new Error(`revisions deve ser uma lista em ${pagePath}.`);
  }
  const revisionDate = new Scalar(date);
  revisionDate.type = Scalar.QUOTE_DOUBLE;
  revisions.add({ date: revisionDate, description: "Trabalho finalizado e PDF verificado." });

  const deliverablesDocument = parseDocument(deliverablesSource, { keepSourceTokens: true });
  deliverablesDocument.setIn([deliverableIndex, "status"], "completed");

  const nonce = `${process.pid}-${Date.now()}`;
  const pdfPath = resolve(root, "public/documents/works", `${id}.pdf`);
  const stagedPdfPath = resolve(root, "public/documents/works", `.${id}.${nonce}.staging.pdf`);
  const stagedPagePath = `${pagePath}.${nonce}.staging`;
  const stagedDeliverablesPath = `${deliverablesPath}.${nonce}.staging`;
  const stagedPaths = [stagedPdfPath, stagedPagePath, stagedDeliverablesPath];
  try {
    await Promise.all(stagedPaths.map((path) => assertNoSymlink(root, path)));
    await renderWorkPdf({ root, id, outputPath: stagedPdfPath });
    await verifyPdf(stagedPdfPath);
    await writeFile(stagedPagePath, `---\n${pageDocument.toString()}---\n${page.body}`, { encoding: "utf8", flag: "wx" });
    await writeFile(stagedDeliverablesPath, deliverablesDocument.toString(), { encoding: "utf8", flag: "wx" });
    await replaceStagedFiles([
      { target: pagePath, staged: stagedPagePath, nonce },
      { target: deliverablesPath, staged: stagedDeliverablesPath, nonce },
      { target: pdfPath, staged: stagedPdfPath, nonce },
    ], operations.rename ?? rename);
  } catch (error) {
    await Promise.all(stagedPaths.map((path) => rm(path, { force: true }).catch(() => undefined)));
    throw error;
  }
  return { pdfPath, pagePath, documentPath };
}
