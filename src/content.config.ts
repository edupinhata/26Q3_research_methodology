import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const statusSchema = z.enum(["draft", "reviewed", "consolidated"]);
const workStatusSchema = z.enum(["planned", "in-progress", "completed", "reviewed", "rescheduled"]);
const commonSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(true),
});

const notesCollection = defineCollection({
  loader: glob({ base: "./src/content/notes", pattern: "**/*.md" }),
  schema: commonSchema.extend({
    courseWeek: z.number().int().positive().optional(),
    status: statusSchema.default("draft"),
  }),
});

const worksCollection = defineCollection({
  loader: glob({ base: "./src/content/works", pattern: "**/*.md" }),
  schema: commonSchema.extend({
    type: z.enum(["summary", "survey-review", "pre-project", "presentation", "exam"]),
    status: workStatusSchema,
    dueAt: z.coerce.date(),
    courseWeek: z.number().int().positive(),
    featured: z.boolean().default(false),
    artifact: z.string().optional(),
    aiUsage: z.string().min(1),
  }),
});

const libraryCollection = defineCollection({
  loader: glob({ base: "./src/content/library", pattern: "**/*.md" }),
  schema: commonSchema.extend({
    kind: z.enum(["article", "book", "video", "website"]),
    authors: z.array(z.string()).default([]),
    sourceUrl: z.url().optional(),
    status: z.enum(["to-read", "reading", "read", "reviewed"]),
  }),
});

const projectsCollection = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: commonSchema.extend({
    kind: z.enum(["experiment", "notebook", "script", "dataset"]),
    repositoryUrl: z.url().optional(),
    reproducibility: z.string().min(1),
  }),
});

export const collections = {
  notes: notesCollection,
  works: worksCollection,
  library: libraryCollection,
  projects: projectsCollection,
};
