import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { academicSchemas } from "../../src/content/schemas";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const expectedPublishedContent = {
  notes: [
    "boas-vindas.md",
    "aula-2026-09-14.md",
    "survey-review.md",
    "diario-pre-projeto.md",
    "processo-resumo-1-bad-career.md",
    "processo-resumo-2-how-to-read-a-paper.md",
  ],
  works: ["resumo-1-bad-career.md", "resumo-2-how-to-read-a-paper.md"],
  library: [
    "how-to-read-a-paper.md",
    "ai-tools-science-focus.md",
    "general-scales-ai-evaluation.md",
    "end-to-end-ai-research.md",
    "autonomous-ai-human-values.md",
  ],
} as const;

const expectedDraftContent = {
  works: ["proposta-survey-review.md", "proposta-pre-projeto.md"],
} as const;

const migratedDocuments = [
  "resumo-1-bad-career",
  "resumo-2-how-to-read-a-paper",
  "proposta-survey-review",
  "proposta-pre-projeto",
] as const;

function readFrontmatter(path: string): unknown {
  const source = readFileSync(path, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  expect(match, `${path} deve possuir frontmatter YAML`).not.toBeNull();
  return parse(match?.[1] ?? "");
}

describe("conteúdo autoral inicial", () => {
  it("publica o conjunto editorial previsto com frontmatter válido", () => {
    for (const [collection, files] of Object.entries(expectedPublishedContent)) {
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

    for (const [collection, files] of Object.entries(expectedDraftContent)) {
      for (const file of files) {
        const path = resolve(projectRoot, "src", "content", collection, file);
        expect(existsSync(path), path).toBe(true);
        const frontmatter = readFrontmatter(path) as { draft?: boolean };
        const result = academicSchemas[collection as keyof typeof academicSchemas].safeParse(frontmatter);
        expect(result.success, result.error?.message).toBe(true);
        expect(frontmatter.draft, `${file} deve permanecer privado`).toBe(true);
      }
    }
  });

  it("mantém o conteúdo público livre de marcadores de sessão e cópia de enunciado restrito", () => {
    const forbidden = /(?:moodlesession|sesskey|jsessionid|copiado do moodle|enunciado integral)/i;
    const allContent = {
      ...expectedPublishedContent,
      works: [...expectedPublishedContent.works, ...expectedDraftContent.works],
    };

    for (const [collection, files] of Object.entries(allContent)) {
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

  it("separa registros de processo das fontes integrais sem fabricar trabalhos concluídos", () => {
    expect(existsSync(resolve(projectRoot, "src/content/works/survey-review.md"))).toBe(false);
    expect(existsSync(resolve(projectRoot, "src/content/works/diario-pre-projeto.md"))).toBe(false);

    for (const id of migratedDocuments) {
      const source = readFileSync(resolve(projectRoot, "documents", id, "work.md"), "utf8");
      expect(source).toContain("## Referências");
      expect(source).toContain("## Declaração de uso de inteligência artificial");
      expect(source).toMatch(/\[(?:Escreva|Registre|Informe|Descreva)/i);
    }

    const resumo1Process = readFileSync(resolve(projectRoot, "src/content/notes/processo-resumo-1-bad-career.md"), "utf8");
    expect(resumo1Process).toContain("## Método de trabalho");
    expect(resumo1Process).toContain("## Questões de leitura");
    const resumo2Process = readFileSync(resolve(projectRoot, "src/content/notes/processo-resumo-2-how-to-read-a-paper.md"), "utf8");
    expect(resumo2Process).toContain("## Plano de leitura");
    expect(resumo2Process).toContain("## Evidência esperada");

    const body = (source: string) => {
      const normalized = source.replaceAll(String.fromCharCode(13), "");
      return normalized.slice(normalized.indexOf("\n---\n", 4) + 5).trim();
    };
    const surveyProcess = readFileSync(resolve(projectRoot, "src/content/notes/survey-review.md"), "utf8");
    expect(body(surveyProcess)).toBe(`## Finalidade

Esta página acompanhará o survey/review desde a proposta até a apresentação. O objetivo é manter um rastro claro das decisões: recorte, pergunta, termos de busca, critérios de seleção, organização das evidências e limites da revisão.

## Decisões ainda abertas

- tema e pergunta central;
- bases e fontes de busca;
- período e tipos de publicação;
- critérios de inclusão e exclusão;
- forma de extração e síntese das evidências.

## Próximo marco

A primeira versão deverá justificar um recorte viável e demonstrar que a pergunta pode ser respondida por uma revisão de literatura dentro do tempo da disciplina.`);
    const preProjectProcess = readFileSync(resolve(projectRoot, "src/content/notes/diario-pre-projeto.md"), "utf8");
    expect(body(preProjectProcess)).toBe(`## Por que manter um diário

O pré-projeto não deve surgir apenas na data de entrega. Este diário registrará a evolução entre tema, problema, pergunta de pesquisa, evidências necessárias e método possível. Alterações serão preservadas no histórico de revisões em vez de apresentadas como se a ideia final tivesse surgido pronta.

## Critérios para uma pergunta promissora

A pergunta deverá ser específica o bastante para orientar coleta e análise, relevante para um público identificável, compatível com o tempo disponível e formulada de modo que resultados contrários à expectativa também sejam informativos.

## Estado atual

O tema ainda não foi definido. As leituras e discussões iniciais servirão para formar um conjunto de problemas candidatos antes da escolha de um recorte.`);

    expect(existsSync(resolve(projectRoot, "public/documents/works"))).toBe(false);
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
    expect(readme).toContain("npm run work:new");
    expect(readme).toContain("npm run work:pdf -- --all");
    expect(readme).toContain("docs/ACADEMIC_WORKFLOW.md");
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
