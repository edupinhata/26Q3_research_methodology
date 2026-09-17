#!/usr/bin/env node

import process from "node:process";
import {
  createWork,
  finalizeWork,
  generateAllWorkPdfs,
  generateWorkPdf,
} from "./academic-workflow.mjs";

const HELP = `Fluxo de trabalhos acadêmicos

Uso:
  npm run work:new -- <id> [--date AAAA-MM-DD]
  npm run work:pdf -- <id>
  npm run work:pdf -- --all
  npm run work:finalize -- <id> [--date AAAA-MM-DD]

Também é aceito --id <id> no lugar do argumento posicional.
`;

function option(args, name) {
  const index = args.indexOf(name);
  if (index < 0) {
    return undefined;
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} exige um valor.`);
  }
  return value;
}

function positionalId(args) {
  return option(args, "--id") ?? args.find((argument) => !argument.startsWith("--") && argument !== option(args, "--date"));
}

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h" || args.includes("--help") || args.includes("-h")) {
    process.stdout.write(HELP);
    return;
  }

  const root = process.cwd();
  const id = positionalId(args);
  const date = option(args, "--date") ?? todayInSaoPaulo();

  if (command === "new") {
    if (!id) throw new Error("Informe o identificador: new <id>.");
    const result = await createWork({ root, id, date });
    process.stdout.write(`Trabalho criado:\n- ${result.documentPath}\n- ${result.pagePath}\n`);
    return;
  }
  if (command === "pdf") {
    if (args.includes("--all")) {
      const generated = await generateAllWorkPdfs({ root });
      process.stdout.write(`PDFs gerados: ${generated.length}\n${generated.map((path) => `- ${path}`).join("\n")}\n`);
      return;
    }
    if (!id) throw new Error("Informe o identificador: pdf <id> ou pdf --all.");
    const pdfPath = await generateWorkPdf({ root, id });
    process.stdout.write(`PDF gerado: ${pdfPath}\n`);
    return;
  }
  if (command === "finalize") {
    if (!id) throw new Error("Informe o identificador: finalize <id>.");
    const result = await finalizeWork({ root, id, date });
    process.stdout.write(`Trabalho finalizado e PDF verificado: ${result.pdfPath}\n`);
    return;
  }
  throw new Error(`Comando desconhecido: ${command}. Use --help.`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
