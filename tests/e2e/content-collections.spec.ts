import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = "/26Q3_research_methodology";

const sections = [
  {
    link: "Trabalhos",
    path: "trabalhos",
    heading: "Trabalhos acadêmicos",
    empty: "Nenhum trabalho publicado ainda.",
  },
  {
    link: "Anotações",
    path: "anotacoes",
    heading: "Anotações de pesquisa",
    empty: "Nenhuma anotação publicada ainda.",
  },
  {
    link: "Biblioteca",
    path: "biblioteca",
    heading: "Biblioteca comentada",
    empty: "Nenhuma leitura publicada ainda.",
  },
  {
    link: "Código",
    path: "codigo",
    heading: "Código e experimentos",
    empty: "Nenhum projeto publicado ainda.",
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
  test(`${section.path} has an accessible empty editorial index`, async ({ page }) => {
    await page.goto(`${base}/${section.path}/`);

    await expect(page.getByRole("heading", { level: 1, name: section.heading })).toBeVisible();
    await expect(page.getByText(section.empty, { exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();

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
