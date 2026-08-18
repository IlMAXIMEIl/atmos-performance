import type { MetadataRoute } from "next";

import { POSTS } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...articles,
    { url: `${SITE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
