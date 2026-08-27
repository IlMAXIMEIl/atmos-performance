import { creerClient, clientConnecte } from "@/lib/supabase/server";
import {
  DUREE_NUIT_MAX_H,
  dureeHeures,
  type Bloc,
  type Espace,
  type Etape,
  type Nuit,
  type Progression,
} from "@/lib/nuit";

/**
 * La lecture de l'espace client. **Serveur uniquement.**
 *
 * Les types, bornes et calculs purs vivent dans `lib/nuit.ts` : un composant
 * client qui importerait quoi que ce soit d'ici tirerait `next/headers` dans
 * le paquet du navigateur, et le build échouerait.
 *
 * ## Le cumul est calculé, jamais stocké
 *
 * Les heures viennent de la vue `progression_bloc`, qui somme les nuits
 * closes. Un total dénormalisé se désynchroniserait à la première correction
 * de nuit — et une correction est un cas normal ici, pas un incident.
 *
 * ## Rien n'est filtré par `client_id` dans ce fichier
 *
 * C'est volontaire, et ce n'est pas un oubli : les politiques RLS de la
 * migration 0037 restreignent déjà chaque requête aux lignes de l'appelant.
 * Ajouter un `.eq("client_id", …)` donnerait l'illusion que la sécurité est
 * ici, dans du TypeScript qu'un refactor peut effacer. Elle est dans
 * Postgres. Ce module lit « les nuits » et obtient les siennes.
 */

const PROGRESSION_VIDE: Progression = {
  heures_cumulees: 0,
  nuits_closes: 0,
  spo2_moyenne: null,
  fc_moyenne: null,
};

/**
 * Tout ce que l'écran d'accueil de l'espace affiche, en une passe.
 *
 * Renvoie `null` si personne n'est connecté — la page décide de la suite.
 */
export async function chargerEspace(): Promise<Espace | null> {
  const utilisateur = await clientConnecte();
  if (!utilisateur) return null;

  const supabase = await creerClient();

  const [fiche, blocs, nuits, etapes] = await Promise.all([
    supabase.from("clients").select("prenom").maybeSingle(),
    supabase
      .from("blocs")
      .select("*")
      .eq("statut", "en_cours")
      .order("debut_le", { ascending: false })
      .limit(1),
    supabase
      .from("nuits")
      .select("*")
      .order("debut", { ascending: false })
      .limit(30),
    supabase
      .from("etapes_dose")
      .select("seuil_heures, titre, litterature, article_slug")
      .order("ordre"),
  ]);

  const bloc = (blocs.data?.[0] as Bloc | undefined) ?? null;
  const toutesLesNuits = (nuits.data as Nuit[] | null) ?? [];
  const nuitEnCours = toutesLesNuits.find((nuit) => nuit.fin === null) ?? null;

  let progression = PROGRESSION_VIDE;
  if (bloc) {
    const { data } = await supabase
      .from("progression_bloc")
      .select("heures_cumulees, nuits_closes, spo2_moyenne, fc_moyenne")
      .eq("bloc_id", bloc.id)
      .maybeSingle();

    if (data) {
      progression = {
        heures_cumulees: Number(data.heures_cumulees ?? 0),
        nuits_closes: Number(data.nuits_closes ?? 0),
        spo2_moyenne:
          data.spo2_moyenne === null ? null : Number(data.spo2_moyenne),
        fc_moyenne: data.fc_moyenne === null ? null : Number(data.fc_moyenne),
      };
    }
  }

  return {
    prenom: fiche.data?.prenom ?? "",
    bloc,
    nuitEnCours,
    progression,
    dernieresNuits: toutesLesNuits
      .filter((nuit) => nuit.fin !== null)
      .slice(0, 7),
    etapes: (etapes.data as Etape[] | null) ?? [],
    nuitADemesure: nuitEnCours
      ? dureeHeures(nuitEnCours.debut) > DUREE_NUIT_MAX_H
      : false,
  };
}
