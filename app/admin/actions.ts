"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  createAdminSession,
  destroyAdminSession,
  isAdminConfigured,
  requireAdmin,
  verifyPassword,
} from "@/lib/admin-session";
import {
  isOrderStatus,
  ORDER_STATUS_LABELS,
  updateOrderDetails,
  updateOrderStatus,
} from "@/lib/orders";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";

/**
 * Actions de l'espace d'administration.
 *
 * ## Chacune revérifie l'autorisation
 *
 * Une action serveur est un point d'entrée POST public dès qu'elle est
 * compilée : le fait qu'elle ne soit appelée que depuis une page protégée
 * n'est pas une protection, c'est une convention d'interface. `requireAdmin`
 * ouvre donc chaque action, y compris celles qui ne semblent rien risquer.
 *
 * ## Aucun changement d'état par GET
 *
 * Tout ce qui écrit passe par ici, donc par un POST. Un lien
 * `?statut=expediee` serait suivi par un préchargeur de navigateur, un
 * antivirus ou un scanner — et la série entière partirait en expédition sans
 * que personne n'ait cliqué.
 */

export type ActionState = { error?: string; message?: string };

/**
 * Quota de connexion : cinq tentatives par quart d'heure et par IP.
 *
 * Même cadence que le formulaire de capture (`app/api/waitlist/route.ts`).
 * C'est la seule porte du site derrière un mot de passe : la laisser sans
 * compteur reviendrait à laisser tourner une attaque par dictionnaire à la
 * vitesse du réseau.
 */
const LOGIN_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

/** Longueurs maximales acceptées. Au-delà, c'est du remplissage. */
const MAX_PASSWORD_LENGTH = 200;
const MAX_NOTE_LENGTH = 2_000;
const MAX_TRACKING_LENGTH = 128;

/** Caractères de contrôle, retours à la ligne compris. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;
/** Les mêmes, mais en laissant passer `\n` et `\t` d'une zone de texte. */
const CONTROL_CHARS_MULTILINE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;

/**
 * Nettoie une saisie libre.
 *
 * Les caractères de contrôle sautent : ils n'ont rien à faire dans un numéro
 * de suivi, et ce sont eux qui coupent une ligne de CSV en deux à
 * l'ouverture. Les retours à la ligne d'une note sont conservés — c'est une
 * zone de texte multiligne, et les aplatir détruirait la mise en forme de
 * l'opérateur.
 */
function clean(value: unknown, { multiline = false } = {}): string {
  if (typeof value !== "string") return "";
  return value
    .replace(multiline ? CONTROL_CHARS_MULTILINE : CONTROL_CHARS, "")
    .trim();
}

export async function signIn(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isAdminConfigured()) {
    return {
      error:
        "Administration non configurée sur ce serveur. Renseigner ADMIN_PASSWORD et ADMIN_SESSION_SECRET, puis redémarrer.",
    };
  }

  const limited = rateLimit(
    `admin-login:${clientKeyFromHeaders(await headers())}`,
    LOGIN_RATE_LIMIT,
  );
  if (!limited.ok) {
    return {
      error: `Trop de tentatives. Réessayez dans ${Math.ceil(limited.retryAfter / 60)} minutes.`,
    };
  }

  const password = clean(formData.get("password")).slice(
    0,
    MAX_PASSWORD_LENGTH,
  );

  // Message unique, volontairement muet sur la cause : distinguer « champ
  // vide » de « mot de passe faux » renseigne sur ce qui est attendu.
  if (!password || !verifyPassword(password)) {
    return { error: "Mot de passe incorrect." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/connexion");
}

/**
 * Change le statut d'une sélection de commandes.
 *
 * Sert la fiche — une seule référence — comme la liste, où la sélection peut
 * en compter cinquante. Un seul chemin d'écriture pour les deux : le jour où
 * la règle change, elle change une fois.
 */
export async function changeStatus(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const status = formData.get("status");
  if (!isOrderStatus(status)) return { error: "Statut inconnu." };

  const references = formData
    .getAll("reference")
    .map((value) => clean(value))
    .filter(Boolean);

  if (references.length === 0) {
    return { error: "Aucune commande sélectionnée." };
  }

  const note = clean(formData.get("note"), { multiline: true }).slice(
    0,
    MAX_NOTE_LENGTH,
  );

  try {
    const changed = await updateOrderStatus(references, status, note);

    // Les pages sont rendues à la demande, mais le routeur client garde son
    // instantané : sans cette invalidation, le tableau afficherait encore
    // l'ancien statut jusqu'au prochain rechargement complet.
    revalidatePath("/admin");
    for (const reference of references) {
      revalidatePath(`/admin/commandes/${reference}`);
    }

    if (changed === 0) {
      return { message: "Aucun changement : ce statut était déjà en place." };
    }

    return {
      message:
        changed === 1
          ? `Commande passée en « ${ORDER_STATUS_LABELS[status]} ».`
          : `${changed} commandes passées en « ${ORDER_STATUS_LABELS[status]} ».`,
    };
  } catch (error) {
    console.error("Changement de statut impossible", error);
    return { error: "La base n'a pas accepté la modification. Réessayez." };
  }
}

/** Numéro de suivi et note interne d'une commande. */
export async function saveDetails(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const reference = clean(formData.get("reference"));
  if (!reference) return { error: "Référence manquante." };

  const trackingNumber = clean(formData.get("trackingNumber")).slice(
    0,
    MAX_TRACKING_LENGTH,
  );
  const internalNote = clean(formData.get("internalNote"), {
    multiline: true,
  }).slice(0, MAX_NOTE_LENGTH);

  try {
    const found = await updateOrderDetails(reference, {
      trackingNumber,
      internalNote,
    });

    if (!found) return { error: "Commande introuvable." };

    revalidatePath(`/admin/commandes/${reference}`);
    return { message: "Enregistré." };
  } catch (error) {
    console.error("Enregistrement des détails impossible", error);
    return { error: "La base n'a pas accepté la modification. Réessayez." };
  }
}
