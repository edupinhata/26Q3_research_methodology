import { access, mkdtemp, mkdir, readFile, rename, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { createWork, finalizeWork, generateAllWorkPdfs, generateWorkPdf } from "../../scripts/academic-workflow.mjs";

const temporaryRoots: string[] = [];

async function createFixture(): Promise<string> {
  const root = await mkdtemp(resolve(tmpdir(), "academic-workflow-"));
  temporaryRoots.push(root);
  await mkdir(resolve(root, "src/data"), { recursive: true });
  await writeFile(
    resolve(root, "src/data/course.yml"),
    [
      'code: "CCM-002"',
      'name: "Metodologia de Pesquisa em Ciência da Computação"',
      'institution: "UFABC"',
      'startsOn: "2026-09-14"',
      "",
    ].join("\n"),
  );
  await writeFile(
    resolve(root, "src/data/deliverables.yml"),
    [
      '- id: "resumo-3-ai-science-focus"',
      '  title: "Resumo 3 — AI tools expand scientists impact but contract sciences focus"',
      '  type: "summary"',
      '  assessment: "A2"',
      '  dueAt: "2026-10-11T23:59:00-03:00"',
      '  status: "planned"',
      "  restrictedSource: true",
      "",
    ].join("\n"),
  );
  return root;
}

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("academic work workflow", () => {
  it("creates the two editable sources from the canonical deliverable without overwriting files", async () => {
    const root = await createFixture();

    await expect(createWork({ root, id: "resumo-3-ai-science-focus", date: "2026-09-16junk" })).rejects.toThrow(
      /data|date/i,
    );

    const result = await createWork({ root, id: "resumo-3-ai-science-focus", date: "2026-09-16" });

    expect(result).toEqual({
      documentPath: resolve(root, "src/content/works/resumo-3-ai-science-focus/work.md"),
      pagePath: resolve(root, "src/content/works/resumo-3-ai-science-focus/index.md"),
    });
    const document = await readFile(result.documentPath, "utf8");
    expect(document).toContain("# Resumo 3 — AI tools expand scientists impact but contract sciences focus");
    expect(document).toContain("## Resumo");
    expect(document).toContain("## Referências");
    expect(document).toContain("## Declaração de uso de inteligência artificial");

    const page = await readFile(result.pagePath, "utf8");
    expect(page).toContain("artifact: /documents/works/resumo-3-ai-science-focus.pdf");
    expect(page).toContain("draft: true");
    expect(page).toContain("courseWeek: 4");

    const deliverables = parse(await readFile(resolve(root, "src/data/deliverables.yml"), "utf8"));
    expect(deliverables[0].status).toBe("in-progress");

    await expect(createWork({ root, id: "resumo-3-ai-science-focus", date: "2026-09-16" })).rejects.toThrow(
      /já existe/i,
    );
    await expect(createWork({ root, id: "../private", date: "2026-09-16" })).rejects.toThrow(/identificador/i);
  });

  it("keeps draft previews private and generates public PDFs only for published works", async () => {
    const root = await createFixture();
    await createWork({ root, id: "resumo-3-ai-science-focus", date: "2026-09-16" });

    const pdfPath = await generateWorkPdf({ root, id: "resumo-3-ai-science-focus" });

    expect(pdfPath).toBe(resolve(root, ".work-previews/resumo-3-ai-science-focus.pdf"));
    const pdf = await readFile(pdfPath);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(5_000);

    const pagePath = resolve(root, "src/content/works/resumo-3-ai-science-focus/index.md");
    const page = await readFile(pagePath, "utf8");
    await writeFile(pagePath, page.replace("draft: true", "draft: false").replace("status: in-progress", "status: completed"));
    expect(await generateAllWorkPdfs({ root })).toEqual([]);
  });

  it("fails closed on placeholders and finalizes synchronized metadata only after a complete document", async () => {
    const root = await createFixture();
    const { documentPath, pagePath } = await createWork({
      root,
      id: "resumo-3-ai-science-focus",
      date: "2026-09-16",
    });

    await expect(finalizeWork({ root, id: "resumo-3-ai-science-focus", date: "2026-10-10" })).rejects.toThrow(
      /marcadores pendentes/i,
    );
    let deliverables = parse(await readFile(resolve(root, "src/data/deliverables.yml"), "utf8"));
    expect(deliverables[0].status).toBe("in-progress");

    await writeFile(
      documentPath,
      `# Resumo 3 — AI tools expand scientists impact but contract sciences focus

## Resumo

Este é o texto autoral completo usado para verificar o fluxo de publicação acadêmica.

## Considerações críticas

A análise distingue associação, causalidade e limites das métricas apresentadas.

## Referências

HAO, Q. et al. Artificial intelligence tools expand scientists impact but contract sciences focus.

## Declaração de uso de inteligência artificial

IA generativa foi utilizada na revisão linguística; seleção de evidências e conclusões são do autor.
`,
    );
    const page = await readFile(pagePath, "utf8");
    await writeFile(
      pagePath,
      page
        .replace(/^artifact:.*\r?\n/m, "")
        .replace(
          "[Escreva aqui uma apresentação pública breve do trabalho, sem repetir o texto integral.]",
          "Síntese crítica sobre impacto científico, concentração temática e os limites das métricas utilizadas.",
        ),
    );

    await writeFile(
      documentPath,
      `# Resumo 3 — AI tools expand scientists impact but contract sciences focus

## Resumo

TODO

## Referências

TODO

## Declaração de uso de inteligência artificial

TODO
`,
    );
    await expect(finalizeWork({ root, id: "resumo-3-ai-science-focus", date: "2026-10-10" })).rejects.toThrow(
      /incompleto|pendente/i,
    );
    await writeFile(
      documentPath,
      `# Resumo 3

## Resumo

[Insert the complete academic discussion here]

## Referências

AUTOR, A. Referência bibliográfica válida para o teste. 2026.

## Declaração de uso de inteligência artificial

IA utilizada somente para apoiar a revisão linguística deste teste controlado.
`,
    );
    await expect(finalizeWork({ root, id: "resumo-3-ai-science-focus", date: "2026-10-10" })).rejects.toThrow(
      /incompleto|pendente/i,
    );
    await writeFile(
      documentPath,
      `# Resumo 3

## Resumo

[Insira aqui a discussão acadêmica integral e devidamente revisada]

## Referências

AUTOR, A. Referência bibliográfica válida para o teste. 2026.

## Declaração de uso de inteligência artificial

IA utilizada somente para apoiar a revisão linguística deste teste controlado.
`,
    );
    await expect(finalizeWork({ root, id: "resumo-3-ai-science-focus", date: "2026-10-10" })).rejects.toThrow(
      /incompleto|pendente/i,
    );
    await writeFile(
      documentPath,
      `# Resumo 3

## Resumo

[Texto provisório que será substituído por conteúdo acadêmico definitivo antes da publicação]

## Referências

AUTOR, A. Referência bibliográfica válida para o teste. 2026.

## Declaração de uso de inteligência artificial

IA utilizada somente para apoiar a revisão linguística deste teste controlado.
`,
    );
    await expect(finalizeWork({ root, id: "resumo-3-ai-science-focus", date: "2026-10-10" })).rejects.toThrow(
      /incompleto|pendente/i,
    );
    await writeFile(
      documentPath,
      `# Resumo 3

## Resumo

**___---...___---...___---...___---...___---...**

## Referências

AUTOR, A. Referência bibliográfica válida para o teste. 2026.

## Declaração de uso de inteligência artificial

IA utilizada somente para apoiar a revisão linguística deste teste controlado.
`,
    );
    await expect(finalizeWork({ root, id: "resumo-3-ai-science-focus", date: "2026-10-10" })).rejects.toThrow(
      /incompleta/i,
    );
    await writeFile(
      documentPath,
      `# Resumo 3

## Resumo

### Este subtítulo longo não constitui conteúdo acadêmico substantivo por si só

## Referências

### Esta linha formatada como título não constitui uma referência bibliográfica real

## Declaração de uso de inteligência artificial

### Esta linha formatada como título não constitui uma declaração substantiva válida
`,
    );
    await expect(finalizeWork({ root, id: "resumo-3-ai-science-focus", date: "2026-10-10" })).rejects.toThrow(
      /incompleta/i,
    );
    const fakeGitHubToken = `ghp_${"a".repeat(20)}`;
    await writeFile(
      documentPath,
      `# Resumo 3

## Resumo

Este texto contém uma credencial sintética que jamais pode alcançar o documento público: ${fakeGitHubToken}

## Referências

AUTOR, A. Referência bibliográfica válida para o teste. 2026.

## Declaração de uso de inteligência artificial

IA utilizada somente para apoiar a revisão linguística deste teste controlado.
`,
    );
    await expect(finalizeWork({ root, id: "resumo-3-ai-science-focus", date: "2026-10-10" })).rejects.toThrow(
      /segredo|credencial/i,
    );
    await writeFile(
      documentPath,
      `# Resumo 3 — AI tools expand scientists impact but contract sciences focus

## Resumo

Este é o texto autoral completo usado para verificar o fluxo de publicação acadêmica.

## Considerações críticas

A análise distingue associação, causalidade e limites das métricas apresentadas.

## Referências

HAO, Q. et al. Artificial intelligence tools expand scientists impact but contract sciences focus.

## Declaração de uso de inteligência artificial

IA generativa foi utilizada na revisão linguística; seleção de evidências e conclusões são do autor.
`,
    );

    const result = await finalizeWork({ root, id: "resumo-3-ai-science-focus", date: "2026-10-10" });

    expect(result.pdfPath).toBe(resolve(root, "public/documents/works/resumo-3-ai-science-focus.pdf"));
    const finalizedPage = await readFile(pagePath, "utf8");
    expect(finalizedPage).toContain("draft: false");
    expect(finalizedPage).toContain("status: completed");
    expect(finalizedPage).toContain("artifact: /documents/works/resumo-3-ai-science-focus.pdf");
    expect(finalizedPage).toContain("Trabalho finalizado e PDF verificado.");
    deliverables = parse(await readFile(resolve(root, "src/data/deliverables.yml"), "utf8"));
    expect(deliverables[0].status).toBe("completed");

    expect(await generateAllWorkPdfs({ root })).toEqual([result.pdfPath]);
  });

  it("rejects repository symlinks that could escape the controlled content roots", async () => {
    const root = await createFixture();
    const outside = await mkdtemp(resolve(tmpdir(), "academic-workflow-outside-"));
    temporaryRoots.push(outside);
    await mkdir(resolve(root, "src/content/works"), { recursive: true });
    await symlink(outside, resolve(root, "src/content/works/resumo-3-ai-science-focus"), "junction");

    await expect(createWork({ root, id: "resumo-3-ai-science-focus", date: "2026-09-16" })).rejects.toThrow(
      /link simbólico/i,
    );
    await expect(generateWorkPdf({ root, id: "resumo-3-ai-science-focus" })).rejects.toThrow(/link simbólico/i);
  });

  it("rolls back metadata and the public artifact when final replacement fails", async () => {
    const root = await createFixture();
    const { documentPath, pagePath } = await createWork({ root, id: "resumo-3-ai-science-focus", date: "2026-09-16" });
    await writeFile(documentPath, `# Resumo de validação

## Resumo

Texto autoral completo e suficientemente desenvolvido para validar o rollback da finalização.

## Referências

AUTOR, A. Referência controlada para o teste de rollback. 2026.

## Declaração de uso de inteligência artificial

IA utilizada somente para apoiar a verificação técnica deste fluxo de teste.
`);
    const page = await readFile(pagePath, "utf8");
    await writeFile(pagePath, page.replace(
      "[Escreva aqui uma apresentação pública breve do trabalho, sem repetir o texto integral.]",
      "Apresentação pública completa usada para validar a restauração transacional dos metadados.",
    ));

    let shouldFailRename = true;
    await expect(finalizeWork({
      root,
      id: "resumo-3-ai-science-focus",
      date: "2026-10-10",
      operations: {
        rename: async (source: string, destination: string) => {
          if (destination.endsWith("deliverables.yml") && shouldFailRename) {
            shouldFailRename = false;
            throw new Error("falha injetada");
          }
          await rename(source, destination);
        },
      },
    })).rejects.toThrow(/falha injetada/i);

    expect(await readFile(pagePath, "utf8")).toContain("draft: true");
    expect(parse(await readFile(resolve(root, "src/data/deliverables.yml"), "utf8"))[0].status).toBe("in-progress");
    await expect(access(resolve(root, "public/documents/works/resumo-3-ai-science-focus.pdf"))).rejects.toThrow();
  });

  it("rolls back a partially installed new work and preserves canonical metadata", async () => {
    const root = await createFixture();
    const deliverablesPath = resolve(root, "src/data/deliverables.yml");
    const originalDeliverables = await readFile(deliverablesPath, "utf8");
    let shouldFailRename = true;

    await expect(createWork({
      root,
      id: "resumo-3-ai-science-focus",
      date: "2026-09-16",
      operations: {
        rename: async (source: string, destination: string) => {
          if (destination.endsWith("deliverables.yml") && shouldFailRename) {
            shouldFailRename = false;
            throw new Error("falha de criação injetada");
          }
          await rename(source, destination);
        },
      },
    })).rejects.toThrow(/falha de criação injetada/i);

    await expect(access(resolve(root, "src/content/works/resumo-3-ai-science-focus/work.md"))).rejects.toThrow();
    await expect(access(resolve(root, "src/content/works/resumo-3-ai-science-focus/index.md"))).rejects.toThrow();
    await expect(access(resolve(root, "src/content/works/resumo-3-ai-science-focus"))).rejects.toThrow();
    expect(await readFile(deliverablesPath, "utf8")).toBe(originalDeliverables);
  });

  it("rejects malformed canonical dueAt values instead of accepting partial timestamps", async () => {
    for (const invalidDueAt of [
      "2026-10-11Tgarbage",
      "2026-10-11T23:59-03:00",
      "2026-10-11T23:59:00+14:59",
    ]) {
      const root = await createFixture();
      const deliverablesPath = resolve(root, "src/data/deliverables.yml");
      await writeFile(
        deliverablesPath,
        (await readFile(deliverablesPath, "utf8")).replace(
          "2026-10-11T23:59:00-03:00",
          invalidDueAt,
        ),
      );

      await expect(createWork({
        root,
        id: "resumo-3-ai-science-focus",
        date: "2026-09-16",
      })).rejects.toThrow(/dueAt|data e hora ISO/i);
    }
  });

  it("rejects credentials present only in public page frontmatter", async () => {
    const root = await createFixture();
    const { documentPath, pagePath } = await createWork({ root, id: "resumo-3-ai-science-focus", date: "2026-09-16" });
    const fakeGitHubToken = `ghp_${"c".repeat(20)}`;
    await writeFile(documentPath, `# Resumo seguro

## Resumo

Texto acadêmico autoral completo e sem credenciais no corpo da fonte integral.

## Referências

AUTOR, A. Referência bibliográfica controlada. 2026.

## Declaração de uso de inteligência artificial

IA utilizada somente para revisão linguística neste teste controlado.
`);
    await writeFile(
      pagePath,
      (await readFile(pagePath, "utf8"))
        .replace(
          "[Escreva aqui uma apresentação pública breve do trabalho, sem repetir o texto integral.]",
          "Apresentação pública completa e sem credenciais no corpo desta página de validação.",
        )
        .replace(
          "Consulte a declaração completa de uso de inteligência artificial no documento.",
          `Uso declarado com metadado sintético proibido ${fakeGitHubToken}`,
        ),
    );

    await expect(finalizeWork({
      root,
      id: "resumo-3-ai-science-focus",
      date: "2026-10-10",
    })).rejects.toThrow(/GitHub token|segredo|credencial/i);
  });

  it("detects a synthetic credential introduced only through rendered PDF metadata", async () => {
    const root = await createFixture();
    const deliverablesPath = resolve(root, "src/data/deliverables.yml");
    const fakeGitHubToken = `ghp_${"b".repeat(20)}`;
    await writeFile(
      deliverablesPath,
      (await readFile(deliverablesPath, "utf8")).replace(
        "Resumo 3 — AI tools expand scientists impact but contract sciences focus",
        `Resumo seguro ${fakeGitHubToken}`,
      ),
    );
    await createWork({ root, id: "resumo-3-ai-science-focus", date: "2026-09-16" });
    const documentPath = resolve(root, "src/content/works/resumo-3-ai-science-focus/work.md");
    const pagePath = resolve(root, "src/content/works/resumo-3-ai-science-focus/index.md");
    await writeFile(documentPath, `# Resumo seguro

## Resumo

Texto acadêmico autoral completo e sem credenciais no conteúdo da fonte integral.

## Referências

AUTOR, A. Referência bibliográfica controlada. 2026.

## Declaração de uso de inteligência artificial

IA utilizada somente para revisão linguística neste teste controlado.
`);
    await writeFile(
      pagePath,
      (await readFile(pagePath, "utf8")).replace(
        "[Escreva aqui uma apresentação pública breve do trabalho, sem repetir o texto integral.]",
        "Apresentação pública completa e sem credenciais no corpo desta página de validação.",
      ),
    );

    await expect(finalizeWork({
      root,
      id: "resumo-3-ai-science-focus",
      date: "2026-10-10",
    })).rejects.toThrow(/GitHub token/i);
  });
});
