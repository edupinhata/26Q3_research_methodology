import { readFile, readdir, stat } from "node:fs/promises";
import { basename, extname, relative, resolve, sep } from "node:path";
import process from "node:process";
import { parse } from "yaml";
import { extractPdfText, findSecretLabels, textVariants } from "./publication-safety.mjs";

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".htm",
  ".html",
  ".js",
  ".json",
  ".jsonld",
  ".map",
  ".mjs",
  ".svg",
  ".txt",
  ".webmanifest",
  ".xml",
]);
const TEXT_FILENAMES = new Set([".nojekyll", "CNAME"]);
const BINARY_EXTENSIONS = new Set([
  ".avif",
  ".eot",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".otf",
  ".pdf",
  ".png",
  ".ttf",
  ".webp",
  ".woff",
  ".woff2",
]);


const COLLECTION_ROUTES = new Map([
  ["library", "biblioteca"],
  ["notes", "anotacoes"],
  ["projects", "codigo"],
  ["works", "trabalhos"],
]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Link simbólico não permitido no artefato público: ${path}`);
    }
    if (entry.isDirectory()) {
      files.push(...await collectFiles(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function artifactVariants(bytes, kind) {
  const seedVariants = [bytes.toString("latin1")];
  if (kind === "text") {
    seedVariants.push(bytes.toString("utf8"));
  }
  if (bytes.length >= 2) {
    const evenBytes = bytes.subarray(0, bytes.length - (bytes.length % 2));
    seedVariants.push(evenBytes.toString("utf16le"));
    seedVariants.push(Buffer.from(evenBytes).swap16().toString("utf16le"));
  }

  const variants = new Set();
  for (const seed of seedVariants) {
    for (const variant of textVariants(seed)) variants.add(variant);
  }
  return [...variants];
}

function classify(path) {
  const extension = extname(path).toLowerCase();
  if (TEXT_EXTENSIONS.has(extension) || TEXT_FILENAMES.has(basename(path))) {
    return "text";
  }
  if (BINARY_EXTENSIONS.has(extension)) {
    return "binary";
  }
  return "unknown";
}

async function findDraftRoutes(contentDirectory) {
  const contentFiles = await collectFiles(contentDirectory);
  const drafts = [];

  for (const path of contentFiles) {
    if (extname(path).toLowerCase() !== ".md") {
      continue;
    }
    const source = await readFile(path, "utf8");
    const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s*\r?\n|$)/)?.[1] ?? "";
    let data;
    try {
      data = parse(frontmatter) ?? {};
    } catch (error) {
      throw new Error(`Frontmatter YAML inválido em ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (typeof data !== "object" || Array.isArray(data)) {
      throw new Error(`Frontmatter deve ser um objeto em ${path}`);
    }
    const draft = data.draft === undefined ? true : data.draft;
    if (typeof draft !== "boolean") {
      throw new Error(`Campo draft deve ser booleano em ${path}`);
    }
    if (!draft) {
      continue;
    }

    const parts = relative(contentDirectory, path).split(sep);
    const collection = parts.shift();
    const publicRoot = COLLECTION_ROUTES.get(collection);
    if (!publicRoot) {
      throw new Error(`Collection de draft sem rota conhecida: ${collection} (${path})`);
    }
    const id = parts.join("/").replace(/\.md$/i, "");
    drafts.push({ path, publicPath: `/${publicRoot}/${id}/` });
  }

  return drafts;
}

