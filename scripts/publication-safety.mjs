import { decodeHTML } from "entities";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const SECRET_PATTERNS = [
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

function percentDecode(text) {
  return text.replace(/%([0-9a-f]{2})/gi, (_match, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
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

export function canonicalVariants(text) {
  const variants = [text];
  let current = text;
  for (let depth = 0; depth < 8; depth += 1) {
    const decoded = decodeJavaScriptEscapes(decodeHTML(percentDecode(current)));
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
    if (canonicalInput !== canonicalOutput || decoded.length === 0) continue;
    const printable = [...decoded].filter(
      (byte) => byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126),
    ).length;
    if (printable / decoded.length < 0.8) continue;
    variants.push(...canonicalVariants(decoded.toString("latin1")));
  }
  return variants;
}

export function textVariants(text) {
  const variants = new Set();
  for (const variant of canonicalVariants(text)) {
    variants.add(variant);
    for (const decoded of base64Variants(variant)) variants.add(decoded);
  }
  return [...variants];
}

export function findSecretLabels(variants) {
  return SECRET_PATTERNS
    .filter(([, pattern]) => variants.some((variant) => pattern.test(variant)))
    .map(([label]) => label);
}

export async function extractPdfText(bytes) {
  const loadingTask = getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  try {
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
    }
    return pages.join("\n");
  } finally {
    await loadingTask.destroy();
  }
}
