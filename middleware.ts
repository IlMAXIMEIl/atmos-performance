import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SITE_URL } from "@/lib/site";
import { espaceClientConfigure, supabaseClePubliable, supabaseUrl } from "@/lib/supabase/env";

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

/**
 * Rafraîchissement de la session de l'espace client.
 *
 * ## Pourquoi c'est indispensable
 *
 * Les jetons Supabase expirent. Un composant serveur ne peut pas écrire le
 * jeton rafraîchi — le flux de la réponse a déjà commencé — et c'est
 * pourquoi `lib/supabase/server.ts` avale l'échec d'écriture. Sans ce
 * passage-ci, cet échec n'est rattrapé nulle part : la session mourrait à la
 * première expiration, et le client serait déconnecté sans explication.
 *
 * ## La redirection est un raccourci, pas une barrière
 *
 * Renvoyer un visiteur sans session vers l'écran de connexion évite de
 * rendre une page pour la jeter. Mais la vérification qui compte est
 * ailleurs : `clientConnecte()` dans la page et dans chaque action serveur,
 * puis les politiques RLS dans Postgres. Un `matcher` mal écrit contourne ce
 * fichier ; il ne contourne pas les deux autres couches.
 */
async function sessionEspaceClient(request: NextRequest) {
  let reponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseClePubliable(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesAPoser) {
        // La requête d'abord, pour que le rendu en aval voie le jeton neuf.
        for (const { name, value } of cookiesAPoser) {
          request.cookies.set(name, value);
        }
        reponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesAPoser) {
          reponse.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname !== "/compte/connexion") {
    const cible = request.nextUrl.clone();
    cible.pathname = "/compte/connexion";
    cible.search = "";
    return NextResponse.redirect(cible);
  }

  return reponse;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/compte")) {
    /*
      Espace client non configuré : la vitrine doit continuer de vendre.
      Plutôt qu'une erreur 500 sur une adresse que personne n'a demandée, on
      renvoie à l'accueil — le reste du site n'en sait rien.
    */
    if (!espaceClientConfigure()) {
      const accueil = request.nextUrl.clone();
      accueil.pathname = "/";
      accueil.search = "";
      return NextResponse.redirect(accueil);
    }

    try {
      return await sessionEspaceClient(request);
    } catch (error) {
      console.error(
        "Espace client — session :",
        error instanceof Error ? error.message : error,
      );
      // On échoue fermé : pas de session établie, donc pas d'accès.
      const connexion = request.nextUrl.clone();
      connexion.pathname = "/compte/connexion";
      connexion.search = "";
      return NextResponse.redirect(connexion);
    }
  }

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
  // Deux périmètres disjoints : les articles pour les redirections, l'espace
  // client pour la session. Tout le reste du site ne passe pas par ici.
  matcher: ["/blog/:slug", "/compte/:path*"],
};
