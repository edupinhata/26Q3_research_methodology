import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const astroConfigPath = resolve(projectRoot, "astro.config.mjs");
const tsconfigPath = resolve(projectRoot, "tsconfig.json");
const homePagePath = resolve(projectRoot, "src/pages/index.astro");

describe("Astro GitHub Pages configuration", () => {
  it("defines the repository site and base path", () => {
    expect(existsSync(astroConfigPath)).toBe(true);

    const source = readFileSync(astroConfigPath, "utf8");
    expect(source).toContain('site: "https://edupinhata.github.io"');
    expect(source).toContain('base: "/26Q3_research_methodology"');
  });

  it("uses Astro's strict TypeScript preset", () => {
    expect(existsSync(tsconfigPath)).toBe(true);

    const config = JSON.parse(readFileSync(tsconfigPath, "utf8"));
    expect(config.extends).toBe("astro/tsconfigs/strict");
  });

  it("provides a Portuguese home page with base-aware internal links", () => {
    expect(existsSync(homePagePath)).toBe(true);

    const source = readFileSync(homePagePath, "utf8");
    expect(source).toContain('lang="pt-BR"');
    expect(source).toContain("import.meta.env.BASE_URL");
  });
});
