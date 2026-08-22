import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

/** Voir `app/accessoires/opengraph-image` pour la raison d'être du fichier. */
export const alt = "La science derrière l'hypoxie intermittente";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "La science",
    title: "Rien de magique. De la physiologie.",
    footer: "Trente ans de littérature sur l'hypoxie intermittente",
  });
}
