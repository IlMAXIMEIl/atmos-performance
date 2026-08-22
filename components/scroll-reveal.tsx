"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Courbe commune à toutes les révélations de la refonte : départ franc,
 * arrivée longue. C'est l'équivalent GSAP de `EASE` dans `lib/motion.ts`,
 * qui reste en service sur les pages animées par framer-motion.
 */
export const REVEAL_EASE = "power3.out";

/** Le bloc entre en scène quand son haut passe sous cette ligne. */
const START = "top 88%";

/**
 * Rassemble les éléments marqués, sauf ceux qu'une scène revendique.
 *
 * Une section qui orchestre elle-même ses entrées — le hero et son
 * enchaînement au chargement, les scènes épinglées à venir — se signale par
 * `data-reveal-scope`. Sans ce filtre, ses éléments seraient animés deux
 * fois : par sa propre chronologie et par le lot global.
 */
function unclaimed(selector: string) {
  return gsap.utils
    .toArray<HTMLElement>(selector)
    .filter((element) => !element.closest("[data-reveal-scope]"));
}

/**
 * Moteur des révélations au défilement, monté une fois par page.
 *
 * Il ne rend rien : il balaie le document à l'hydratation et anime tout ce
 * qui porte `data-reveal` ou `data-reveal-line`. Les sections n'ont donc
 * aucune animation à câbler — un attribut suffit, ce qui garde les scènes
 * des étapes suivantes lisibles.
 *
 * `ScrollTrigger.batch` regroupe les éléments qui franchissent la ligne dans
 * la même image et les décale entre eux. Un déclencheur par élément donnerait
 * le même résultat visuel au prix de plusieurs dizaines d'instances.
 */
export function ScrollRevealController() {
  useGSAP(() => {
    const media = gsap.matchMedia();

    // Mouvement réduit : on lève l'état caché, sans transition.
    media.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(unclaimed("[data-reveal]"), { opacity: 1, y: 0 });
      gsap.set(unclaimed("[data-reveal-line] > *"), { yPercent: 0 });
    });

    media.add("(prefers-reduced-motion: no-preference)", () => {
      ScrollTrigger.batch(unclaimed("[data-reveal]"), {
        start: START,
        once: true,
        onEnter: (batch) =>
          gsap.fromTo(
            batch,
            { y: 26 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: REVEAL_EASE,
              stagger: 0.09,
              overwrite: true,
            },
          ),
      });

      // Volets masqués : c'est l'enfant qui glisse, le parent ne fait que
      // le rogner. On anime donc les enfants, mais on déclenche sur le
      // parent — sa hauteur est celle de la ligne de texte.
      ScrollTrigger.batch(unclaimed("[data-reveal-line]"), {
        start: START,
        once: true,
        onEnter: (batch) =>
          gsap.to(
            batch.flatMap((line) => Array.from(line.children)),
            {
              yPercent: 0,
              duration: 1.05,
              ease: "power4.out",
              stagger: 0.08,
              overwrite: true,
            },
          ),
      });
    });

    /**
     * Les polices arrivent après le premier rendu et redistribuent les
     * hauteurs ; sans ce recalcul, les déclencheurs restent calés sur la
     * mise en page de secours et se déclenchent quelques dizaines de pixels
     * trop tôt ou trop tard.
     */
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => media.revert();
  }, []);

  return null;
}
