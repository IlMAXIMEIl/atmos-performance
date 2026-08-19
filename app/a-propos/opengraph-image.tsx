import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

/**
 * Carte propre au segment.
 *
 * Nécessaire dès que la page déclare son propre bloc `openGraph` : ce bloc
 * remplace entièrement celui hérité de la racine, image comprise.
 */
export const alt = "À propos d'ATMOS PERFORMANCE";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "À propos",
    title: "La science de la haute altitude, sans intermédiaires.",
    footer:
      "Vente directe, prix juste, protocoles fondés sur les consensus publiés",
  });
}
