import { describe, expect, it } from "vitest";
import { calculateProgress } from "../../src/utils/progress";

describe("course progress", () => {
  it("counts completed and reviewed deliverables and rounds the percentage", () => {
    expect(
      calculateProgress([
        { status: "completed" },
        { status: "reviewed" },
        { status: "in-progress" },
      ]),
    ).toEqual({ completed: 2, total: 3, percentage: 67 });
  });

  it("returns a stable zero state for an empty course", () => {
    expect(calculateProgress([])).toEqual({ completed: 0, total: 0, percentage: 0 });
  });

  it("does not count planned, in-progress or rescheduled work as complete", () => {
    expect(
      calculateProgress([
        { status: "planned" },
        { status: "in-progress" },
        { status: "rescheduled" },
      ]),
    ).toEqual({ completed: 0, total: 3, percentage: 0 });
  });
});
