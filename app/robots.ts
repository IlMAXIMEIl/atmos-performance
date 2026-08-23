import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Page de retour après paiement : sans intérêt pour l'indexation.
      disallow: "/reservation/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
