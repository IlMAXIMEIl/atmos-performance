/**
 * L'origine d'un visiteur, capturée à l'arrivée et rendue au paiement.
 *
 * ## Le dispositif, en trois temps
 *
 * 1. À l'atterrissage, `capterAttribution` lit les paramètres de campagne
 *    de l'URL (utm_*, gclid, fbclid) et les pose dans un cookie premier
 *    parti — **dernier clic** : une nouvelle arrivée tracée remplace la
 *    précédente, une visite organique ne remplace rien.
 * 2. Au paiement, les routes du tunnel relisent ce cookie côté serveur
 *    (`lireAttribution`) et le glissent dans les métadonnées Stripe.
 * 3. Le webhook, côté Nexus, écrit ces métadonnées sur la commande — le
 *    rapprochement dépense ↔ encaissé se fait là-bas, en SQL.
 *
 * Le navigateur de l'acheteur ne parle donc jamais à Nexus, et la vitrine
 * ne stocke rien : un cookie chez le visiteur, et c'est tout.
 *
 * ## Ce qu'on capture, et rien d'autre
 *
 * Des identifiants de campagne — pas d'identité, pas de parcours, pas
 * d'historique. Le cookie dit « ce visiteur est arrivé par la campagne
 * 777 de Google », il ne dit pas qui il est. Sa finalité reste pourtant
 * la mesure publicitaire, hors des exemptions de l'article 82 : il ne se
 * pose qu'après consentement (`lib/consentement.ts`), et un refus
 * l'efface. Sans cookie, `lireAttribution` rend un objet vide — la vente
 * n'en dépend jamais, la commande est simplement « non tracée ».
 *
 * ## La convention qui rend le rapprochement exact
 *
 * `utm_campaign` doit porter l'**identifiant** de la campagne, posé une
 * fois dans les régies : `{campaignid}` chez Google Ads (suffixe d'URL
 * finale), `{{campaign.id}}` chez Meta (paramètres d'URL). Un nom de
 * campagne marche aussi — Brevo ne sait faire que ça — mais survit mal
 * aux renommages ; l'identifiant, lui, ne change jamais.
 */

import { lireConsentement } from "@/lib/consentement";

const COOKIE = "atmos_origine";

/** Dernier clic, 90 jours : un achat à ce prix se mûrit. */
const DUREE_JOURS = 90;

/** Stripe plafonne ses métadonnées ; et une valeur d'URL n'est pas fiable. */
const MAX_VALEUR = 200;

const CONTROLE = /[\u0000-\u001f\u007f-\u009f]/g;

function propre(valeur: string): string {
  return valeur.replace(CONTROLE, "").trim().slice(0, MAX_VALEUR);
}

/** Les clés du cookie → les clés des métadonnées Stripe. */
const CHAMPS: Record<string, string> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_content: "utmContent",
  utm_term: "utmTerm",
  gclid: "gclid",
  fbclid: "fbclid",
};

/**
 * À appeler dans le navigateur, à chaque navigation.
 *
 * N'écrit que si l'arrivée est tracée : un clic interne ou une visite
 * directe ne doivent pas effacer l'origine d'un clic publicitaire de la
 * veille — c'est toute la différence entre « dernier clic » et « dernière
 * page ».
 */
export function capterAttribution(search: string, chemin: string): void {
  if (typeof document === "undefined") return;

  // La garde vit ici et non chez l'appelant : quel que soit le chemin qui
  // mène à cette fonction, aucun cookie ne se pose sans accord.
  if (lireConsentement() !== "accepte") return;

  const params = new URLSearchParams(search);
  const capture: Record<string, string> = {};

  for (const cle of Object.keys(CHAMPS)) {
    const valeur = params.get(cle);
    if (valeur) capture[cle] = propre(valeur);
  }

  if (Object.keys(capture).length === 0) return;

  capture.le = new Date().toISOString();
  capture.page = propre(chemin);

  document.cookie = [
    `${COOKIE}=${encodeURIComponent(JSON.stringify(capture))}`,
    `max-age=${DUREE_JOURS * 86_400}`,
    "path=/",
    "samesite=lax",
    "secure",
  ].join("; ");
}

/**
 * À appeler côté serveur, depuis l'en-tête `Cookie` de la requête.
 *
 * Rend des clés prêtes pour les métadonnées Stripe, ou un objet vide —
 * jamais une erreur : l'attribution ne conditionne pas le paiement, un
 * cookie corrompu vaut simplement « non tracé ».
 */
export function lireAttribution(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  const morceau = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!morceau) return {};

  try {
    const brut = JSON.parse(decodeURIComponent(morceau.slice(COOKIE.length + 1)));
    if (typeof brut !== "object" || brut === null) return {};

    const metadata: Record<string, string> = {};
    for (const [cle, cleMeta] of Object.entries(CHAMPS)) {
      const valeur = (brut as Record<string, unknown>)[cle];
      if (typeof valeur === "string" && valeur) metadata[cleMeta] = propre(valeur);
    }
    if (Object.keys(metadata).length === 0) return {};

    const le = (brut as Record<string, unknown>).le;
    if (typeof le === "string") metadata.attributionLe = propre(le);
    const page = (brut as Record<string, unknown>).page;
    if (typeof page === "string") metadata.attributionPage = propre(page);

    return metadata;
  } catch {
    return {};
  }
}
