import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const homePagePath = resolve(projectRoot, "src/pages/index.astro");
const baseLayoutPath = resolve(projectRoot, "src/layouts/BaseLayout.astro");
const headerPath = resolve(projectRoot, "src/components/layout/Header.astro");
const footerPath = resolve(projectRoot, "src/components/layout/Footer.astro");
const tokensPath = resolve(projectRoot, "src/styles/tokens.css");
const globalStylesPath = resolve(projectRoot, "src/styles/global.css");
const printStylesPath = resolve(projectRoot, "src/styles/print.css");

describe("global page layout", () => {
  it("composes the home page from a reusable layout, header, and footer", () => {
    expect(existsSync(baseLayoutPath)).toBe(true);
    expect(existsSync(headerPath)).toBe(true);
    expect(existsSync(footerPath)).toBe(true);

    const homeSource = readFileSync(homePagePath, "utf8");
    const layoutSource = readFileSync(baseLayoutPath, "utf8");

    expect(homeSource).toContain('import BaseLayout from "../layouts/BaseLayout.astro"');
    expect(homeSource).toContain("<BaseLayout");
    expect(layoutSource).toContain('import Header from "../components/layout/Header.astro"');
    expect(layoutSource).toContain('import Footer from "../components/layout/Footer.astro"');
  });

  it("loads a responsive, printable, reduced-motion-aware design system", () => {
    expect(existsSync(tokensPath)).toBe(true);
    expect(existsSync(globalStylesPath)).toBe(true);
    expect(existsSync(printStylesPath)).toBe(true);

    const layoutSource = readFileSync(baseLayoutPath, "utf8");
    const tokensSource = readFileSync(tokensPath, "utf8");
    const globalSource = readFileSync(globalStylesPath, "utf8");
    const printSource = readFileSync(printStylesPath, "utf8");

    expect(layoutSource).toContain('import "../styles/global.css"');
    expect(layoutSource).toContain('import "../styles/print.css"');
    expect(globalSource).toContain('@import url("./tokens.css")');
    expect(tokensSource).toContain("--color-primary:");
    expect(tokensSource).toContain("--font-heading:");
    expect(globalSource).toContain("@media (max-width: 48rem)");
    expect(globalSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(printSource).toContain("@media print");
  });
});
