import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

/**
 * Carte de partage de l'accueil, et repli pour toute page qui n'en déclare
 * pas de plus précise : Next applique le fichier le plus proche dans
 * l'arborescence.
 */
export const alt =
  "ATMOS ONE — générateur d'altitude hypoxique, jusqu'à 6 500 mètres simulés";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Générateur d'altitude",
    title: "Dominez l'altitude. Sans quitter votre chambre.",
    footer: "Jusqu'à 6 500 m simulés — VO2max, acclimatation, sommeil",
  });
}
