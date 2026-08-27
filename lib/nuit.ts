import { fio2AtAltitude } from "@/lib/altitude";

/**
 * Le vocabulaire du tracker : types, bornes et calculs purs.
 *
 * ## Pourquoi ce fichier existe séparément
 *
 * `lib/espace-client.ts` lit la base, donc importe `next/headers` — une API
 * réservée au serveur. Le composant `tracker.tsx` est un composant client :
 * s'il importe ne serait-ce qu'une constante de ce module, webpack tire
 * toute la chaîne dans le paquet du navigateur et le build échoue.
 *
 * Ce fichier ne contient donc que ce qui peut vivre des deux côtés. La règle
 * pour l'étendre : rien qui touche aux cookies, à la base, ni à
 * l'environnement.
 */

/** Plafond de durée d'une nuit, aligné sur la contrainte `nuits_duree_plausible`. */
export const DUREE_NUIT_MAX_H = 16;

/** Ce que le tracker propose quand une nuit a été oubliée. */
export const DUREE_NUIT_PROPOSEE_H = 12;

export type Nuit = {
  id: string;
  debut: string;
  fin: string | null;
  altitude_m: number;
  spo2_reveil: number | null;
  fc_reveil: number | null;
  ressenti: number | null;
  source: "directe" | "saisie";
};

export type Bloc = {
  id: string;
  usage: "sommeil" | "entrainement" | "repos";
  niveau: "debutant" | "intermediaire" | "confirme";
  objectif_heures: number;
  altitude_cible_m: number;
  statut: "en_cours" | "termine" | "abandonne";
  debut_le: string;
};

export type Progression = {
  heures_cumulees: number;
  nuits_closes: number;
  spo2_moyenne: number | null;
  fc_moyenne: number | null;
};

export type Etape = {
  seuil_heures: number;
  titre: string;
  litterature: string;
  article_slug: string | null;
};

export type Espace = {
  prenom: string;
  bloc: Bloc | null;
  nuitEnCours: Nuit | null;
  progression: Progression;
  dernieresNuits: Nuit[];
  etapes: Etape[];
  /** Vrai quand la nuit en cours dépasse le plafond : elle demande une correction. */
  nuitADemesure: boolean;
};

/** Heures écoulées depuis un horodatage, au dixième. */
export function dureeHeures(debut: string, fin?: string): number {
  const depart = new Date(debut).getTime();
  const arrivee = fin ? new Date(fin).getTime() : Date.now();
  return Math.round(((arrivee - depart) / 3_600_000) * 10) / 10;
}

/**
 * L'étape franchie, et celle qui vient.
 *
 * Les étapes arrivent triées par seuil : la dernière dont le seuil est
 * atteint est l'étape courante. Aucune n'est « gagnée » — elles décrivent où
 * en est la dose, pas une récompense.
 */
export function etapesAutour(etapes: Etape[], heures: number) {
  const atteintes = etapes.filter((etape) => heures >= etape.seuil_heures);
  const aVenir = etapes.filter((etape) => heures < etape.seuil_heures);

  return {
    courante: atteintes.at(-1) ?? null,
    prochaine: aVenir[0] ?? null,
  };
}

/** La FiO₂ correspondant à un palier, pour l'afficher à côté des mètres. */
export function fio2Pour(altitudeM: number): number {
  return fio2AtAltitude(altitudeM);
}
