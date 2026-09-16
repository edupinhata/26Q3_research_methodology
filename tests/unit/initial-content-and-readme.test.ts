import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { academicSchemas } from "../../src/content/schemas";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const expectedContent = {
  notes: ["boas-vindas.md", "aula-2026-09-14.md"],
  works: [
    "resumo-1-bad-career.md",
    "resumo-2-how-to-read-a-paper.md",
    "survey-review.md",
    "diario-pre-projeto.md",
  ],
  library: [
    "how-to-read-a-paper.md",
    "ai-tools-science-focus.md",
    "general-scales-ai-evaluation.md",
    "end-to-end-ai-research.md",
    "autonomous-ai-human-values.md",
  ],
} as const;

function readFrontmatter(path: string): unknown {
  const source = readFileSync(path, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  expect(match, `${path} deve possuir frontmatter YAML`).not.toBeNull();
  return parse(match?.[1] ?? "");
}

describe("conteúdo autoral inicial", () => {
  it("publica o conjunto editorial previsto com frontmatter válido", () => {
    for (const [collection, files] of Object.entries(expectedContent)) {
      for (const file of files) {
        const path = resolve(projectRoot, "src", "content", collection, file);
        expect(existsSync(path), path).toBe(true);
        expect(extname(path)).toBe(".md");

        const frontmatter = readFrontmatter(path) as { draft?: boolean };
        const result = academicSchemas[collection as keyof typeof academicSchemas].safeParse(frontmatter);
        expect(result.success, result.error?.message).toBe(true);
        expect(frontmatter.draft, `${file} deve estar publicado`).toBe(false);
      }
    }
  });

  it("mantém o conteúdo público livre de marcadores de sessão e cópia de enunciado restrito", () => {
    const forbidden = /(?:moodlesession|sesskey|jsessionid|copiado do moodle|enunciado integral)/i;

    for (const [collection, files] of Object.entries(expectedContent)) {
      for (const file of files) {
        const path = resolve(projectRoot, "src", "content", collection, file);
        expect(existsSync(path), path).toBe(true);
        const source = readFileSync(path, "utf8");
        expect(source).not.toMatch(forbidden);
      }
    }
  });

  it("atribui publicamente a fonte do Resumo 1", () => {
    const source = readFileSync(resolve(projectRoot, "src/content/works/resumo-1-bad-career.md"), "utf8");

    expect(source).toContain("David A. Patterson");
    expect(source).toContain("https://people.eecs.berkeley.edu/~pattrsn/talks/BadCareer.pdf");
  });

  it("reflete o início efetivo do Resumo 1 na fonte única de prazos", () => {
    const deliverables = parse(readFileSync(resolve(projectRoot, "src/data/deliverables.yml"), "utf8")) as Array<{
      id: string;
      status: string;
    }>;

    expect(deliverables.find(({ id }) => id === "resumo-1-bad-career")?.status).toBe("in-progress");
  });
});

describe("README como porta de entrada", () => {
  const readmePath = resolve(projectRoot, "README.md");

  it("apresenta site, deploy, captura, estrutura, execução local e políticas editoriais", () => {
    const readme = readFileSync(readmePath, "utf8");

    expect(readme).toContain("https://edupinhata.github.io/26Q3_research_methodology/");
    expect(readme).toContain("actions/workflows/deploy-pages.yml/badge.svg");
    expect(readme).toContain("public/images/site-preview.png");
    expect(readme).toContain("npm ci");
    expect(readme).toContain("npm run test:e2e");
    expect(readme).toMatch(/materiais restritos/i);
    expect(readme).toMatch(/uso de IA/i);
    expect(readme).toMatch(/licen[çc]a/i);
  });

  it("inclui licença separada para código e conteúdo autoral e uma captura PNG real", () => {
    const licensePath = resolve(projectRoot, "LICENSE");
    const previewPath = resolve(projectRoot, "public/images/site-preview.png");

    expect(existsSync(licensePath)).toBe(true);
    expect(readFileSync(licensePath, "utf8")).toContain("MIT License");
    expect(readFileSync(licensePath, "utf8")).toContain("All rights reserved");
    expect(existsSync(previewPath)).toBe(true);
    expect(readFileSync(previewPath).subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });
});
