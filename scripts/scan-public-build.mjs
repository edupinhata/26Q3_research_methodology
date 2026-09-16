import { readFile, readdir, stat } from "node:fs/promises";
import { basename, extname, relative, resolve, sep } from "node:path";
import process from "node:process";
import { decodeHTML } from "entities";
import { parse } from "yaml";

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".htm",
  ".html",
  ".js",
  ".json",
  ".jsonld",
  ".map",
  ".mjs",
  ".svg",
  ".txt",
  ".webmanifest",
  ".xml",
]);
const TEXT_FILENAMES = new Set([".nojekyll", "CNAME"]);
const BINARY_EXTENSIONS = new Set([
  ".avif",
  ".eot",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".otf",
  ".pdf",
  ".png",
  ".ttf",
  ".webp",
  ".woff",
  ".woff2",
]);

const SECRET_PATTERNS = [
  ["private key", /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/i],
  ["JWT", /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/],
  ["Bearer token", /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}=*/i],
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/],
  ["OpenAI-style token", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}\b/],
  [
    "credential assignment",
    /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|secret)\s*[=:]\s*["']?[A-Za-z0-9._~+\/-]{8,}/i,
  ],
  [
    "session parameter",
    /\b(?:moodlesession|sesskey|jsessionid|phpsessid|access[_-]?token|auth[_-]?token|password)\s*[=:]\s*[^&\s"'<>]{4,}/i,
  ],
  ["credentials embedded in URL", /https?:\/\/[^\s/:]+:[^\s/@]+@/i],
];

const COLLECTION_ROUTES = new Map([
  ["library", "biblioteca"],
  ["notes", "anotacoes"],
  ["projects", "codigo"],
  ["works", "trabalhos"],
]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Link simbólico não permitido no artefato público: ${path}`);
    }
    if (entry.isDirectory()) {
      files.push(...await collectFiles(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function percentDecode(text) {
  return text.replace(/%([0-9a-f]{2})/gi, (_match, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

function decodeHtmlEntities(text) {
  return decodeHTML(text);
}

function decodeJavaScriptEscapes(text) {
  return text
    .replace(/\\u\{([0-9a-f]{1,6})\}/gi, (_match, hex) => {
      const codePoint = Number.parseInt(hex, 16);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : _match;
    })
    .replace(/\\u([0-9a-f]{4})/gi, (_match, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replace(/\\x([0-9a-f]{2})/gi, (_match, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
}

function canonicalVariants(text) {
  const variants = [text];
  let current = text;
  for (let depth = 0; depth < 8; depth += 1) {
    const decoded = decodeJavaScriptEscapes(decodeHtmlEntities(percentDecode(current)));
    if (decoded === current) {
      return variants;
    }
    variants.push(decoded);
    current = decoded;
  }
  throw new Error("Codificação excede o limite seguro de canonicalização.");
}

function base64Variants(text) {
  const variants = [];
  for (const match of text.matchAll(/(?:^|[^A-Za-z0-9+/_-])([A-Za-z0-9+/_-]{16,}={0,2})(?=$|[^A-Za-z0-9+/_=-])/g)) {
    const candidate = match[1];
    if (!candidate || candidate.length > 5_000_000) {
      throw new Error("Candidato Base64 excede o limite seguro de tamanho.");
    }
    const normalized = candidate.replaceAll("-", "+").replaceAll("_", "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = Buffer.from(`${normalized}${padding}`, "base64");
    const canonicalInput = normalized.replace(/=+$/, "");
    const canonicalOutput = decoded.toString("base64").replace(/=+$/, "");
    if (canonicalInput !== canonicalOutput || decoded.length === 0) {
      continue;
    }
    const printable = [...decoded].filter(
      (byte) => byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126),
    ).length;
    if (printable / decoded.length < 0.8) {
      continue;
    }
    variants.push(...canonicalVariants(decoded.toString("latin1")));
  }
  return variants;
}

function artifactVariants(bytes, kind) {
  const seedVariants = [bytes.toString("latin1")];
  if (kind === "text") {
    seedVariants.push(bytes.toString("utf8"));
  }
  if (bytes.length >= 2) {
    const evenBytes = bytes.subarray(0, bytes.length - (bytes.length % 2));
    seedVariants.push(evenBytes.toString("utf16le"));
    seedVariants.push(Buffer.from(evenBytes).swap16().toString("utf16le"));
  }

  const variants = new Set();
  for (const seed of seedVariants) {
    for (const variant of canonicalVariants(seed)) {
      variants.add(variant);
      for (const decoded of base64Variants(variant)) {
        variants.add(decoded);
      }
    }
  }
  return [...variants];
}

function classify(path) {
  const extension = extname(path).toLowerCase();
  if (TEXT_EXTENSIONS.has(extension) || TEXT_FILENAMES.has(basename(path))) {
    return "text";
  }
  if (BINARY_EXTENSIONS.has(extension)) {
    return "binary";
  }
  return "unknown";
}

async function findDraftRoutes(contentDirectory) {
  const contentFiles = await collectFiles(contentDirectory);
  const drafts = [];

  for (const path of contentFiles) {
    if (extname(path).toLowerCase() !== ".md") {
      continue;
    }
    const source = await readFile(path, "utf8");
    const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s*\r?\n|$)/)?.[1] ?? "";
    let data;
    try {
      data = parse(frontmatter) ?? {};
    } catch (error) {
      throw new Error(`Frontmatter YAML inválido em ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (typeof data !== "object" || Array.isArray(data)) {
      throw new Error(`Frontmatter deve ser um objeto em ${path}`);
    }
    const draft = data.draft === undefined ? true : data.draft;
    if (typeof draft !== "boolean") {
      throw new Error(`Campo draft deve ser booleano em ${path}`);
    }
    if (!draft) {
      continue;
    }

    const parts = relative(contentDirectory, path).split(sep);
    const collection = parts.shift();
    const publicRoot = COLLECTION_ROUTES.get(collection);
    if (!publicRoot) {
      throw new Error(`Collection de draft sem rota conhecida: ${collection} (${path})`);
    }
    const id = parts.join("/").replace(/\.md$/i, "");
    drafts.push({ path, publicPath: `/${publicRoot}/${id}/` });
  }

  return drafts;
}

