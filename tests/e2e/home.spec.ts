import { expect, test } from "@playwright/test";

test("serves the home page from the GitHub Pages base path", async ({ request }) => {
  const response = await request.get("/26Q3_research_methodology/");

  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("<title>CCM-002 — Metodologia de Pesquisa</title>");
  expect(html).toContain('href="/26Q3_research_methodology"');
});
