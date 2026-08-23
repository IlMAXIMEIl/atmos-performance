import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Session de l'espace d'administration.
 *
 * ## Un mot de passe, pas des comptes
 *
 * Il y a un opérateur. Une table `users`, des rôles, une réinitialisation par
 * email : tout cela existerait pour une seule personne, et chacune de ces
 * pièces est une surface d'attaque de plus à tenir. `ADMIN_PASSWORD` suffit,
 * et le jour où il faut deux comptes, c'est ce fichier qu'on remplace — les
 * appelants ne connaissent que `requireAdmin`.
 *
 * ## Pourquoi pas de bibliothèque de jetons
 *
 * `jose`, que la documentation de Next propose, signerait un JWT. On n'a rien
 * à transporter : la session ne porte ni identité, ni rôle, ni permissions,
 * seulement une date d'expiration. Un HMAC de `node:crypto` sur cette date
 * fait exactement le même travail, sans dépendance à surveiller, et tient en
 * trente lignes lisibles.
 *
 * Le paquet `server-only`, que la même documentation conseille en garde-fou,
 * n'est pas installé et ne le sera pas pour ce seul fichier : `next/headers`
 * et `node:crypto` refusent déjà l'un comme l'autre d'être importés depuis un
 * composant client, et l'erreur de compilation est immédiate.
 *
 * ## Ce que la clé de signature couvre
 *
 * La clé dérive du secret **et** de l'empreinte du mot de passe. Changer l'un
 * ou l'autre invalide donc toutes les sessions en cours : c'est le geste
 * qu'on attend d'un changement de mot de passe, et il serait sans effet si la
 * signature n'en dépendait pas.
 */

const COOKIE_NAME = "atmos_admin";

/**
 * Douze heures : une journée de travail sans avoir à ressaisir le mot de
 * passe, et une session oubliée sur un poste qui ne survit pas à la nuit.
 */
const SESSION_MS = 12 * 60 * 60 * 1000;

/** Empreinte fixe d'une chaîne, pour comparer sans révéler sa longueur. */
function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Comparaison en temps constant, sur des empreintes de longueur fixe.
 *
 * `timingSafeEqual` exige deux tampons de même taille, et refuserait
 * autrement de comparer. Passer par l'empreinte règle les deux problèmes à la
 * fois : la taille est toujours de 32 octets, et la durée de la comparaison
 * ne dit plus rien de la longueur du mot de passe attendu.
 *
 * Même précaution que `app/api/health/db/route.ts`, où le jeton de diagnostic
 * est comparé de la même façon.
 */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

/** `true` si les deux variables d'environnement sont renseignées. */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

/**
 * Clé de signature. Lève si la configuration manque — l'appelant a toujours
 * vérifié `isAdminConfigured()` avant d'en arriver là.
 */
function signingKey(): string {
  const { ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = process.env;

  if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    throw new Error(
      "Administration non configurée : renseigner ADMIN_PASSWORD et " +
        "ADMIN_SESSION_SECRET.",
    );
  }

  return `${ADMIN_SESSION_SECRET}:${digest(ADMIN_PASSWORD).toString("hex")}`;
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey())
    .update(payload, "utf8")
    .digest("base64url");
}

/**
 * Vérifie le mot de passe saisi.
 *
 * Le refus est le même — même durée, même réponse — que la variable soit
 * absente ou le mot de passe faux : une administration non configurée ne doit
 * pas s'annoncer comme telle à qui frappe à la porte.
 */
export function verifyPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !isAdminConfigured()) return false;
  return safeEqual(candidate, expected);
}

/** Pose le cookie de session. À n'appeler qu'après `verifyPassword`. */
export async function createAdminSession(): Promise<void> {
  const expiresAt = Date.now() + SESSION_MS;
  const payload = `v1.${expiresAt}`;

  (await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    /*
      `secure` en production seulement.

      Un cookie `secure` n'est pas conservé par le navigateur sur `http://`,
      et le développement tourne sur `localhost` en clair : le poser
      inconditionnellement rendrait la connexion impossible en local, sans
      message, avec un formulaire qui semble marcher et une page qui renvoie
      aussitôt vers lui.
    */
    secure: process.env.NODE_ENV === "production",
    // `lax` et non `strict` : le cookie doit accompagner l'arrivée sur
    // `/admin` depuis un signet ou un lien, sinon la première navigation
    // paraît déconnectée.
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroyAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

/** `true` si la requête porte un cookie signé et non expiré. */
export async function hasAdminSession(): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;

  const separator = value.lastIndexOf(".");
  if (separator === -1) return false;

  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);

  // La signature d'abord : inutile de faire confiance à la date d'expiration
  // avant d'avoir établi qu'elle vient bien de nous.
  if (!safeEqual(signature, sign(payload))) return false;

  const [version, expiresAt] = payload.split(".");
  if (version !== "v1") return false;

  return Number(expiresAt) > Date.now();
}

/**
 * Point d'entrée unique de l'autorisation.
 *
 * Appelée par **chaque** page, action serveur et route de l'espace — jamais
 * seulement par la disposition. Une disposition ne se réexécute pas à chaque
 * navigation (rendu partiel) et ne décide pas du rendu des segments qu'elle
 * enveloppe : s'y fier laisserait une page se rendre, et son contenu partir
 * dans la charge utile, pour un visiteur déconnecté.
 *
 * Les actions serveur, elles, sont des points d'entrée POST publics dès
 * qu'elles existent : la vérification y est la seule barrière réelle.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await hasAdminSession())) redirect("/admin/connexion");
}
