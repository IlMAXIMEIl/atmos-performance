"use server";

import { redirect } from "next/navigation";

import { creerClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

/**
 * L'entrée du compte, à la classique : créer un compte, se connecter,
 * mot de passe oublié.
 *
 * ## Pourquoi le mot de passe a remplacé le code à usage unique
 *
 * La première version envoyait un code par email à chaque connexion. Maxime
 * a tranché le 28 août 2026 : le parcours attendu est celui de tous les
 * sites — on crée son compte une fois, on se connecte ensuite sans attendre
 * un email. L'email ne sert plus qu'aux moments qui le justifient : la
 * confirmation d'inscription et la réinitialisation du mot de passe.
 *
 * ## Le détail qui change tout : des messages qui ne mentent pas
 *
 * `verifier l'existence d'un compte` reste impossible depuis ces écrans :
 * l'inscription sur une adresse déjà prise et la réinitialisation d'une
 * adresse inconnue répondent la même chose que le cas nominal. Un écran de
 * connexion est un oracle si on le laisse parler.
 */

export type EtatCompte = {
  message: string | null;
  /** `true` quand l'action s'est bien passée mais attend l'email du client. */
  attenteEmail?: boolean;
};

/** L'adresse de retour des liens envoyés par email (confirmation, reset). */
function urlDeRetour(chemin: string): string {
  return `${SITE_URL}${chemin}`;
}

function lireIdentifiants(donnees: FormData) {
  return {
    email: String(donnees.get("email") ?? "").trim().toLowerCase(),
    motDePasse: String(donnees.get("mot_de_passe") ?? ""),
  };
}

export async function creerCompte(
  _precedent: EtatCompte,
  donnees: FormData,
): Promise<EtatCompte> {
  const { email, motDePasse } = lireIdentifiants(donnees);
  const prenom = String(donnees.get("prenom") ?? "").trim();

  if (!email.includes("@") || email.length < 5) {
    return { message: "Adresse email invalide." };
  }
  if (motDePasse.length < 8) {
    return { message: "Le mot de passe doit compter au moins 8 caractères." };
  }

  const supabase = await creerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: {
      /*
        `espace: "client"` aiguille le déclencheur `handle_new_user` (0037) :
        ce compte crée une fiche client, pas un profil du personnel Nexus.
        Le prénom part dans les métadonnées, le déclencheur le range.
      */
      data: { espace: "client", prenom },
      emailRedirectTo: urlDeRetour("/compte/confirmation"),
    },
  });

  if (error) {
    console.error("Espace client — inscription :", error.code, error.message);
    if (error.code === "signup_disabled") {
      return {
        message:
          "Les inscriptions sont momentanément fermées. Réessayez un peu plus tard.",
      };
    }
    if (error.code === "weak_password") {
      return { message: "Ce mot de passe est trop faible : allongez-le." };
    }
    if (error.status === 429) {
      return { message: "Trop de tentatives. Patientez quelques minutes." };
    }
    return { message: "Impossible de créer le compte. Réessayez." };
  }

  /*
    Selon la configuration du projet, l'inscription ouvre la session tout de
    suite ou attend la confirmation de l'adresse. Les deux chemins existent
    ici pour que l'écran dise toujours la vérité.

    Cas particulier voulu par Supabase : une adresse déjà inscrite renvoie un
    utilisateur factice sans erreur — pour ne pas révéler l'existence du
    compte. Le message « vérifiez votre boîte » reste donc juste : la
    personne y trouvera soit la confirmation, soit rien, et l'écran n'a
    rien révélé.
  */
  if (data.session) redirect("/compte");

  return {
    message:
      "Compte créé — un email de confirmation vient de partir. Cliquez sur le lien qu'il contient, vous serez connecté dans la foulée.",
    attenteEmail: true,
  };
}

export async function seConnecter(
  _precedent: EtatCompte,
  donnees: FormData,
): Promise<EtatCompte> {
  const { email, motDePasse } = lireIdentifiants(donnees);

  if (!email.includes("@") || motDePasse === "") {
    return { message: "Renseignez votre adresse et votre mot de passe." };
  }

  const supabase = await creerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        message:
          "Votre adresse n'est pas encore confirmée : ouvrez l'email reçu à l'inscription, ou utilisez « mot de passe oublié » pour en recevoir un nouveau.",
      };
    }
    if (error.status === 429) {
      return { message: "Trop de tentatives. Patientez quelques minutes." };
    }
    // Identifiants faux, compte inexistant : même réponse, l'écran n'est
    // pas un annuaire.
    return { message: "Adresse ou mot de passe incorrect." };
  }

  redirect("/compte");
}

export async function demanderReinitialisation(
  _precedent: EtatCompte,
  donnees: FormData,
): Promise<EtatCompte> {
  const email = String(donnees.get("email") ?? "").trim().toLowerCase();

  if (!email.includes("@") || email.length < 5) {
    return { message: "Adresse email invalide." };
  }

  const supabase = await creerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: urlDeRetour("/compte/confirmation?suite=/compte/nouveau-mot-de-passe"),
  });

  if (error && error.status === 429) {
    return { message: "Trop de demandes. Patientez quelques minutes." };
  }
  if (error) {
    console.error("Espace client — réinitialisation :", error.message);
  }

  // Adresse connue ou non : même phrase.
  return {
    message:
      "Si un compte existe à cette adresse, un email de réinitialisation vient de partir.",
    attenteEmail: true,
  };
}

/** Depuis l'écran « nouveau mot de passe », une fois la session récupérée. */
export async function changerMotDePasse(
  _precedent: EtatCompte,
  donnees: FormData,
): Promise<EtatCompte> {
  const motDePasse = String(donnees.get("mot_de_passe") ?? "");
  if (motDePasse.length < 8) {
    return { message: "Le mot de passe doit compter au moins 8 caractères." };
  }

  const supabase = await creerClient();
  const { error } = await supabase.auth.updateUser({ password: motDePasse });

  if (error) {
    if (error.code === "same_password") {
      return { message: "C'est déjà votre mot de passe actuel." };
    }
    return {
      message:
        "Le lien de réinitialisation a expiré : redemandez un email depuis l'écran de connexion.",
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
