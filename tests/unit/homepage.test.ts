import { describe, expect, it } from "vitest";
import {
  buildHomepageSummary,
  formatPublishedDate,
  selectRecentPublished,
} from "../../src/utils/homepage";

const deliverables = [
  {
    id: "first",
    title: "Primeira entrega",
    type: "summary",
    assessment: "A2",
    dueAt: "2026-09-20T23:59:00-03:00",
    status: "planned" as const,
    restrictedSource: true,
  },
  {
    id: "second",
    title: "Segunda entrega",
    type: "summary",
    assessment: "A2",
    dueAt: "2026-09-27T23:59:00-03:00",
    status: "planned" as const,
    restrictedSource: true,
  },
];

describe("homepage summary", () => {
  it("shows the nearest unfinished deliverable before its deadline", () => {
    const summary = buildHomepageSummary(
      deliverables,
      "2026-12-16",
      new Date("2026-09-19T12:00:00-03:00"),
    );

    expect(summary.state).toBe("upcoming");
    expect(summary.nextDeliverable?.id).toBe("first");
    expect(summary.progress).toEqual({ completed: 0, total: 2, percentage: 0 });
  });

  it("keeps an unfinished deliverable visible throughout its due date", () => {
    const summary = buildHomepageSummary(
      deliverables,
      "2026-12-16",
      new Date("2026-09-20T18:00:00-03:00"),
    );

    expect(summary.state).toBe("upcoming");
    expect(summary.nextDeliverable?.id).toBe("first");
  });

  it("selects the following deliverable after a deadline has passed", () => {
    const summary = buildHomepageSummary(
      deliverables,
      "2026-12-16",
      new Date("2026-09-21T00:00:00-03:00"),
    );

    expect(summary.state).toBe("upcoming");
    expect(summary.nextDeliverable?.id).toBe("second");
  });

  it("shows the explicit no-upcoming state after the last deadline but before course end", () => {
    const summary = buildHomepageSummary(
      deliverables,
      "2026-12-16",
      new Date("2026-10-01T12:00:00-03:00"),
    );

    expect(summary.state).toBe("no-upcoming");
    expect(summary.nextDeliverable).toBeNull();
  });

  it("shows the completed-course state after the course end date", () => {
    const summary = buildHomepageSummary(
      deliverables,
      "2026-12-16",
      new Date("2026-12-17T00:00:00-03:00"),
    );

    expect(summary.state).toBe("completed");
    expect(summary.nextDeliverable).toBeNull();
  });

  it("formats date-only publication values without shifting them to the previous day", () => {
    expect(formatPublishedDate(new Date("2026-09-21"))).toBe("21 de set. de 2026");
  });

  it("selects only published content in newest-first order", () => {
    const content = [
      { id: "older", publishedAt: new Date("2026-09-14T12:00:00-03:00"), draft: false },
      { id: "draft", publishedAt: new Date("2026-09-16T12:00:00-03:00"), draft: true },
      { id: "newer", publishedAt: new Date("2026-09-15T12:00:00-03:00"), draft: false },
    ];

    expect(selectRecentPublished(content, 2).map(({ id }) => id)).toEqual(["newer", "older"]);
    expect(content.map(({ id }) => id)).toEqual(["older", "draft", "newer"]);
  });
});
