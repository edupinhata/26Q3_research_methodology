import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://edupinhata.github.io",
  base: "/26Q3_research_methodology",
  integrations: [sitemap()],
});
