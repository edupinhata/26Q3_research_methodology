import { expect, test } from "@playwright/test";

test("serves the home page from the GitHub Pages base path", async ({ request }) => {
  const response = await request.get("/26Q3_research_methodology/");

  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("<title>CCM-002 — Metodologia de Pesquisa</title>");
  expect(html).toContain('href="/26Q3_research_methodology"');
});

test("presents the course, deadline, progress, and published-content regions", async ({ page }) => {
  await page.goto("/26Q3_research_methodology/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Metodologia de Pesquisa em Ciência da Computação" }),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Resumo da disciplina" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Situação da próxima entrega" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Progresso das entregas" })).toHaveAttribute(
    "max",
    "10",
  );
  const recentContent = page.getByRole("region", { name: "Conteúdo recente" });
  await expect(recentContent).toContainText("Aula de 14/09 — início do percurso");
  await expect(
    recentContent.getByRole("link", { name: "Boas-vindas ao caderno de pesquisa", exact: true }),
  ).toHaveAttribute("href", "/26Q3_research_methodology/anotacoes/boas-vindas/");
});
