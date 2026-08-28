import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

/** Carte propre au segment — voir la note des autres pages légales. */
export const alt = "Suppression des données ATMOS PERFORMANCE";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Vos données",
    title: "Suppression de vos données.",
    footer: "Procédure, délai et obligations légales",
  });
}
