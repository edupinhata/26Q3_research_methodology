import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = "/26Q3_research_methodology";

test("navigates from the header using the GitHub Pages base path", async ({ page }) => {
  for (const destination of [
    { name: "Disciplina", path: "disciplina", heading: "Sobre a disciplina" },
    { name: "Timeline", path: "timeline", heading: "Timeline da disciplina" },
  ]) {
    await page.goto(`${base}/`);
    await page.getByRole("link", { name: destination.name, exact: true }).click();

    await expect(page).toHaveURL(`${base}/${destination.path}/`);
    await expect(page.getByRole("heading", { level: 1, name: destination.heading })).toBeVisible();
  }
});

test("course page presents objectives, meetings, topics, assessment, and Moodle provenance", async ({
  page,
}) => {
  await page.goto(`${base}/disciplina/`);

  await expect(
    page.getByRole("heading", { level: 1, name: "Sobre a disciplina" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Objetivos" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Tópicos do percurso" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Encontros presenciais" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Sistema de avaliação" })).toBeVisible();
  await expect(page.getByText("Última conferência no Moodle: 14 de setembro de 2026.")).toBeVisible();
  await expect(page.getByText("A2", { exact: true })).toBeVisible();
  await expect(page.getByText("peso 2", { exact: true })).toBeVisible();
});

test("timeline exposes the complete chronological calendar and type labels", async ({ page }) => {
  await page.goto(`${base}/timeline/`);

  await expect(page.getByRole("heading", { level: 1, name: "Timeline da disciplina" })).toBeVisible();
  const timeline = page.getByRole("region", { name: "Calendário cronológico" });
  await expect(timeline).toBeVisible();
  await expect(timeline.locator("article")).toHaveCount(35);
  await expect(timeline.locator("time").first()).toHaveAttribute("datetime", "2026-09-14");
  await expect(timeline.locator("time").last()).toHaveAttribute("datetime", "2026-12-16");

  for (const label of ["Aula", "Feriado", "Prazo", "Apresentação", "Reposição"]) {
    await expect(timeline.getByText(label, { exact: true }).first()).toBeVisible();
  }

  const dates = await timeline.locator("article").evaluateAll((articles) =>
    articles.map((article) => article.querySelector("time")?.getAttribute("datetime")),
  );
  expect(dates).toEqual([...dates].sort());
});

test("course and timeline pages are accessible and remain readable at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });

  for (const path of ["disciplina", "timeline"]) {
    await page.goto(`${base}/${path}/`);
    await expect(page.locator("body")).toHaveCSS("overflow-x", "visible");
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});
