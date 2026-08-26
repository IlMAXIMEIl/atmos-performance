import {
  buildGlossaryLinks,
  linkGlossaryTerms,
  type GlossaryLink,
} from "@/lib/autolink";
import { getAllGlossaryEntries } from "@/lib/glossary";
import { formatFrenchDate, renderMarkdown } from "@/lib/markdown";
import { SITE_URL } from "@/lib/site";

/**
 * Contenu du blog, lu depuis Nexus — plus jamais depuis le dépôt.
 *
 * ## La bascule du 26 août 2026
 *
 * Les articles vivaient dans `content/blog/*.md`, lus au build. Ils vivent
 * désormais en base, écrits et publiés depuis le tableau de bord, et ce
 * module les lit par l'Edge Function `vitrine-contenus` — qui ne sait
 * répondre que du publié. Publier ne demande plus de redéploiement.
 *
 * Le dossier `content/blog/` a été supprimé dans le même changement :
 * deux sources qui survivent divergent toujours, et c'est toujours celle
 * qu'on n'ouvre plus qui finit par mentir.
 *
 * ## Le pipeline de rendu n'a pas bougé
 *
 * `renderMarkdown` — donc le nettoyage LaTeX, les indices Unicode de SpO₂ —
 * puis `linkGlossaryTerms` : exactement la chaîne qui rendait les fichiers.
 * On a changé le lecteur, pas le rendu. Le glossaire, lui, reste en
 * fichiers : il n'a pas de cycle de publication.
 *
 * ## Périmé plutôt qu'en panne
 *
 * L'appel passe par `fetch` avec revalidation : Next garde la dernière
 * réponse et la ressert pendant `REVALIDATION_S`, puis la rafraîchit en
 * arrière-plan. Si Supabase tombe, le blog sert sa dernière version connue —
 * il dégrade en périmé, jamais en panne. Et à la publication, Nexus appelle
 * `/api/blog/revalidation` pour raccourcir l'attente à quelques secondes.
 *
 * ## Ce module reste serveur
 *
 * Il l'était pour `readFileSync`, il le reste pour le glossaire (fichiers)
 * et pour ne pas embarquer `marked` dans le paquet du navigateur.
 */

const REVALIDATION_S = 300;

/**
 * L'adresse de la fonction, avec repli écrit en dur.
 *
 * Ce n'est pas une donnée métier — c'est une adresse d'infrastructure, la
 * même règle que `SITE_URL` dans `lib/site.ts` : la variable d'environnement
 * prime, la constante évite qu'un poste de dev sans configuration rende un
 * blog vide sans explication.
 */
const CONTENUS_API =
  process.env.CONTENUS_API_URL ??
  "https://bjrwcmvbgczgwefylhyx.supabase.co/functions/v1/vitrine-contenus";

/** Le domaine qui identifie ce site auprès de Nexus. Source : SITE_URL. */
const DOMAINE = new URL(SITE_URL).hostname.replace(/^www\./, "");

export type Post = {
  slug: string;
  title: string;
  description: string;
  /** Format ISO `YYYY-MM-DD`. */
  publishedAt: string;
  updatedAt?: string;
  category?: string;
  author: string;
  readTime: string;
  tags: string[];
  /** Corps de l'article converti en HTML. */
  html: string;
};

type ArticleApi = {
  slug: string;
  titre: string;
  metaTitre: string;
  metaDescription: string;
  motsClesSecondaires: string[];
  auteur: string;
  categorie: string;
  publieLe: string;
  majLe: string;
  corps: string;
  mots: number;
};

function versPost(article: ArticleApi, glossary: GlossaryLink[]): Post {
  const publie = article.publieLe.slice(0, 10);
  const maj = article.majLe.slice(0, 10);

  return {
    slug: article.slug,
    title: article.titre,
    description: article.metaDescription,
    publishedAt: publie,
    // La date de retouche ne s'affiche que si elle diffère du jour de
    // publication : « mis à jour le jour même » n'apprend rien.
    updatedAt: maj > publie ? maj : undefined,
    category: article.categorie || undefined,
    author: article.auteur || "Équipe ATMOS Performance",
    // Calculé du compte de mots plutôt que déclaré : un temps de lecture
    // saisi à la main ment dès la première réécriture.
    readTime: `${Math.max(1, Math.round(article.mots / 220))} min`,
    tags: article.motsClesSecondaires,
    html: linkGlossaryTerms(renderMarkdown(article.corps), glossary),
  };
}

/** Articles du plus récent au plus ancien. */
export async function getAllPosts(): Promise<Post[]> {
  const reponse = await fetch(
    `${CONTENUS_API}?action=liste&domaine=${encodeURIComponent(DOMAINE)}`,
    { next: { revalidate: REVALIDATION_S, tags: ["blog"] } },
  );

  if (!reponse.ok) {
    // Levé plutôt qu'avalé : au build, mieux vaut échouer en nommant la
    // cause qu'expédier un site sans blog. À l'exécution, Next ressert la
    // dernière réponse valide et ce chemin ne se voit pas.
    throw new Error(`Lecture des articles impossible (${reponse.status}).`);
  }

  const { articles } = (await reponse.json()) as { articles: ArticleApi[] };

  // Construite une fois par lecture, pas une fois par article : sans cela,
  // le dossier du glossaire serait relu treize fois à chaque appel.
  const glossary = buildGlossaryLinks(getAllGlossaryEntries());
  return articles.map((article) => versPost(article, glossary));
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug);
}

/**
 * Où est parti ce slug, si une page publiée a été renommée.
 *
 * Nexus enregistre la redirection au renommage, automatiquement ; la page
 * d'article la consulte quand un slug ne répond plus, et rend un 301 —
 * sans lui, chaque renommage coûterait à la page tout son acquis.
 */
export async function getRedirection(slug: string): Promise<string | null> {
  const reponse = await fetch(
    `${CONTENUS_API}?action=redirection&domaine=${encodeURIComponent(DOMAINE)}&slug=${encodeURIComponent(slug)}`,
    { next: { revalidate: REVALIDATION_S } },
  );
  if (!reponse.ok) return null;

  const { nouveauSlug } = (await reponse.json()) as { nouveauSlug: string | null };
  return nouveauSlug;
}

/**
 * Un brouillon, contre jeton — pour la page d'aperçu.
 *
 * Jamais mis en cache : un aperçu montre l'état du texte à l'instant où on
 * le regarde, et son lien expire.
 */
export async function getApercu(jeton: string): Promise<Post | null> {
  if (!/^[0-9a-f]{32}$/.test(jeton)) return null;

  const reponse = await fetch(
    `${CONTENUS_API}?action=apercu&jeton=${encodeURIComponent(jeton)}`,
    { cache: "no-store" },
  );
  if (!reponse.ok) return null;

  const { article } = (await reponse.json()) as { article: ArticleApi };
  const glossary = buildGlossaryLinks(getAllGlossaryEntries());
  return versPost(article, glossary);
}

export { formatFrenchDate as formatPostDate };
