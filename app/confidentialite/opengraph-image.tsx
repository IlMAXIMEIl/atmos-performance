import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

/**
 * Carte propre au segment — même nécessité que sur les autres pages
 * légales : le bloc `openGraph` de la page remplace celui de la racine,
 * image comprise.
 */
export const alt = "Politique de confidentialité ATMOS PERFORMANCE";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Confidentialité",
    title: "Politique de confidentialité.",
    footer: "Données, cookies et droits RGPD",
  });
}
