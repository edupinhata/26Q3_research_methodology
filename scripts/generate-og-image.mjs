import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(projectRoot, "public/og-default.png");
await mkdir(dirname(output), { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html>
    <html lang="pt-BR">
      <style>
        * { box-sizing: border-box; }
        body {
          width: 1200px;
          height: 630px;
          margin: 0;
          padding: 62px 72px;
          color: #172521;
          background:
            repeating-linear-gradient(0deg, transparent 0 31px, #e9eee9 31px 32px),
            #fffdf8;
          font-family: Arial, sans-serif;
        }
        main {
          position: relative;
          height: 506px;
          padding: 56px 56px 50px;
          overflow: hidden;
          border: 3px solid #cad8d3;
          border-left: 22px solid #d49a28;
          border-radius: 34px;
          background: #fff;
        }
        header { display: flex; align-items: center; gap: 48px; }
        .mark {
          display: grid;
          width: 140px;
          height: 140px;
          place-items: center;
          border-radius: 50%;
          color: #fffdf8;
          background: #0f5b55;
          font: 700 88px Georgia, serif;
        }
        .code { color: #0f5b55; font-size: 29px; font-weight: 700; letter-spacing: .08em; }
        h1 { margin: 32px 0 12px; font: 700 68px/1.08 Georgia, serif; letter-spacing: -.025em; }
        h2 { margin: 0; color: #405650; font: 400 37px Georgia, serif; }
        footer { position: absolute; bottom: 42px; color: #0f5b55; font-size: 29px; }
      </style>
      <body>
        <main>
          <header><div class="mark">M</div><div class="code">CCM-002</div></header>
          <h1>Metodologia de Pesquisa</h1>
          <h2>em Ciência da Computação</h2>
          <footer>Caderno público · UFABC · 2026.3</footer>
        </main>
      </body>
    </html>`);
  await page.screenshot({ path: output, type: "png" });
  console.log(`generated ${output}`);
} finally {
  await browser.close();
}
