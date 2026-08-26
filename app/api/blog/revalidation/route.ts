import { revalidateTag } from "next/cache";

import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Le signal que Nexus envoie à la publication d'un article.
 *
 * ## Sans secret, et c'est un choix pesé
 *
 * Nexus ne détient aucun secret — c'est sa propriété fondatrice — donc il ne
 * peut pas s'authentifier ici. Ce qui rend l'absence de secret acceptable,
 * c'est la nature de l'action : vider un cache. Elle ne divulgue rien, ne
 * modifie rien, et son pire abus est une lecture de plus vers Supabase —
 * borné par la limitation par IP ci-dessous.
 *
 * Le blog revalide de toute façon toutes les cinq minutes ; ce signal ne
 * fait que raccourcir l'attente entre « Publier » dans Nexus et la page en
 * ligne. S'il se perd, rien n'est perdu.
 */
export async function POST(request: Request): Promise<Response> {
  const limite = rateLimit(`revalidation:${clientKey(request)}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!limite.ok) return tooManyRequests(limite.retryAfter);

  // Le tag posé par `lib/posts.ts` sur la lecture des articles : liste,
  // pages d'article et sitemap retomberont sur une lecture fraîche.
  // `"max"` : servir le périmé pendant que la lecture fraîche arrive —
  // le visiteur n'attend jamais après Supabase.
  revalidateTag("blog", "max");

  return Response.json({ ok: true });
}
