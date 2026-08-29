"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import {
  DROP_NAME,
  PURCHASE_PRICE_EUR,
  WAITLIST_CTA_SHORT,
  formatEuros,
} from "@/lib/offering";

/**
 * Barre d'action épinglée en bas d'écran, mobile uniquement.
 *
 * La page d'accueil fait plus de dix-huit mille pixels sur téléphone : un
 * visiteur convaincu à mi-parcours n'avait aucun bouton sous le pouce avant
 * la section Offres. Cette barre le lui rend — le prix d'un côté, l'action
 * de l'autre — sans rien ajouter au discours : deux constantes de
 * `lib/offering.ts`, aucun compte à rebours, aucune jauge.
 *
 * Trois règles de retenue :
 *
 * 1. **Invisible sur le premier écran.** Le hero porte déjà le même appel ;
 *    la barre n'apparaît qu'une fois le hero quitté, par `IntersectionObserver`
 *    — jamais de gestionnaire de défilement qui écrit dans l'état React.
 * 2. **Elle s'efface devant la section Offres.** Là-bas, la carte de prix
 *    fait le travail ; une barre par-dessus serait une relance de vendeur.
 * 3. **Mobile seulement** (`md:hidden`) : au-delà, le header suffit.
 *
 * L'état caché est un simple déplacement CSS : pas de moteur d'animation
 * pour un aller-retour de barre, et `motion-reduce` la fige sans transition.
 */
export function MobileStickyCta() {
  const [pastHero, setPastHero] = useState(false);
  const [overOffers, setOverOffers] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("section[aria-labelledby='hero-titre']");
    const offers = document.getElementById("offres");

    const watchers: IntersectionObserver[] = [];

    if (hero) {
      const io = new IntersectionObserver(
        ([entry]) => setPastHero(!entry.isIntersecting),
        { rootMargin: "0px 0px -35% 0px" },
      );
      io.observe(hero);
      watchers.push(io);
    }

    if (offers) {
      const io = new IntersectionObserver(
        ([entry]) => setOverOffers(entry.isIntersecting),
        { rootMargin: "15% 0px 15% 0px" },
      );
      io.observe(offers);
      watchers.push(io);
    }

    return () => watchers.forEach((io) => io.disconnect());
  }, []);

  const visible = pastHero && !overOffers;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-line bg-void/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-transform duration-300 ease-out will-change-transform md:hidden motion-reduce:transition-none ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <p className="font-mono text-[0.62rem] leading-[1.5] tracking-[0.14em] text-dim uppercase">
          {DROP_NAME}
          <br />
          <span className="text-ink">{`${formatEuros(PURCHASE_PRICE_EUR)} TTC`}</span>
        </p>
        <a
          href="#offres"
          tabIndex={visible ? 0 : -1}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[0.82rem] font-semibold tracking-[0.03em] text-void focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {WAITLIST_CTA_SHORT}
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
