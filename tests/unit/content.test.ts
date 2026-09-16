import { describe, expect, it } from "vitest";
import { academicSchemas } from "../../src/content/schemas";
import {
  collectFilterOptions,
  filterContent,
  getAdjacentContent,
  selectPublishedContent,
  type AcademicContent,
} from "../../src/utils/content";

const entries: AcademicContent[] = [
  {
    id: "antigo",
    data: {
      title: "Conteúdo antigo",
      description: "Publicado antes dos demais.",
      publishedAt: new Date("2026-09-14"),
      tags: ["método", "leitura"],
      draft: false,
      category: "summary",
      status: "reviewed",
    },
  },
  {
    id: "rascunho",
    data: {
      title: "Rascunho privado",
      description: "Não pode aparecer em páginas públicas.",
      publishedAt: new Date("2026-09-16"),
      tags: ["método"],
      draft: true,
      category: "note",
      status: "draft",
    },
  },
  {
    id: "recente",
    data: {
      title: "Conteúdo recente",
      description: "Publicado por último.",
      publishedAt: new Date("2026-09-15"),
      tags: ["leitura", "IA"],
      draft: false,
      category: "article",
      status: "reviewed",
    },
  },
];

describe("academic content publication", () => {
  it("excludes drafts, sorts newest first, and does not mutate the source", () => {
    expect(selectPublishedContent(entries).map(({ id }) => id)).toEqual(["recente", "antigo"]);
    expect(entries.map(({ id }) => id)).toEqual(["antigo", "rascunho", "recente"]);
  });

  it("filters published entries by category, status, and normalized tag", () => {
    expect(filterContent(entries, { category: "article" }).map(({ id }) => id)).toEqual(["recente"]);
    expect(filterContent(entries, { status: "reviewed", tag: "ia" }).map(({ id }) => id)).toEqual([
      "recente",
    ]);
    expect(filterContent(entries, { tag: "método" }).map(({ id }) => id)).toEqual(["antigo"]);
  });

  it("collects stable, deduplicated filter options without draft-only values", () => {
    expect(collectFilterOptions(entries)).toEqual({
      categories: ["article", "summary"],
      statuses: ["reviewed"],
      tags: ["IA", "leitura", "método"],
    });
  });

  it("builds older and newer navigation from the published sequence", () => {
    const adjacent = getAdjacentContent(entries, "antigo");

    expect(adjacent.older).toBeNull();
    expect(adjacent.newer?.id).toBe("recente");
    expect(getAdjacentContent(entries, "rascunho")).toEqual({ older: null, newer: null });
  });
});

