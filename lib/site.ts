/** Constantes partagées par les métadonnées et le sitemap. */
export const SITE_NAME = "ATMOS PERFORMANCE";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://atmos-performance.com";
export const CONTACT_EMAIL = "contact@atmos-performance.com";

/** Description de marque, reprise par le balisage `Organization`. */
export const SITE_DESCRIPTION =
  "ATMOS PERFORMANCE conçoit ATMOS ONE, générateur d'hypoxie normobare qui simule de 0 à 6 500 mètres d'altitude pour l'entraînement, la VO2 max et l'acclimatation.";

/**
 * Comptes officiels de la marque.
 *
 * Source unique : le pied de page les affiche, le balisage `sameAs` les
 * déclare à Google. Un compte ajouté ici apparaît des deux côtés.
 */
export const SOCIAL_URLS = {
  instagram: "https://www.instagram.com/atmos_performance",
  youtube: "https://www.youtube.com/@atmos_performance",
  tiktok: "https://www.tiktok.com/@atmos_performance",
} as const;
