import {
  findNextDeliverable,
  type DatedDeliverable,
  type DeliverableStatus,
} from "./dates";
import { calculateProgress, type CourseProgress } from "./progress";

export interface HomepageDeliverable extends DatedDeliverable {
  type: string;
  assessment: string;
  restrictedSource: boolean;
}

export interface HomepageSummary<T extends HomepageDeliverable> {
  state: "upcoming" | "no-upcoming" | "completed";
  nextDeliverable: T | null;
  progress: CourseProgress;
}

export interface PublishableContent {
  publishedAt: Date;
  draft: boolean;
}

export function buildHomepageSummary<T extends HomepageDeliverable>(
  deliverables: readonly T[],
  courseEndsOn: string,
  now: Date = new Date(),
): HomepageSummary<T> {
  const nextDeliverable = findNextDeliverable(deliverables, now);
  const courseEndTimestamp = Date.parse(`${courseEndsOn}T23:59:59.999-03:00`);

  if (!Number.isFinite(courseEndTimestamp)) {
    throw new TypeError(`Data final da disciplina inválida: ${courseEndsOn}`);
  }

  const state = nextDeliverable
    ? "upcoming"
    : now.getTime() > courseEndTimestamp
      ? "completed"
      : "no-upcoming";

  return {
    state,
    nextDeliverable,
    progress: calculateProgress(deliverables as readonly { status: DeliverableStatus }[]),
  };
}

export function formatPublishedDate(value: Date): string {
  if (!Number.isFinite(value.getTime())) {
    throw new TypeError("A data de publicação é inválida.");
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function selectRecentPublished<T extends PublishableContent>(
  content: readonly T[],
  limit: number,
): T[] {
  if (!Number.isInteger(limit) || limit < 0) {
    throw new RangeError("O limite de conteúdos recentes deve ser um inteiro não negativo.");
  }

  return content
    .filter(({ draft }) => !draft)
    .sort((left, right) => right.publishedAt.getTime() - left.publishedAt.getTime())
    .slice(0, limit);
}
