export type DeliverableStatus =
  | "planned"
  | "in-progress"
  | "completed"
  | "reviewed"
  | "rescheduled";

export interface DatedDeliverable {
  id: string;
  title: string;
  dueAt: string;
  status: DeliverableStatus;
}

export interface ChronologicalItem {
  date: string;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_WITH_TIME_ZONE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/;
const completedStatuses = new Set<DeliverableStatus>(["completed", "reviewed"]);

function hasValidCalendarDate(value: string): boolean {
  const [yearText, monthText, dayText] = value.slice(0, 10).split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function toTimestamp(value: string): number {
  if (!DATE_ONLY_PATTERN.test(value) && !ISO_WITH_TIME_ZONE_PATTERN.test(value)) {
    throw new TypeError(`Data ISO inválida ou sem fuso horário: ${value}`);
  }

  if (!hasValidCalendarDate(value)) {
    throw new TypeError(`Data ISO inválida: ${value}`);
  }

  const normalized = DATE_ONLY_PATTERN.test(value) ? `${value}T12:00:00-03:00` : value;
  const timestamp = Date.parse(normalized);

  if (!Number.isFinite(timestamp)) {
    throw new TypeError(`Data ISO inválida: ${value}`);
  }

  return timestamp;
}

export function sortChronologically<T extends ChronologicalItem>(items: readonly T[]): T[] {
  return [...items].sort((left, right) => toTimestamp(left.date) - toTimestamp(right.date));
}

export function findNextDeliverable<T extends DatedDeliverable>(
  deliverables: readonly T[],
  now: Date = new Date(),
): T | null {
  const nowTimestamp = now.getTime();

  if (!Number.isFinite(nowTimestamp)) {
    throw new TypeError("A data de referência é inválida.");
  }

  return (
    [...deliverables]
      .filter(
        ({ dueAt, status }) =>
          !completedStatuses.has(status) && toTimestamp(dueAt) >= nowTimestamp,
      )
      .sort((left, right) => toTimestamp(left.dueAt) - toTimestamp(right.dueAt))[0] ?? null
  );
}

export function formatCourseDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(toTimestamp(value));
}
