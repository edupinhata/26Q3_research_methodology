export type TimelineEventType =
  | "class"
  | "holiday"
  | "deadline"
  | "presentation"
  | "replacement";

export interface TimelineEvent {
  id: string;
  date: string;
  endDate?: string;
  title: string;
  type: TimelineEventType;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const labels: Record<TimelineEventType, string> = {
  class: "Aula",
  holiday: "Feriado",
  deadline: "Prazo",
  presentation: "Apresentação",
  replacement: "Reposição",
};

function parseCivilDate(value: string): Date {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw new TypeError(`Data civil inválida: ${value}`);
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new TypeError(`Data civil inválida: ${value}`);
  }

  return date;
}

export function getEventTypeLabel(type: TimelineEventType): string {
  return labels[type];
}

export function formatTimelineDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseCivilDate(value));
}

export function formatTimelineRange(event: TimelineEvent): string {
  if (!event.endDate) {
    return formatTimelineDate(event.date);
  }

  const start = parseCivilDate(event.date);
  const end = parseCivilDate(event.endDate);
  if (end.getTime() < start.getTime()) {
    throw new RangeError("O fim do evento não pode anteceder o início.");
  }

  return `${formatTimelineDate(event.date)} a ${formatTimelineDate(event.endDate)}`;
}
