import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { chromium } from "@playwright/test";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const scannerPath = resolve(projectRoot, "scripts/scan-public-build.mjs");
const temporaryRoots: string[] = [];

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "public-build-scan-"));
  temporaryRoots.push(root);
  const dist = resolve(root, "dist");
  const content = resolve(root, "content");
  mkdirSync(dist, { recursive: true });
  mkdirSync(content, { recursive: true });
  return { dist, content };
}

function write(path: string, content: string | Uint8Array) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function scan(dist: string, content: string) {
  return () => {
    const result = spawnSync(process.execPath, [scannerPath, dist, content], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || `Scanner encerrado com status ${result.status}`);
    }
    return result.stdout;
  };
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("public build scanner", () => {
  it("accepts known text and binary formats when they are clean", () => {
    const { dist, content } = fixture();
    write(resolve(dist, "index.html"), "<h1>Conteúdo público</h1>");
    write(resolve(dist, "manifest.json"), '{"name":"CCM-002"}');
    write(resolve(dist, "favicon.svg"), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    write(resolve(dist, "image.png"), new Uint8Array([0x89, 0x50, 0x4e, 0x47]));

    expect(scan(dist, content)).not.toThrow();
  });

  it.each([
    ["private key", "-----BEGIN PRIVATE KEY-----\\nsecret\\n-----END PRIVATE KEY-----"],
    ["JWT", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signaturevalue"],
    ["Bearer token", "Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456"],
    ["GitHub token", "github_pat_11AA00abcdefghijklmnopqrstuv"],
    ["OpenAI-style token", "api_key='sk-proj-abcdefghijklmnopqrstuvwxyz'"],
    ["encoded session parameter", "https://example.test/?sesskey%3Dprivate-value"],
    ["double-encoded credential", "https://example.test/?password%253Dsupersecretvalue"],
  ])("rejects a %s in any public text artifact", (_label, secret) => {
    const { dist, content } = fixture();
    write(resolve(dist, "assets/data.map"), secret);

    expect(scan(dist, content)).toThrow();
  });

  it("rejects percent-encoding that does not stabilize within the canonicalization limit", () => {
    const { dist, content } = fixture();
    let encoded = "password=supersecretvalue";
    for (let depth = 0; depth < 9; depth += 1) {
      encoded = encodeURIComponent(encoded);
    }
    write(resolve(dist, "index.html"), encoded);

    expect(scan(dist, content)).toThrow();
  });

  it.each([
    ["HTML numeric entity", "index.html", "password&#x3D;supersecretvalue"],
    ["JavaScript Unicode escape", "assets/app.js", String.raw`password\u003dsupersecretvalue`],
    ["Base64", "index.html", Buffer.from("password=supersecretvalue").toString("base64")],
  ])("rejects a credential reconstructed from %s", (_label, relativePath, content) => {
    const { dist, content: sourceContent } = fixture();
    write(resolve(dist, relativePath), content);

    expect(scan(dist, sourceContent)).toThrow();
  });

  it.each([
    ["UTF-16LE", Buffer.from("password=supersecretvalue", "utf16le")],
    [
      "UTF-16BE",
      Buffer.from("password=supersecretvalue", "utf16le").swap16(),
    ],
  ])("rejects a credential encoded as %s", (_label, encoded) => {
    const { dist, content } = fixture();
    write(resolve(dist, "encoded.txt"), encoded);

    expect(scan(dist, content)).toThrow();
  });

  it("rejects a credential embedded in a classified binary artifact", () => {
    const { dist, content } = fixture();
    write(
      resolve(dist, "image.png"),
      Buffer.from(`PNG-BYTES api_key='sk-proj-${"a".repeat(26)}'`),
    );

    expect(scan(dist, content)).toThrow();
  });

  it("extracts PDF text and rejects a compressed credential", async () => {
    const { dist, content } = fixture();
    const fakeGitHubToken = `ghp_${"a".repeat(20)}`;
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(`<p>Credencial sintética: ${fakeGitHubToken}</p>`);
      await page.pdf({ path: resolve(dist, "work.pdf"), format: "A4" });
    } finally {
      await browser.close();
    }

    expect(scan(dist, content)).toThrow(/GitHub token/i);
  });

  it("rejects a completed work PDF that bypasses canonical deliverable state", async () => {
    const { dist, content } = fixture();
    write(
      resolve(content, "works/direct-publication.md"),
      `---
title: Publicação direta
draft: false
status: completed
artifact: /documents/works/direct-publication.pdf
---
Apresentação pública.
`,
    );
    write(resolve(dist, "trabalhos/direct-publication/index.html"), "<h1>Publicação direta</h1>");
    const pdfPath = resolve(dist, "documents/works/direct-publication.pdf");
    mkdirSync(dirname(pdfPath), { recursive: true });
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent("<p>PDF limpo, mas não autorizado pelo manifesto canônico.</p>");
      await page.pdf({ path: pdfPath, format: "A4" });
    } finally {
      await browser.close();
    }

    expect(scan(dist, content)).toThrow(/canônic|deliverables/i);
  });

  it("accepts a finalized PDF only when source, route and canonical state agree", async () => {
    const { dist, content } = fixture();
    write(
      resolve(content, "works/canonical-work.md"),
      `---
title: Trabalho canônico
draft: false
status: completed
artifact: /documents/works/canonical-work.pdf
---
Apresentação pública.
`,
    );
    write(
      resolve(content, "../data/deliverables.yml"),
      `- id: canonical-work
  title: Trabalho canônico
  status: completed
`,
    );
    write(resolve(dist, "trabalhos/canonical-work/index.html"), "<h1>Trabalho canônico</h1>");
    const pdfPath = resolve(dist, "documents/works/canonical-work.pdf");
    mkdirSync(dirname(pdfPath), { recursive: true });
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent("<p>PDF finalizado e autorizado.</p>");
      await page.pdf({ path: pdfPath, format: "A4" });
    } finally {
      await browser.close();
    }

    expect(scan(dist, content)).not.toThrow();
  });

  it("rejects a PDF outside the controlled work-artifact directory", async () => {
    const { dist, content } = fixture();
    const pdfPath = resolve(dist, "uploads/arbitrary.pdf");
    mkdirSync(dirname(pdfPath), { recursive: true });
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent("<p>PDF arbitrário limpo.</p>");
      await page.pdf({ path: pdfPath, format: "A4" });
    } finally {
      await browser.close();
    }

    expect(scan(dist, content)).toThrow(/diretório controlado|documents\/works/i);
  });

  it("rejects an unclassified public file format instead of skipping it", () => {
    const { dist, content } = fixture();
    write(resolve(dist, "payload.custom"), "possibly sensitive");

    expect(scan(dist, content)).toThrow();
  });

  it("rejects a generated route, sitemap or feed entry for a draft source", () => {
    const { dist, content } = fixture();
    write(
      resolve(content, "notes/private-note.md"),
      "---\ntitle: Nota privada\ndraft: true\n---\nNão publicar.",
    );
    write(resolve(dist, "anotacoes/private-note/index.html"), "<h1>Nota privada</h1>");
    write(resolve(dist, "sitemap.xml"), "<loc>/anotacoes/private-note/</loc>");

    expect(scan(dist, content)).toThrow();
  });

  it("rejects a percent-encoded sitemap reference to a draft route", () => {
    const { dist, content } = fixture();
    write(
      resolve(content, "notes/private-note.md"),
      "---\ntitle: Nota privada\ndraft: true\n---\nNão publicar.",
    );
    write(resolve(dist, "index.html"), "<h1>Público</h1>");
    write(resolve(dist, "sitemap.xml"), "<loc>/anotacoes/%70rivate-note/</loc>");

    expect(scan(dist, content)).toThrow();
  });

  it("rejects a named-entity HTML reference to a draft route", () => {
    const { dist, content } = fixture();
    write(
      resolve(content, "notes/private-note.md"),
      "---\ntitle: Nota privada\ndraft: true\n---\nNão publicar.",
    );
    write(
      resolve(dist, "index.html"),
      '<a href="&sol;anotacoes&sol;private-note&sol;">Privado</a>',
    );

    expect(scan(dist, content)).toThrow();
  });

  it("treats an omitted draft field as private, matching the schema default", () => {
    const { dist, content } = fixture();
    write(
      resolve(content, "notes/default-private.md"),
      "---\ntitle: Privado por padrão\n---\nNão publicar.",
    );
    write(resolve(dist, "anotacoes/default-private/index.html"), "<h1>Privado por padrão</h1>");

    expect(scan(dist, content)).toThrow();
  });

  it("accepts an explicitly published source when its route exists", () => {
    const { dist, content } = fixture();
    write(
      resolve(content, "notes/public-note.md"),
      "---\ntitle: Nota pública\ndraft: false\n---\nPublicar.",
    );
    write(resolve(dist, "anotacoes/public-note/index.html"), "<h1>Nota pública</h1>");

    expect(scan(dist, content)).not.toThrow();
  });

  it("accepts a draft source when its route and identifier are absent from the build", () => {
    const { dist, content } = fixture();
    write(
      resolve(content, "works/private-work.md"),
      "---\ntitle: Trabalho privado\ndraft: true\n---\nNão publicar.",
    );
    write(resolve(dist, "index.html"), "<h1>Conteúdo público</h1>");

    expect(scan(dist, content)).not.toThrow();
  });
});