function parseFrontmatterData(source, path) {
  const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s*\r?\n|$)/)?.[1];
  if (frontmatter === undefined) {
    throw new Error(`Frontmatter ausente ou inválido em ${path}`);
  }
  try {
    const data = parse(frontmatter) ?? {};
    if (typeof data !== "object" || Array.isArray(data)) {
      throw new Error("frontmatter deve ser um objeto");
    }
    return data;
  } catch (error) {
    throw new Error(`Frontmatter YAML inválido em ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function findWorkArtifactProblems(distDirectory, contentDirectory, publicFiles) {
  const problems = [];
  const workMetadata = new Map();
  const worksDirectory = resolve(contentDirectory, "works");
  const worksExist = await stat(worksDirectory).then((info) => info.isDirectory(), () => false);
  if (worksExist) {
    for (const path of await collectFiles(worksDirectory)) {
      if (extname(path).toLowerCase() !== ".md") continue;
      const id = relative(worksDirectory, path).split(sep).join("/").replace(/\.md$/i, "");
      workMetadata.set(id, { path, data: parseFrontmatterData(await readFile(path, "utf8"), path) });
    }
  }

  const controlledPdfs = new Map();
  for (const path of publicFiles) {
    if (extname(path).toLowerCase() !== ".pdf") continue;
    const publicPath = relative(distDirectory, path).split(sep).join("/");
    const match = /^documents\/works\/([a-z0-9]+(?:-[a-z0-9]+)*)\.pdf$/.exec(publicPath);
    if (!match) {
      problems.push(`PDF fora do diretório controlado documents/works/: ${publicPath}`);
      continue;
    }
    controlledPdfs.set(match[1], path);
  }

  const completedIds = new Set([
    ...controlledPdfs.keys(),
    ...[...workMetadata.entries()]
      .filter(([, { data }]) => data.draft === false && data.status === "completed")
      .map(([id]) => id),
  ]);
  if (completedIds.size === 0) return problems;

  const deliverablesPath = resolve(contentDirectory, "../data/deliverables.yml");
  let deliverables = null;
  try {
    deliverables = parse(await readFile(deliverablesPath, "utf8"));
  } catch {
    problems.push(`manifesto canônico indisponível: ${deliverablesPath}`);
  }
  if (deliverables !== null && !Array.isArray(deliverables)) {
    problems.push(`manifesto canônico deliverables.yml deve conter uma lista: ${deliverablesPath}`);
    deliverables = null;
  }

  for (const id of completedIds) {
    const source = workMetadata.get(id);
    const expectedArtifact = `/documents/works/${id}.pdf`;
    if (!source) {
      problems.push(`PDF sem fonte pública controlada: ${id}`);
      continue;
    }
    if (source.data.draft !== false || source.data.status !== "completed" || source.data.artifact !== expectedArtifact) {
      problems.push(`estado público não autorizado para o PDF ${id}`);
    }
    const canonical = Array.isArray(deliverables)
      ? deliverables.find((item) => item?.id === id)
      : null;
    if (canonical?.status !== "completed") {
      problems.push(`entrega canônica não concluída em deliverables.yml: ${id}`);
    }
    if (!controlledPdfs.has(id)) {
      problems.push(`PDF finalizado ausente em documents/works/: ${id}`);
    }
    const route = resolve(distDirectory, "trabalhos", id, "index.html");
    if (!await stat(route).then((info) => info.isFile(), () => false)) {
      problems.push(`rota pública finalizada ausente: ${id}`);
    }
  }
  return problems;
}

async function scanPublicBuild(distDirectory, contentDirectory) {
  const distInfo = await stat(distDirectory);
  if (!distInfo.isDirectory()) {
    throw new Error(`Diretório de build inválido: ${distDirectory}`);
  }

  const files = await collectFiles(distDirectory);
  if (files.length === 0) {
    throw new Error(`Build público vazio: ${distDirectory}`);
  }

  const problems = [];
  const textArtifacts = [];
  for (const path of files) {
    const kind = classify(path);
    if (kind === "unknown") {
      problems.push(`formato público não classificado: ${relative(distDirectory, path)}`);
      continue;
    }
    const bytes = await readFile(path);
    const variants = artifactVariants(bytes, kind);
    if (extname(path).toLowerCase() === ".pdf") {
      variants.push(...textVariants(await extractPdfText(bytes)));
    }
    if (kind === "text") {
      textArtifacts.push({ path, variants });
    }

    for (const label of findSecretLabels(variants)) {
      problems.push(`${label}: ${relative(distDirectory, path)}`);
    }
  }

  problems.push(...await findWorkArtifactProblems(distDirectory, contentDirectory, files));

  const combinedText = textArtifacts.flatMap(({ variants }) => variants).join("\n");
  const drafts = await findDraftRoutes(contentDirectory);
  for (const draft of drafts) {
    const generatedRoute = resolve(distDirectory, draft.publicPath.slice(1), "index.html");
    const routeExists = await stat(generatedRoute).then(() => true, () => false);
    if (routeExists || combinedText.includes(draft.publicPath)) {
      problems.push(`draft publicado em ${draft.publicPath} (fonte: ${draft.path})`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Verificação do build público falhou:\n- ${[...new Set(problems)].join("\n- ")}`);
  }

  return { files: files.length, textFiles: textArtifacts.length, drafts: drafts.length };
}

const distDirectory = resolve(process.argv[2] ?? "dist");
const contentDirectory = resolve(process.argv[3] ?? "src/content");

try {
  const result = await scanPublicBuild(distDirectory, contentDirectory);
  console.log(
    `Build público verificado: ${result.files} arquivos, ${result.textFiles} textuais, ${result.drafts} drafts excluídos.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
