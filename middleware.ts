import { NextResponse, type NextRequest } from "next/server";

import { SITE_URL } from "@/lib/site";

/**
 * Les redirections d'articles, rendues avant tout rendu.
 *
 * ## Pourquoi ici, et pas dans la page
 *
 * `app/blog/[slug]/page.tsx` appelle bien `permanentRedirect()` quand un slug
 * ne répond plus. Mais cette page est mise en cache par ISR (`revalidate =
 * 300`), et un rendu figé ne conserve pas l'en-tête `Location` : en
 * production, les anciennes adresses rendaient un **308 sans destination**,
 * avec pour corps la page « Article introuvable » et un `canonical` vers
 * l'accueil. Un navigateur s'en sortait par le JavaScript de Next ; un robot,
 * non — et le canonical vers l'accueil est un signal franchement mauvais.
 *
 * Le middleware, lui, s'exécute à chaque requête, hors de tout cache de
 * rendu. `NextResponse.redirect` y émet un vrai 308 avec `Location`. C'est le
 * seul endroit de l'application où cette garantie existe.
 *
 * ## Le cache mémoire n'est pas une optimisation prématurée
 *
 * Sans lui, chaque affichage d'article déclencherait un appel à Nexus avant
 * de rendre la page — une latence ajoutée à la lecture normale, pour un
 * renseignement qui ne change presque jamais. Les **absences sont mises en
 * cache aussi** : c'est le cas le plus fréquent, puisque la quasi-totalité du
 * trafic porte sur des articles bien vivants.
 *
 * ## Il échoue en laissant passer
 *
 * Si Nexus ne répond pas, la requête continue vers la page. Une redirection
 * manquée coûte un 404 ; un middleware qui bloque coûterait le blog entier.
 */

const CONTENUS_API =
  process.env.CONTENUS_API_URL ??
  "https://bjrwcmvbgczgwefylhyx.supabase.co/functions/v1/vitrine-contenus";

const DOMAINE = new URL(SITE_URL).hostname.replace(/^www\./, "");

/** Même durée que la revalidation des articles, pour une seule horloge. */
const TTL_MS = 300_000;

/** `null` est une réponse à part entière : « ce slug ne redirige nulle part ». */
const cache = new Map<string, { valeur: string | null; expire: number }>();

async function redirectionPour(slug: string): Promise<string | null> {
  const connu = cache.get(slug);
  if (connu && connu.expire > Date.now()) return connu.valeur;

  try {
    const reponse = await fetch(
      `${CONTENUS_API}?action=redirection&domaine=${encodeURIComponent(DOMAINE)}&slug=${encodeURIComponent(slug)}`,
      { signal: AbortSignal.timeout(2_000) },
    );
    if (!reponse.ok) return null;

    const { nouveauSlug } = (await reponse.json()) as { nouveauSlug: string | null };
    const valeur = nouveauSlug && nouveauSlug !== slug ? nouveauSlug : null;
    cache.set(slug, { valeur, expire: Date.now() + TTL_MS });
    return valeur;
  } catch {
    // Ni cache ni redirection : la page décidera, et réessaiera au coup suivant.
    return null;
  }
}

export async function middleware(request: NextRequest) {
  /*
    Tout est sous garde, y compris le décodage du slug.

    Ce code s'exécute devant *chaque* article. Une exception non rattrapée —
    un `decodeURIComponent` sur une adresse mal encodée suffit — rendrait le
    blog entier inaccessible. Le pire qu'un incident puisse coûter ici, c'est
    une redirection manquée.
  */
  try {
    const slug = request.nextUrl.pathname.slice("/blog/".length);
    if (!slug || slug.includes("/")) return NextResponse.next();

    const nouveau = await redirectionPour(decodeURIComponent(slug));
    if (!nouveau) return NextResponse.next();

    const cible = request.nextUrl.clone();
    cible.pathname = `/blog/${nouveau}`;
    return NextResponse.redirect(cible, 308);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: "/blog/:slug",
};
