import type { Variants } from "framer-motion";

/** Courbe commune à toutes les sections : sortie longue, arrivée douce. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Orchestre l'apparition en cascade des enfants animés avec `rise`. */
export const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

/** Montée + défloutage : le mouvement de base du site. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EASE },
  },
};
