import { z } from "astro/zod";

const requiredText = (field: string) =>
  z.string({ error: `${field} deve ser informado.` }).trim().min(1, `${field} não pode ficar vazio.`);

const sensitiveMarkers = [
  "session",
  "sesskey",
  "jsessionid",
  "moodlesession",
  "phpsessid",
  "sessid",
  "password",
  "passwd",
  "secret",
  "token",
  "apikey",
];

function decodeToCanonicalForm(value: string): string | null {
  let current = value.normalize("NFKC");

  for (let depth = 0; depth < 8; depth += 1) {
    if (/%(?![0-9A-Fa-f]{2})/.test(current)) {
      return null;
    }

    let decoded: string;
    try {
      decoded = decodeURIComponent(current).normalize("NFKC");
    } catch {
      return null;
    }

    if (decoded === current) {
      return current.toLocaleLowerCase("en-US");
    }
    current = decoded;
  }

  return null;
}

function isSensitiveIdentifier(value: string): boolean {
  const canonical = decodeToCanonicalForm(value);
  if (canonical === null) {
    return true;
  }

  const identifier = canonical.replace(/[^a-z0-9]/g, "");
  return identifier === "sid" || sensitiveMarkers.some((marker) => identifier.includes(marker));
}

function containsSensitiveAssignments(value: string): boolean {
  const canonical = decodeToCanonicalForm(value);
  if (canonical === null) {
    return true;
  }

  return [...canonical.matchAll(/(?:^|[?&#;])([^=?&#;]+)(?:=|$)/g)].some((match) =>
    isSensitiveIdentifier(match[1] ?? ""),
  );
}

const httpUrl = z.url({ error: "A URL deve ser válida." }).superRefine((value, context) => {
  const parsed = new URL(value);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    context.addIssue({ code: "custom", message: "A URL deve usar HTTP ou HTTPS." });
  }
  if (parsed.username || parsed.password) {
    context.addIssue({ code: "custom", message: "A URL não pode conter credenciais embutidas." });
  }

  const canonicalPath = decodeToCanonicalForm(parsed.pathname);
  const hasSensitiveData =
    canonicalPath === null ||
    [...parsed.searchParams.keys()].some(isSensitiveIdentifier) ||
    containsSensitiveAssignments(parsed.search) ||
    containsSensitiveAssignments(canonicalPath ?? "") ||
    (parsed.hash.length > 1 && containsSensitiveAssignments(parsed.hash.slice(1)));

  if (hasSensitiveData) {
    context.addIssue({
      code: "custom",
      message: "A URL não pode conter parâmetros de sessão ou credenciais.",
    });
  }
});

const publicArtifactPath = z
  .string()
  .refine(
    (value) =>
      /^\/documents\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) &&
      !value.includes("..") &&
      !value.includes("//") &&
      !value.includes("%") &&
      !value.includes("\\") &&
      !value.includes("?") &&
      !value.includes("#"),
    { message: "O artefato deve usar um caminho público seguro sob /documents/." },
  );

function isRealIsoDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

function hasValidDateTimeParts(value: string): boolean {
  if (!isRealIsoDate(value.slice(0, 10))) {
    return false;
  }

  const match = value.match(
    /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|([+-])(\d{2}):(\d{2}))$/,
  );
  if (!match) {
    return false;
  }

  const [, hourText, minuteText, secondText, timezone, , offsetHourText, offsetMinuteText] = match;
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (hour > 23 || minute > 59 || second > 59) {
    return false;
  }
  if (timezone !== "Z") {
    const offsetHour = Number(offsetHourText);
    const offsetMinute = Number(offsetMinuteText);
    if (offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute !== 0)) {
      return false;
    }
  }

  return Number.isFinite(Date.parse(value));
}

const isoDate = z
  .string({ error: "A data deve ser informada no formato ISO AAAA-MM-DD." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "A data deve usar o formato ISO AAAA-MM-DD.")
  .refine(isRealIsoDate, "A data ISO deve representar um dia real.")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const isoDateTimeWithTimezone = z
  .string({ error: "A data e hora devem ser informadas em ISO 8601 com timezone." })
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
    "A data e hora devem usar ISO 8601 com timezone explícito.",
  )
  .refine(hasValidDateTimeParts, "A data e hora ISO devem ser válidas.")
  .transform((value) => new Date(value));

const revisionSchema = z.object({
  date: isoDate,
  description: requiredText("A descrição da revisão"),
});

const commonSchema = z.object({
  title: requiredText("O título"),
  description: requiredText("A descrição"),
  publishedAt: isoDate,
  tags: z.array(requiredText("A tag")).default([]),
  draft: z.boolean({ error: "draft deve ser verdadeiro ou falso." }).default(true),
  revisions: z.array(revisionSchema).default([]),
});

const notes = commonSchema.extend({
  kind: z.enum(["class", "thematic"], {
    error: "O tipo da anotação deve ser class ou thematic.",
  }),
  courseWeek: z.number().int().positive().optional(),
  status: z.enum(["draft", "reviewed", "consolidated"], {
    error: "O status da anotação deve ser draft, reviewed ou consolidated.",
  }).default("draft"),
});

const works = commonSchema.extend({
  type: z.enum(["summary", "survey-review", "pre-project", "presentation", "exam"], {
    error: "O tipo do trabalho não é reconhecido.",
  }),
  status: z.enum(["planned", "in-progress", "completed", "reviewed", "rescheduled"], {
    error: "O status do trabalho não é reconhecido.",
  }),
  dueAt: isoDateTimeWithTimezone,
  courseWeek: z.number().int().positive("A semana da disciplina deve ser positiva."),
  featured: z.boolean().default(false),
  artifact: publicArtifactPath.optional(),
  aiUsage: requiredText("A declaração de uso de IA"),
});

const library = commonSchema.extend({
  kind: z.enum(["article", "book", "video", "website"], {
    error: "O tipo do item da biblioteca não é reconhecido.",
  }),
  authors: z.array(requiredText("O nome do autor")).default([]),
  sourceUrl: httpUrl.optional(),
  status: z.enum(["to-read", "reading", "read", "reviewed"], {
    error: "O status de leitura não é reconhecido.",
  }),
});

const projects = commonSchema.extend({
  kind: z.enum(["experiment", "notebook", "script", "dataset"], {
    error: "O tipo do projeto não é reconhecido.",
  }),
  repositoryUrl: httpUrl.optional(),
  reproducibility: requiredText("As instruções de reprodução"),
  status: z.enum(["planned", "in-progress", "completed", "archived"], {
    error: "O status do projeto não é reconhecido.",
  }).default("planned"),
});

export const academicSchemas = { notes, works, library, projects };
