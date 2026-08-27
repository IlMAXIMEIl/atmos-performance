"use server";

import { redirect } from "next/navigation";

import { creerClient } from "@/lib/supabase/server";

/**
 * Connexion par code à usage unique.
 *
 * ## Pas de mot de passe, et ce n'est pas un raccourci
 *
 * Un mot de passe de plus, c'est un mot de passe réutilisé de plus, un
 * écran « mot de passe oublié » à construire et une base de secrets à
 * protéger. Le code envoyé par email prouve la même chose — la maîtrise de
 * l'adresse — sans rien de tout cela. C'est aussi l'adresse que Stripe
 * connaît déjà, ce qui rendra le rattachement des commandes naturel en
 * phase 2.1.
 *
 * ## Deux temps, deux actions
 *
 * `demanderCode` envoie, `verifierCode` valide. La session n'existe qu'après
 * la seconde : c'est Supabase qui pose les cookies, via le client serveur.
 */

export type EtatConnexion = {
  etape: "email" | "code";
  email: string;
  message: string | null;
};

/**
 * Réponse unique, que l'adresse existe ou non.
 *
 * Dire « ce compte n'existe pas » transformerait l'écran en oracle : on
 * pourrait y tester des adresses pour savoir qui est client d'ATMOS. La
 * formulation reste donc la même dans tous les cas.
 */
const ENVOI_CONFIRME =
  "Si cette adresse peut recevoir un code, il vient d'être envoyé. Vérifiez votre boîte mail.";

export async function demanderCode(
  _precedent: EtatConnexion,
  donnees: FormData,
): Promise<EtatConnexion> {
  const email = String(donnees.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email.includes("@") || email.length < 5) {
    return { etape: "email", email, message: "Adresse email invalide." };
  }

  const supabase = await creerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      /*
        `espace: "client"` aiguille le déclencheur `handle_new_user` de la
        migration 0037 : ce compte crée une fiche client, pas un profil de
        personnel Nexus. Ce n'est pas une frontière de sécurité — elle est
        dans le RLS — mais l'aiguillage garde les deux populations propres.
      */
      data: { espace: "client" },
    },
  });

  if (error) {
    // Le détail part dans les journaux du serveur ; l'écran reste muet sur
    // l'existence du compte.
    console.error("Espace client — envoi du code :", error.message);
    if (error.status === 429) {
      return {
        etape: "email",
        email,
        message: "Trop de demandes. Patientez quelques minutes.",
      };
    }
  }

  return { etape: "code", email, message: ENVOI_CONFIRME };
}

export async function verifierCode(
  _precedent: EtatConnexion,
  donnees: FormData,
): Promise<EtatConnexion> {
  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const code = String(donnees.get("code") ?? "").replace(/\s/g, "");

  if (code.length < 6) {
    return { etape: "code", email, message: "Le code compte six chiffres." };
  }

  const supabase = await creerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error) {
    return {
      etape: "code",
      email,
      message: "Code incorrect ou expiré. Demandez-en un nouveau.",
    };
  }

  redirect("/compte");
}

/** Ferme la session et renvoie à l'accueil. */
export async function seDeconnecter(): Promise<void> {
  const supabase = await creerClient();
  await supabase.auth.signOut();
  redirect("/");
}
