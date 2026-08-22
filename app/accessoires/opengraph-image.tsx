import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

/**
 * Carte propre au segment.
 *
 * Nécessaire dès qu'une page déclare son propre bloc `openGraph` : ce bloc
 * remplace entièrement celui hérité de la racine, image comprise.
 */
export const alt = "Les accessoires de l'écosystème ATMOS";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Accessoires",
    title: "Le générateur n'est qu'un point de départ.",
    footer: "Masque, filtre, tente d'altitude, oxymètre de pouls",
  });
}
