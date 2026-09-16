import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "../../src/utils/seo";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const baseLayoutPath = resolve(projectRoot, "src/layouts/BaseLayout.astro");
const faviconPath = resolve(projectRoot, "public/favicon.svg");
const openGraphImagePath = resolve(projectRoot, "public/og-default.png");
const astroConfigPath = resolve(projectRoot, "astro.config.mjs");
const rssPagePath = resolve(projectRoot, "src/pages/rss.xml.ts");
const contentLayoutPath = resolve(projectRoot, "src/layouts/ContentLayout.astro");
const coursePagePath = resolve(projectRoot, "src/pages/disciplina.astro");

describe("discovery metadata", () => {
  it("publishes original identity assets and complete social-card metadata", () => {
    expect(existsSync(faviconPath)).toBe(true);
    expect(existsSync(openGraphImagePath)).toBe(true);
    expect(statSync(openGraphImagePath).size).toBeGreaterThan(10_000);

    const layoutSource = readFileSync(baseLayoutPath, "utf8");
    expect(layoutSource).toContain('rel="icon"');
    expect(layoutSource).toContain('property="og:image"');
    expect(layoutSource).toContain('property="og:image:width"');
    expect(layoutSource).toContain('property="og:image:height"');
    expect(layoutSource).toContain('name="twitter:card"');
  });

  it("generates a base-aware sitemap and RSS feed for published notes and works", () => {
    expect(existsSync(rssPagePath)).toBe(true);

    const astroConfigSource = readFileSync(astroConfigPath, "utf8");
    const rssSource = readFileSync(rssPagePath, "utf8");
    expect(astroConfigSource).toContain('@astrojs/sitemap');
    expect(astroConfigSource).toContain("integrations: [sitemap()]");
    expect(rssSource).toContain('@astrojs/rss');
    expect(rssSource).toContain('getCollection("notes"');
    expect(rssSource).toContain('getCollection("works"');
    expect(rssSource).toContain("!data.draft");
    expect(rssSource).toContain("context.site");
  });

  it("serializes JSON-LD without allowing a script-closing payload", () => {
    const serialized = serializeJsonLd({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "</script><script>globalThis.pwned = true</script>",
    });

    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain("</script>");
    expect(JSON.parse(serialized).headline).toBe(
      "</script><script>globalThis.pwned = true</script>",
    );
  });

  it("publishes truthful Course and Article JSON-LD through the shared layout", () => {
    const baseLayoutSource = readFileSync(baseLayoutPath, "utf8");
    const contentLayoutSource = readFileSync(contentLayoutPath, "utf8");
    const coursePageSource = readFileSync(coursePagePath, "utf8");

    expect(baseLayoutSource).toContain("jsonLd?:");
    expect(baseLayoutSource).toContain('type="application/ld+json"');
    expect(baseLayoutSource).toContain("serializeJsonLd(jsonLd)");
    expect(contentLayoutSource).toContain('"@type": "Article"');
    expect(contentLayoutSource).toContain('"@type": "WebPage"');
    expect(contentLayoutSource).toContain("datePublished:");
    expect(contentLayoutSource).toContain('structuredDataType === "Article"');
    expect(coursePageSource).toContain('"@type": "Course"');
    expect(coursePageSource).toContain("courseCode: course.code");
    expect(coursePageSource).toContain("provider:");
  });
});
