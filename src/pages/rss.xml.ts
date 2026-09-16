import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  if (!context.site) {
    throw new Error("A URL pública do site é obrigatória para gerar o feed RSS.");
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [notes, works] = await Promise.all([
    getCollection("notes", ({ data }) => !data.draft),
    getCollection("works", ({ data }) => !data.draft),
  ]);
  const items = [
    ...notes.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedAt,
      link: `${base}/anotacoes/${entry.id}/`,
    })),
    ...works.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedAt,
      link: `${base}/trabalhos/${entry.id}/`,
    })),
  ].toSorted((left, right) => right.pubDate.getTime() - left.pubDate.getTime());

  return rss({
    title: "CCM-002 — Metodologia de Pesquisa",
    description: "Anotações e trabalhos publicados no caderno da disciplina CCM-002.",
    site: new URL(`${base}/`, context.site),
    items,
    customData: "<language>pt-BR</language>",
  });
};
