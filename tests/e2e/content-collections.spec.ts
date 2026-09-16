import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = "/26Q3_research_methodology";

const sections = [
  {
    link: "Trabalhos",
    path: "trabalhos",
    heading: "Trabalhos acadêmicos",
    expectedItem: "Resumo 1 — How to Have a Bad Career in Research/Academia",
  },
  {
    link: "Anotações",
    path: "anotacoes",
    heading: "Anotações de pesquisa",
    expectedItem: "Boas-vindas ao caderno de pesquisa",
  },
  {
    link: "Biblioteca",
    path: "biblioteca",
    heading: "Biblioteca comentada",
    expectedItem: "How to read a paper",
  },
  {
    link: "Código",
    path: "codigo",
    heading: "Código e experimentos",
    empty: "Nenhum projeto publicado ainda.",
  },
];

const representativeDetails = [
  {
    path: "trabalhos/resumo-1-bad-career",
    heading: "Resumo 1 — How to Have a Bad Career in Research/Academia",
    notice: "Declaração de uso de IA",
  },
  {
    path: "anotacoes/aula-2026-09-14",
    heading: "Aula de 14/09 — início do percurso",
  },
  {
    path: "biblioteca/how-to-read-a-paper",
    heading: "How to read a paper",
  },
];

test("header exposes every academic collection index with base-aware links", async ({ page }) => {
  await page.goto(`${base}/`);

  for (const section of sections) {
    const link = page.getByRole("link", { name: section.link, exact: true });
    await expect(link).toHaveAttribute("href", `${base}/${section.path}/`);
  }
});

for (const section of sections) {
  test(`${section.path} has an accessible editorial index`, async ({ page }) => {
    await page.goto(`${base}/${section.path}/`);

    await expect(page.getByRole("heading", { level: 1, name: section.heading })).toBeVisible();
    if (section.expectedItem) {
      await expect(page.getByRole("link", { name: section.expectedItem, exact: true })).toBeVisible();
    } else {
      await expect(page.getByText(section.empty ?? "", { exact: true })).toBeVisible();
    }
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

for (const detail of representativeDetails) {
  test(`${detail.path} renders published content accessibly`, async ({ page }) => {
    await page.goto(`${base}/${detail.path}/`);

    await expect(page.getByRole("heading", { level: 1, name: detail.heading })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Sumário deste conteúdo" })).toBeVisible();
    if (detail.notice) {
      await expect(page.getByRole("heading", { name: detail.notice })).toBeVisible();
    }

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("collection indexes remain usable without horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });

  for (const section of sections) {
    await page.goto(`${base}/${section.path}/`);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});
