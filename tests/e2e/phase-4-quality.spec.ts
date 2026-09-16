import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const base = "/26Q3_research_methodology";
const representativePages = [
  `${base}/`,
  `${base}/disciplina/`,
  `${base}/timeline/`,
  `${base}/trabalhos/`,
  `${base}/anotacoes/`,
  `${base}/biblioteca/`,
  `${base}/codigo/`,
  `${base}/trabalhos/resumo-1-bad-career/`,
];

test("RSS identifies the deployed project site and keeps every item under the base path", async ({
  request,
}) => {
  const response = await request.get(`${base}/rss.xml`);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^(?:application\/rss\+xml|text\/xml)/);
  const xml = await response.text();
  expect(xml).toContain(
    "<link>https://edupinhata.github.io/26Q3_research_methodology/</link>",
  );
  for (const match of xml.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g)) {
    expect(match[1]).toMatch(
      /^https:\/\/edupinhata\.github\.io\/26Q3_research_methodology\//,
    );
  }
});

test("sitemap lists only project routes and every generated route resolves", async ({ request }) => {
  const indexResponse = await request.get(`${base}/sitemap-index.xml`);
  expect(indexResponse.status()).toBe(200);
  const index = await indexResponse.text();
  expect(index).toContain(
    "https://edupinhata.github.io/26Q3_research_methodology/sitemap-0.xml",
  );

  const sitemapResponse = await request.get(`${base}/sitemap-0.xml`);
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  expect(locations.length).toBeGreaterThanOrEqual(18);

  for (const location of locations) {
    expect(location).toMatch(
      /^https:\/\/edupinhata\.github\.io\/26Q3_research_methodology(?:\/|$)/,
    );
    const response = await request.get(new URL(location).pathname);
    expect(response.status(), location).toBe(200);
  }
});

test("internal links and fragments resolve under the GitHub Pages base path", async ({ page, request }) => {
  for (const path of [`${base}/`, `${base}/trabalhos/resumo-1-bad-career/`]) {
    await page.goto(path);
    const hrefs = await page.locator('a[href]:not([href^="http"]):not([href^="mailto:"])').evaluateAll(
      (anchors) => anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean) as string[],
    );

    for (const href of new Set(hrefs)) {
      if (href.startsWith("#")) {
        expect(await page.locator(href).count(), `${path} -> ${href}`).toBe(1);
        continue;
      }

      const target = new URL(href, page.url());
      expect(target.pathname, `${path} -> ${href}`).toMatch(
        /^\/26Q3_research_methodology(?:\/|$)/,
      );
      const response = await request.get(target.pathname);
      expect(response.status(), `${path} -> ${href}`).toBe(200);
      if (target.hash) {
        await page.goto(target.href);
        expect(await page.locator(target.hash).count(), target.href).toBe(1);
      }
    }
  }
});

test("principal pages have no axe violations and do not overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });

  for (const path of representativePages) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth, path).toBeLessThanOrEqual(dimensions.clientWidth);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
});

test("keyboard users can activate the skip link and reach main content", async ({ page }) => {
  await page.goto(`${base}/`);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#conteudo")).toBeFocused();
});

test("a representative work produces a readable A4 print artifact", async ({ page }) => {
  await page.goto(`${base}/trabalhos/resumo-1-bad-career/`);
  await page.emulateMedia({ media: "print" });

  await expect(page.locator("header.site-header")).toHaveCSS("display", "none");
  await expect(page.locator("article.content-article")).toBeVisible();
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  expect(pdf.byteLength).toBeGreaterThan(10_000);
});

test("production metadata exposes canonical social cards and truthful structured data", async ({
  page,
  request,
}) => {
  await page.goto(`${base}/disciplina/`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://edupinhata.github.io/26Q3_research_methodology/disciplina/",
  );
  const openGraphImage = "https://edupinhata.github.io/26Q3_research_methodology/og-default.png";
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    openGraphImage,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://edupinhata.github.io/26Q3_research_methodology/disciplina/",
  );
  const imageResponse = await request.get(new URL(openGraphImage).pathname);
  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()["content-type"]).toContain("image/png");
  const imageDimensions = await page.evaluate(async (src) => {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error(`Não foi possível carregar ${src}`)), {
        once: true,
      });
    });
    image.src = src;
    await loaded;
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, `${base}/og-default.png`);
  expect(imageDimensions).toEqual({ width: 1200, height: 630 });

  const faviconHref = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(faviconHref).toBe(`${base}/favicon.svg`);
  const faviconResponse = await request.get(faviconHref ?? "");
  expect(faviconResponse.status()).toBe(200);
  expect(faviconResponse.headers()["content-type"]).toContain("image/svg+xml");
  const course = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
  );
  expect(course).toMatchObject({
    "@type": "Course",
    courseCode: "CCM-002",
    provider: { "@type": "EducationalOrganization", name: "UFABC" },
  });

  await page.goto(`${base}/trabalhos/resumo-1-bad-career/`);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  const article = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
  );
  expect(article).toMatchObject({
    "@type": "Article",
    inLanguage: "pt-BR",
    mainEntityOfPage:
      "https://edupinhata.github.io/26Q3_research_methodology/trabalhos/resumo-1-bad-career/",
  });
  expect(article.headline).toContain("Resumo 1");
  expect(new Date(article.dateModified).getTime()).toBeGreaterThanOrEqual(
    new Date(article.datePublished).getTime(),
  );

  await page.goto(`${base}/biblioteca/how-to-read-a-paper/`);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
  const libraryPage = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
  );
  expect(libraryPage).toMatchObject({
    "@type": "WebPage",
    url: "https://edupinhata.github.io/26Q3_research_methodology/biblioteca/how-to-read-a-paper/",
  });
  expect(libraryPage).not.toHaveProperty("headline");
  expect(libraryPage).not.toHaveProperty("mainEntityOfPage");
});

test("production output contains neither drafts nor credential-shaped secrets", () => {
  const scanner = resolve(process.cwd(), "scripts/scan-public-build.mjs");
  expect(() =>
    execFileSync(process.execPath, [scanner], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe",
    }),
  ).not.toThrow();
});
