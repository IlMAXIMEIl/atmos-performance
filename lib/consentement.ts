/**
 * Le consentement aux cookies, réduit à sa plus simple expression légale.
 *
 * ## Pourquoi un bandeau, alors que le site ne trace personne
 *
 * Le site ne pose qu'un seul cookie optionnel : `atmos_origine`, qui note
 * la campagne publicitaire d'arrivée (voir `lib/attribution.ts`). Il ne
 * contient aucune identité — mais il sert à mesurer la publicité, et la
 * CNIL range cette finalité hors des exemptions de l'article 82 : il faut
 * un consentement préalable. Les autres cookies (session de l'espace
 * client, choix de consentement lui-même, anti-fraude Stripe au paiement)
 * sont strictement nécessaires et exemptés — ils ne passent pas par ici.
 *
 * ## Les règles CNIL que ce module encode
 *
 * - Refuser est aussi simple qu'accepter : deux boutons identiques.
 * - Le choix est retenu six mois — accepté comme refusé — pour ne pas
 *   redemander à chaque visite (recommandation CNIL).
 * - Le retrait est possible à tout moment : le pied de page et la page
 *   de confidentialité rouvrent le bandeau via `ouvrirBandeau()`.
 * - Refuser efface le cookie d'attribution déjà posé, le cas échéant.
 *
 * Tout est côté navigateur : le serveur n'a jamais besoin de connaître le
 * choix — sans cookie d'attribution, `lireAttribution` rend simplement un
 * objet vide, et rien d'autre ne dépend du consentement.
 */

export type Consentement = "accepte" | "refuse";

const COOKIE = "atmos_consentement";

/** Six mois, la durée de mémorisation d'un choix recommandée par la CNIL. */
const DUREE_JOURS = 180;

/** Le bandeau écoute cet évènement pour se rouvrir (pied de page, page cookies). */
export const EVENEMENT_OUVRIR = "atmos:cookies-gerer";

/** Émis à chaque choix : la capture d'attribution rejoue si l'accord arrive. */
export const EVENEMENT_CHOIX = "atmos:cookies-choix";

/** Le choix mémorisé, ou `null` tant que le visiteur n'a pas répondu. */
export function lireConsentement(): Consentement | null {
  if (typeof document === "undefined") return null;

  const morceau = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));

  const valeur = morceau?.slice(COOKIE.length + 1);
  return valeur === "accepte" || valeur === "refuse" ? valeur : null;
}

export function poserConsentement(choix: Consentement): void {
  if (typeof document === "undefined") return;

  document.cookie = [
    `${COOKIE}=${choix}`,
    `max-age=${DUREE_JOURS * 86_400}`,
    "path=/",
    "samesite=lax",
    "secure",
  ].join("; ");

  // Un refus retire ce qui a pu être posé avant lui : le retrait du
  // consentement doit avoir le même effet qu'un refus initial.
  if (choix === "refuse") {
    document.cookie = "atmos_origine=; max-age=0; path=/; samesite=lax; secure";
  }

  window.dispatchEvent(new Event(EVENEMENT_CHOIX));
}

/** Rouvre le bandeau — le geste de retrait exigé par le RGPD. */
export function ouvrirBandeau(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENEMENT_OUVRIR));
}
