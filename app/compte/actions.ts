"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { creerClient, clientConnecte } from "@/lib/supabase/server";
import { MAX_ALTITUDE } from "@/lib/altitude";
import { DUREE_NUIT_MAX_H } from "@/lib/nuit";

/**
 * Les actions du tracker.
 *
 * ## Chacune revérifie l'identité
 *
 * Le middleware redirige les visiteurs sans session, mais une action serveur
 * s'appelle aussi directement en POST, sans passer par une page. La garde
 * est donc ici, au plus près de l'écriture — et les politiques RLS de
 * Postgres derrière. Trois couches, dont deux qui ne se contournent pas.
 *
 * ## Elles renvoient un message, elles ne lèvent pas
 *
 * Une exception dans une action affiche l'écran d'erreur de Next : le client
 * perd sa page et ne sait pas ce qu'il s'est passé. Ces actions rendent donc
 * un état lisible, que le formulaire affiche à côté du bouton.
 */

export type Resultat = { erreur: string | null };

const OK: Resultat = { erreur: null };

/** Palier par défaut d'un premier bloc de nuits, en mètres. */
const PALIER_DEFAUT_M = 2500;

/**
 * Nombre entier lu d'un formulaire, ou `null` si le champ était vide.
 *
 * Les champs de santé sont tous optionnels : un champ vide n'est pas une
 * erreur de saisie, c'est le cas normal.
 */
function entierOuNull(valeur: FormDataEntryValue | null): number | null {
  if (valeur === null) return null;
  const texte = String(valeur).trim();
  if (texte === "") return null;
  const nombre = Number(texte);
  return Number.isFinite(nombre) ? Math.round(nombre) : null;
}

/**
 * Ouvre une nuit.
 *
 * Crée le bloc de protocole au passage s'il n'y en a pas : le premier geste
 * du client ne doit pas être de remplir un formulaire de configuration.
 */
export async function demarrerNuit(
  _precedent: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const utilisateur = await clientConnecte();
  if (!utilisateur) redirect("/compte/connexion");

  const altitude = entierOuNull(donnees.get("altitude_m")) ?? PALIER_DEFAUT_M;
  if (altitude < 0 || altitude > MAX_ALTITUDE) {
    return { erreur: `Le palier doit être compris entre 0 et ${MAX_ALTITUDE} m.` };
  }

  const supabase = await creerClient();

  const { data: blocs } = await supabase
    .from("blocs")
    .select("id")
    .eq("statut", "en_cours")
    .limit(1);

  let blocId = blocs?.[0]?.id ?? null;

  if (!blocId) {
    const { data: nouveau, error } = await supabase
      .from("blocs")
      .insert({
        client_id: utilisateur.id,
        usage: "sommeil",
        niveau: "intermediaire",
        altitude_cible_m: altitude,
      })
      .select("id")
      .single();

    if (error) {
      return { erreur: "Impossible de démarrer le bloc. Réessayez." };
    }
    blocId = nouveau.id;
  }

  const { error } = await supabase.from("nuits").insert({
    client_id: utilisateur.id,
    bloc_id: blocId,
    altitude_m: altitude,
  });

  if (error) {
    /*
      L'index unique partiel a parlé : une nuit était déjà ouverte. Ce n'est
      pas un incident — c'est un double tap, ou un second onglet. On le dit
      simplement, et la page rechargée montrera la nuit en cours.
    */
    if (error.message.includes("nuits_une_seule_ouverte")) {
      revalidatePath("/compte");
      return { erreur: "Une nuit est déjà en cours." };
    }
    return { erreur: "Impossible de démarrer la nuit. Réessayez." };
  }

  revalidatePath("/compte");
  return OK;
}

/**
 * Clôt la nuit en cours, avec les mesures du réveil si le client les saisit.
 *
 * L'heure de fin est posée par la base (`now()`), sauf correction explicite :
 * on ne fait pas confiance à l'horloge du navigateur pour une donnée qui
 * alimente un cumul.
 */
export async function cloreNuit(
  _precedent: Resultat,
  donnees: FormData,
): Promise<Resultat> {
  const utilisateur = await clientConnecte();
  if (!utilisateur) redirect("/compte/connexion");

  const supabase = await creerClient();

  const { data: nuits } = await supabase
    .from("nuits")
    .select("id, debut")
    .is("fin", null)
    .limit(1);

  const nuit = nuits?.[0];
  if (!nuit) return { erreur: "Aucune nuit en cours." };

  const spo2 = entierOuNull(donnees.get("spo2_reveil"));
  const fc = entierOuNull(donnees.get("fc_reveil"));
  const ressenti = entierOuNull(donnees.get("ressenti"));

  if (spo2 !== null && (spo2 < 50 || spo2 > 100)) {
    return { erreur: "La SpO₂ doit être comprise entre 50 et 100 %." };
  }
  if (fc !== null && (fc < 25 || fc > 220)) {
    return { erreur: "La fréquence cardiaque doit être comprise entre 25 et 220." };
  }

  /*
    La nuit oubliée.

    Au-delà du plafond, la base refuserait la clôture — et elle a raison, une
    nuit de trente heures fausserait le cumul. Le champ `fin_corrigee` porte
    alors l'heure réelle indiquée par le client ; sans lui, on ne clôt pas et
    on renvoie l'écran de correction.
  */
  const corrigee = donnees.get("fin_corrigee");
  const depuis = (Date.now() - new Date(nuit.debut).getTime()) / 3_600_000;

  let fin: string;
  if (corrigee && String(corrigee).trim() !== "") {
    const date = new Date(String(corrigee));
    if (Number.isNaN(date.getTime())) {
      return { erreur: "Heure de réveil illisible." };
    }
    fin = date.toISOString();
  } else if (depuis > DUREE_NUIT_MAX_H) {
    return {
      erreur:
        "Cette nuit dépasse " +
        DUREE_NUIT_MAX_H +
        " h : indiquez l'heure réelle de votre réveil.",
    };
  } else {
    fin = new Date().toISOString();
  }

  const { error } = await supabase
    .from("nuits")
    .update({
      fin,
      spo2_reveil: spo2,
      fc_reveil: fc,
      ressenti,
      ...(corrigee ? { source: "saisie" as const } : {}),
    })
    .eq("id", nuit.id);

  if (error) {
    if (error.message.includes("nuits_duree_plausible")) {
      return {
        erreur: `L'heure indiquée dépasse ${DUREE_NUIT_MAX_H} h après le coucher.`,
      };
    }
    if (error.message.includes("nuits_fin_apres_debut")) {
      return { erreur: "L'heure de réveil précède l'heure de coucher." };
    }
    return { erreur: "Impossible d'enregistrer le réveil. Réessayez." };
  }

  /*
    Le consentement se donne au premier chiffre de santé enregistré, pas à
    l'inscription : on ne demande pas d'autorisation pour des données que la
    personne n'a pas encore décidé de saisir.
  */
  if (spo2 !== null || fc !== null) {
    await supabase
      .from("clients")
      .update({ consentement_sante: true, consenti_le: new Date().toISOString() })
      .eq("id", utilisateur.id)
      .eq("consentement_sante", false);
  }

  revalidatePath("/compte");
  return OK;
}

/** Abandonne la nuit en cours — le client s'est ravisé, elle ne compte pas. */
export async function annulerNuit(): Promise<void> {
  const utilisateur = await clientConnecte();
  if (!utilisateur) redirect("/compte/connexion");

  const supabase = await creerClient();
  await supabase.from("nuits").delete().is("fin", null);

  revalidatePath("/compte");
}