async function scanPublicBuild(distDirectory, contentDirectory) {
  const distInfo = await stat(distDirectory);
  if (!distInfo.isDirectory()) {
    throw new Error(`Diretório de build inválido: ${distDirectory}`);
  }

  const files = await collectFiles(distDirectory);
  if (files.length === 0) {
    throw new Error(`Build público vazio: ${distDirectory}`);
  }

  const problems = [];
  const textArtifacts = [];
  for (const path of files) {
    const kind = classify(path);
    if (kind === "unknown") {
      problems.push(`formato público não classificado: ${relative(distDirectory, path)}`);
      continue;
    }
    const bytes = await readFile(path);
    const variants = artifactVariants(bytes, kind);
    if (kind === "text") {
      textArtifacts.push({ path, variants });
    }

    for (const [label, pattern] of SECRET_PATTERNS) {
      if (variants.some((variant) => pattern.test(variant))) {
        problems.push(`${label}: ${relative(distDirectory, path)}`);
      }
    }
  }

  const combinedText = textArtifacts.flatMap(({ variants }) => variants).join("\n");
  const drafts = await findDraftRoutes(contentDirectory);
  for (const draft of drafts) {
    const generatedRoute = resolve(distDirectory, draft.publicPath.slice(1), "index.html");
    const routeExists = await stat(generatedRoute).then(() => true, () => false);
    if (routeExists || combinedText.includes(draft.publicPath)) {
      problems.push(`draft publicado em ${draft.publicPath} (fonte: ${draft.path})`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Verificação do build público falhou:\n- ${[...new Set(problems)].join("\n- ")}`);
  }

  return { files: files.length, textFiles: textArtifacts.length, drafts: drafts.length };
}

const distDirectory = resolve(process.argv[2] ?? "dist");
const contentDirectory = resolve(process.argv[3] ?? "src/content");

try {
  const result = await scanPublicBuild(distDirectory, contentDirectory);
  console.log(
    `Build público verificado: ${result.files} arquivos, ${result.textFiles} textuais, ${result.drafts} drafts excluídos.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
