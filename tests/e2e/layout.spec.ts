import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const sitePath = "/26Q3_research_methodology/";

test("offers semantic navigation, a keyboard skip link, and complete page metadata", async ({ page }) => {
  await page.goto(sitePath);

  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Pular para o conteúdo" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveAttribute("href", "#conteudo");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://edupinhata.github.io/26Q3_research_methodology/",
  );
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "pt_BR");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
});

test("keeps the global layout usable at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(sitePath);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
});

test("has no serious or critical automated accessibility violations", async ({ page }) => {
  await page.goto(sitePath);

  const results = await new AxeBuilder({ page }).analyze();
  const blockingViolations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );

  expect(blockingViolations).toEqual([]);
});
