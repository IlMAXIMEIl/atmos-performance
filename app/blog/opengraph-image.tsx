import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

/**
 * Carte propre au segment.
 *
 * Nécessaire dès qu'une page déclare son propre bloc `openGraph` : ce bloc
 * remplace entièrement celui hérité de la racine, image comprise. Un fichier
 * `opengraph-image` dans le même segment reprend la main.
 */
export const alt = "Blog ATMOS — altitude, oxygénation et performance";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Blog",
    title: "Altitude, oxygénation et performance.",
    footer: "Articles de fond sur l'hypoxie, les protocoles et la physiologie",
  });
}
