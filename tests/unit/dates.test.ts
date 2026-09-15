import { describe, expect, it } from "vitest";
import {
  findNextDeliverable,
  formatCourseDate,
  sortChronologically,
  type DatedDeliverable,
} from "../../src/utils/dates";

const deliverables: DatedDeliverable[] = [
  {
    id: "later",
    title: "Entrega posterior",
    dueAt: "2026-09-27T23:59:00-03:00",
    status: "planned",
  },
  {
    id: "completed",
    title: "Entrega concluída",
    dueAt: "2026-09-18T23:59:00-03:00",
    status: "completed",
  },
  {
    id: "next",
    title: "Próxima entrega",
    dueAt: "2026-09-20T23:59:00-03:00",
    status: "in-progress",
  },
];

describe("course date utilities", () => {
  it("selects the nearest unfinished deliverable without mutating the source", () => {
    const originalOrder = deliverables.map(({ id }) => id);

    expect(findNextDeliverable(deliverables, new Date("2026-09-19T12:00:00-03:00"))?.id).toBe(
      "next",
    );
    expect(deliverables.map(({ id }) => id)).toEqual(originalOrder);
  });

  it("keeps a deliverable due later today eligible and returns none after all deadlines", () => {
    expect(findNextDeliverable(deliverables, new Date("2026-09-20T08:00:00-03:00"))?.id).toBe(
      "next",
    );
    expect(findNextDeliverable(deliverables, new Date("2026-09-28T00:00:00-03:00"))).toBeNull();
  });

  it("sorts ISO dates chronologically into a new array", () => {
    const items = [
      { id: "third", date: "2026-10-01" },
      { id: "first", date: "2026-09-14" },
      { id: "second", date: "2026-09-20T23:59:00-03:00" },
    ];

    expect(sortChronologically(items).map(({ id }) => id)).toEqual(["first", "second", "third"]);
    expect(items.map(({ id }) => id)).toEqual(["third", "first", "second"]);
  });

  it("formats dates in Brazilian Portuguese without shifting date-only values", () => {
    expect(formatCourseDate("2026-09-20")).toBe("20 de setembro de 2026");
  });

  it("rejects impossible dates and date-times without an explicit timezone", () => {
    expect(() => formatCourseDate("2026-02-30")).toThrow(/Data ISO inválida/);
    expect(() => formatCourseDate("2026-09-20T23:59:00")).toThrow(/sem fuso horário/);
  });
});
