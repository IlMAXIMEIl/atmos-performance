import type { MetadataRoute } from "next";

import { getAllGlossaryEntries } from "@/lib/glossary";
import { getAllPosts } from "@/lib/posts";
import { TOOLS, TOOLS_PATH } from "@/lib/tools";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllPosts().map((post) => ({
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
    ...articles,
    { url: `${SITE_URL}/glossaire`, changeFrequency: "monthly", priority: 0.7 },
    ...glossary,
    { url: `${SITE_URL}/a-propos`, changeFrequency: "yearly", priority: 0.6 },
    {
      url: `${SITE_URL}/mentions-legales`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
