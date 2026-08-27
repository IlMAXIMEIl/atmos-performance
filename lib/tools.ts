/**
 * Catalogue des outils publics.
 *
 * Source unique : la page d'index `/outils` les liste et `app/sitemap.ts` les
 * déclare aux moteurs. Ajouter une entrée ici suffit à exposer un nouveau
 * calculateur des deux côtés — il ne reste qu'à créer sa page sous
 * `app/outils/<slug>/`.
 */

export type Tool = {
  /** Segment d'URL sous `/outils`, qui sert aussi de clé de rendu. */
  slug: string;
  name: string;
  /** Une ligne : ce que l'outil calcule, pas ce qu'il promet. */
  tagline: string;
  /** Repères affichés sur la carte, pour situer l'outil d'un coup d'œil. */
  highlights: string[];
};

export const TOOLS_PATH = "/outils";

export const TOOLS: Tool[] = [
  {
    slug: "simulateur-altitude",
    name: "Simulateur d'altitude",
    tagline:
      "Votre protocole d'hypoxie en deux questions : palier d'altitude simulée, structure des cycles et plage de SpO₂ à tenir.",
    highlights: [
      "Protocole personnalisé",
      "Convertisseur FiO₂ ↔ altitude",
      "Comparatif de coût",
    ],
  },
];
