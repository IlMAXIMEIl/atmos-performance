/**
 * Preuve sociale.
 *
 * Les quatre personnes ci-dessous sont des partenaires sous contrat : elles
 * testent l'appareil en avant-première et paraîtront avec lui. **Les
 * citations, elles, sont des textes de placement** — à remplacer par ce que
 * chacune aura effectivement dit après son test, avec son accord sur la
 * formulation, le nom et l'identifiant affichés.
 *
 * D'où l'interrupteur, dans le même esprit que `ORDERS_OPEN` et
 * `LEASING_OPEN` : le jour où l'un des partenaires se retire ou tarde à
 * rendre son retour, la section se coupe d'un seul endroit plutôt que de
 * laisser une citation qui n'appartient à personne.
 *
 * **Fermé pour l'instant** : les tests en avant-première n'ont pas eu lieu.
 * La section est écrite, vérifiée et branchée sous la fiche technique — il
 * suffira de remplacer les citations et de repasser cette constante à `true`.
 */
export const TESTIMONIALS_PUBLISHED = false;

export type Testimonial = {
  name: string;
  /** Fonction, puis identifiant public. Affichés sur deux lignes. */
  role: string;
  handle: string;
  quote: string;
  /**
   * Portrait, servi depuis `public/`. Absent, la carte affiche un monogramme
   * — les photographies ne sont pas encore recueillies.
   */
  avatar?: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Julien Fournier",
    role: "Athlète Endurance & Directeur Run Club",
    handle: "@julien_fournier",
    quote:
      "Indispensable pour encaisser la charge d'un gros bloc de volume. La différence sur la récupération nerveuse est mesurable.",
  },
  {
    name: "Paul",
    role: "Coach Running & Triathlon",
    handle: "@paul_cvin",
    quote:
      "J'ai intégré le protocole IHT dans mes préparations spécifiques. Le gain sur la tolérance lactique est brutal.",
  },
  {
    name: "Tobias",
    role: "Triathlète & Coach",
    handle: "@tobias_lcrn",
    quote:
      "L'outil ultime pour le biohacking de la récupération. La qualité du sommeil profond est transformée.",
  },
  {
    name: "Giovanni",
    role: "Entraîneur Triathlon",
    handle: "@giovanni_triathlon",
    quote:
      "Une ingénierie clinique enfin accessible à domicile. La densité capillaire post-protocole parle d'elle-même.",
  },
];

/** Initiales du monogramme, tant qu'aucun portrait n'est fourni. */
export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
