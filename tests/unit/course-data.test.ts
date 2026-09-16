import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { findNextDeliverable, sortChronologically } from "../../src/utils/dates";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const readYaml = <T>(relativePath: string): T =>
  parse(readFileSync(resolve(projectRoot, relativePath), "utf8")) as T;

interface CourseData {
  code: string;
  name: string;
  institution: string;
  term: string;
  timezone: string;
  startsOn: string;
  endsOn: string;
  lastCheckedAt: string;
  officialSource: { label: string; restricted: boolean };
  instructors: string[];
  meetings: Array<{ weekday: string; startsAt: string; endsAt: string; room: string }>;
  assessment: Array<{ id: string; label: string; weight: number }>;
  topics: string[];
}

interface ScheduleEvent {
  id: string;
  date: string;
  endDate?: string;
  title: string;
  type: "class" | "holiday" | "deadline" | "presentation" | "replacement";
}

interface Deliverable {
  id: string;
  title: string;
  type: "summary" | "survey-review" | "pre-project";
  assessment: "A2" | "A3";
  dueAt: string;
  status: "planned" | "in-progress" | "completed" | "reviewed" | "rescheduled";
  restrictedSource: boolean;
}

describe("typed course source data", () => {
  it("models stable course facts and the assessment weights", () => {
    const course = readYaml<CourseData>("src/data/course.yml");

    expect(course).toMatchObject({
      code: "CCM-002",
      institution: "UFABC",
      term: "2026.3",
      timezone: "America/Sao_Paulo",
      startsOn: "2026-09-14",
      endsOn: "2026-12-16",
      lastCheckedAt: "2026-09-14",
      officialSource: { label: "Moodle", restricted: true },
    });
    expect(course.instructors).toEqual(["Carlos Alberto Kamienski", "Jesús Pascual Mena-Chalco"]);
    expect(course.meetings).toHaveLength(2);
    expect(course.assessment).toEqual([
      { id: "A1", label: "Participação, discussões e bancas", weight: 1 },
      { id: "A2", label: "Resumos e survey/review", weight: 2 },
      { id: "A3", label: "Pré-projeto", weight: 3 },
    ]);
    expect(course.topics).toHaveLength(6);
  });

  it("keeps schedule events unique and chronological", () => {
    const schedule = readYaml<ScheduleEvent[]>("src/data/schedule.yml");
    const ids = schedule.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(sortChronologically(schedule)).toEqual(schedule);
    expect(schedule).toHaveLength(35);
    expect(new Set(schedule.map(({ type }) => type))).toEqual(
      new Set(["class", "holiday", "deadline", "presentation", "replacement"]),
    );
    expect(schedule).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ date: "2026-09-14", type: "class" }),
        expect.objectContaining({ date: "2026-10-12", type: "holiday" }),
        expect.objectContaining({ date: "2026-11-02", type: "holiday" }),
        expect.objectContaining({ date: "2026-11-30", endDate: "2026-12-09", type: "presentation" }),
        expect.objectContaining({ date: "2026-12-14", type: "replacement" }),
        expect.objectContaining({ date: "2026-12-16", type: "replacement" }),
      ]),
    );
  });

  it("contains every known deliverable with timezone-aware unique deadlines", () => {
    const deliverables = readYaml<Deliverable[]>("src/data/deliverables.yml");
    const ids = deliverables.map(({ id }) => id);

    expect(deliverables).toHaveLength(10);
    expect(new Set(ids).size).toBe(ids.length);
    expect(deliverables.every(({ dueAt }) => /T\d{2}:\d{2}:\d{2}-03:00$/.test(dueAt))).toBe(true);
    expect(deliverables.every(({ restrictedSource }) => restrictedSource)).toBe(true);
    expect(findNextDeliverable(deliverables, new Date("2026-09-21T00:00:00-03:00"))?.id).toBe(
      "resumo-2-how-to-read-a-paper",
    );
  });

  it("defines all four academic content collections with draft filtering metadata", () => {
    const source = readFileSync(resolve(projectRoot, "src/content.config.ts"), "utf8");

    for (const collection of ["notes", "works", "library", "projects"]) {
      expect(source).toContain(`${collection}:`);
    }
    expect(source).toContain("draft: z.boolean().default(true)");
    expect(source).toContain("aiUsage:");
  });
});
