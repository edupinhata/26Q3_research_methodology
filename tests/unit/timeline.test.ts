import { describe, expect, it } from "vitest";
import {
  formatTimelineDate,
  formatTimelineRange,
  getEventTypeLabel,
  type TimelineEvent,
} from "../../src/utils/timeline";

const event = (overrides: Partial<TimelineEvent> = {}): TimelineEvent => ({
  id: "aula-2026-09-14",
  date: "2026-09-14",
  title: "Aula da disciplina",
  type: "class",
  ...overrides,
});

describe("timeline presentation", () => {
  it.each([
    ["class", "Aula"],
    ["holiday", "Feriado"],
    ["deadline", "Prazo"],
    ["presentation", "Apresentação"],
    ["replacement", "Reposição"],
  ] as const)("labels %s events without relying on color", (type, label) => {
    expect(getEventTypeLabel(type)).toBe(label);
  });

  it("formats a civil date without shifting it across timezones", () => {
    expect(formatTimelineDate("2026-09-14")).toBe("14 de setembro de 2026");
  });

  it("formats a multi-day event as an explicit interval", () => {
    expect(formatTimelineRange(event({ date: "2026-11-30", endDate: "2026-12-09" }))).toBe(
      "30 de novembro de 2026 a 9 de dezembro de 2026",
    );
  });

  it("rejects an interval ending before it starts", () => {
    expect(() =>
      formatTimelineRange(event({ date: "2026-12-09", endDate: "2026-11-30" })),
    ).toThrow("O fim do evento não pode anteceder o início");
  });
});
