import type { MetadataRoute } from "next";

import { ACCESSORIES_PATH } from "@/lib/accessories";
import { getAllGlossaryEntries } from "@/lib/glossary";
import { getAllPosts } from "@/lib/posts";
import { TOOLS, TOOLS_PATH } from "@/lib/tools";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = (await getAllPosts()).map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  const glossary = getAllGlossaryEntries().map((entry) => ({
    url: `${SITE_URL}/glossaire/${entry.slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const tools = TOOLS.map((tool) => ({
    url: `${SITE_URL}${TOOLS_PATH}/${tool.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${SITE_URL}${TOOLS_PATH}`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...tools,
    {
      url: `${SITE_URL}${ACCESSORIES_PATH}`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${SITE_URL}/la-science`, changeFrequency: "yearly", priority: 0.6 },
    ...articles,
    { url: `${SITE_URL}/glossaire`, changeFrequency: "monthly", priority: 0.7 },
    ...glossary,
    { url: `${SITE_URL}/a-propos`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/cgv`, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${SITE_URL}/mentions-legales`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/confidentialite`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/suppression-donnees`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
