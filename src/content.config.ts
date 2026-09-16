import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { academicSchemas } from "./content/schemas";

const notesCollection = defineCollection({
  loader: glob({ base: "./src/content/notes", pattern: "**/*.md" }),
  schema: academicSchemas.notes,
});

const worksCollection = defineCollection({
  loader: glob({ base: "./src/content/works", pattern: "**/*.md" }),
  schema: academicSchemas.works,
});

const libraryCollection = defineCollection({
  loader: glob({ base: "./src/content/library", pattern: "**/*.md" }),
  schema: academicSchemas.library,
});

const projectsCollection = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: academicSchemas.projects,
});

export const collections = {
  notes: notesCollection,
  works: worksCollection,
  library: libraryCollection,
  projects: projectsCollection,
};