describe("academic collection schemas", () => {
  const common = {
    title: "Título autoral",
    description: "Descrição editorial suficiente.",
    publishedAt: "2026-09-15",
    tags: ["metodologia"],
    draft: false,
  };

  it("accepts a complete work and requires its AI-use declaration", () => {
    const result = academicSchemas.works.safeParse({
      ...common,
      type: "summary",
      status: "reviewed",
      dueAt: "2026-09-20T23:59:00-03:00",
      courseWeek: 1,
      aiUsage: "IA não utilizada neste artefato.",
      revisions: [{ date: "2026-09-15", description: "Revisão inicial." }],
    });

    expect(result.success).toBe(true);
    expect(academicSchemas.works.safeParse({ ...common, type: "summary", status: "reviewed" }).success).toBe(
      false,
    );
  });

  it("requires a semantic kind distinct from status for notes", () => {
    expect(
      academicSchemas.notes.safeParse({ ...common, kind: "class", status: "reviewed" }).success,
    ).toBe(true);
    expect(academicSchemas.notes.safeParse({ ...common, status: "reviewed" }).success).toBe(false);
  });

  it("rejects unsafe external URLs and traversal in artifact paths with clear messages", () => {
    const library = academicSchemas.library.safeParse({
      ...common,
      kind: "article",
      status: "read",
      sourceUrl: "javascript:alert(1)",
    });
    const work = academicSchemas.works.safeParse({
      ...common,
      type: "summary",
      status: "reviewed",
      dueAt: "2026-09-20T23:59:00-03:00",
      courseWeek: 1,
      aiUsage: "IA não utilizada.",
      artifact: "/documents/../private.pdf",
    });

    expect(library.error?.issues[0]?.message).toContain("HTTP ou HTTPS");
    expect(work.error?.issues.some(({ message }) => message.includes("caminho público"))).toBe(true);
  });

  it("rejects encoded artifact traversal, embedded credentials, and session query parameters", () => {
    const work = academicSchemas.works.safeParse({
      ...common,
      type: "summary",
      status: "reviewed",
      dueAt: "2026-09-20T23:59:00-03:00",
      courseWeek: 1,
      aiUsage: "IA não utilizada.",
      artifact: "/documents/%2e%2e/private.pdf",
    });
    const credentialUrl = academicSchemas.library.safeParse({
      ...common,
      kind: "article",
      status: "read",
      sourceUrl: "https://user:password@example.test/article",
    });
    const sessionUrl = academicSchemas.library.safeParse({
      ...common,
      kind: "article",
      status: "read",
      sourceUrl: "https://moodle.example.test/article?sesskey=a1b2c3",
    });
    const encodedSessionUrl = academicSchemas.library.safeParse({
      ...common,
      kind: "article",
      status: "read",
      sourceUrl: "https://moodle.example.test/article?%73esskey=a1b2c3",
    });
    const bypassUrls = [
      "https://example.test/?session_key=a1b2c3",
      "https://example.test/?session_token=a1b2c3",
      "https://example.test/?auth_token=a1b2c3",
      "https://example.test/?refresh_token=a1b2c3",
      "https://example.test/?client_secret=a1b2c3",
      "https://example.test/?%2573esskey=a1b2c3",
      "https://example.test/a;jsessionid=a1b2c3",
      "https://example.test/a%3Bjsessionid=a1b2c3",
      "https://example.test/article#access_token=a1b2c3",
      "https://example.test/?PHPSESSID=a1b2c3",
      "https://example.test/a;PHPSESSID=a1b2c3",
      "https://example.test/a;sessid=a1b2c3",
      "https://example.test/#sid=a1b2c3",
      "https://example.test/?next=https%253A%252F%252Fnested.test%252F%253FPHPSESSID%253Da1b2c3",
    ];

    expect(work.success).toBe(false);
    expect(credentialUrl.error?.issues[0]?.message).toContain("credenciais");
    expect(sessionUrl.error?.issues[0]?.message).toContain("sessão");
    expect(encodedSessionUrl.error?.issues[0]?.message).toContain("sessão");
    for (const sourceUrl of bypassUrls) {
      const result = academicSchemas.library.safeParse({
        ...common,
        kind: "article",
        status: "read",
        sourceUrl,
      });
      expect(result.success, sourceUrl).toBe(false);
    }
  });

  it("requires ISO dates and an explicit timezone in work deadlines", () => {
    const work = (dueAt: string) =>
      academicSchemas.works.safeParse({
        ...common,
        type: "summary",
        status: "reviewed",
        dueAt,
        courseWeek: 1,
        aiUsage: "IA não utilizada.",
      });

    expect(work("2026-09-20T23:59:00-03:00").success).toBe(true);
    expect(work("2026-09-20").success).toBe(false);
    expect(work("2026-09-20T23:59:00").success).toBe(false);
    expect(work("09/20/2026").success).toBe(false);
    expect(work("2026-02-30T23:59:00-03:00").success).toBe(false);
    expect(
      academicSchemas.notes.safeParse({
        ...common,
        kind: "class",
        publishedAt: "09/15/2026",
        status: "reviewed",
      })
        .success,
    ).toBe(false);
  });
});
