"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  EVENEMENT_OUVRIR,
  lireConsentement,
  poserConsentement,
  type Consentement,
} from "@/lib/consentement";

/**
 * Le bandeau cookies — une carte discrète, pas un mur.
 *
 * Il n'apparaît que tant qu'aucun choix n'est mémorisé, ne recouvre rien
 * d'essentiel, et disparaît au premier clic. Les deux boutons ont
 * exactement le même poids visuel : la CNIL exige que refuser soit aussi
 * simple qu'accepter, et c'est de toute façon la seule version honnête.
 *
 * Rendu vide au serveur puis évalué dans `useEffect` : le choix vit dans
 * un cookie que le serveur ne lit pas, l'hydratation doit produire le
 * même arbre des deux côtés.
 *
 * Le pied de page et la page de confidentialité peuvent le rouvrir via
 * l'évènement `EVENEMENT_OUVRIR` — c'est le geste de retrait du
 * consentement, accessible en permanence.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lireConsentement() === null) setVisible(true);

    const rouvrir = () => setVisible(true);
    window.addEventListener(EVENEMENT_OUVRIR, rouvrir);
    return () => window.removeEventListener(EVENEMENT_OUVRIR, rouvrir);
  }, []);

  if (!visible) return null;

  const choisir = (choix: Consentement) => {
    poserConsentement(choix);
    setVisible(false);
  };

  const bouton =
    "flex-1 rounded-lg border border-line bg-white/[0.03] px-4 py-2.5 " +
    "text-[0.82rem] font-light text-ink transition-colors duration-300 " +
    "hover:border-accent/40 hover:text-accent";

  return (
    <aside
      role="dialog"
      aria-label="Choix des cookies"
      className="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-sm rounded-2xl border border-line bg-[#0B0C10]/95 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:left-auto sm:mx-0"
    >
      <p className="font-mono text-[0.62rem] tracking-[0.24em] text-accent uppercase">
        Cookies
      </p>

      <p className="mt-3 text-[0.84rem] leading-relaxed font-light text-dim text-pretty">
        Un seul cookie optionnel ici : il retient la campagne qui vous a
        amené, pour savoir si nos publicités servent à quelque chose. Pas de
        suivi, pas de revente. Les cookies de session et de paiement,
        nécessaires au site, ne dépendent pas de ce choix.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={() => choisir("refuse")} className={bouton}>
          Refuser
        </button>
        <button type="button" onClick={() => choisir("accepte")} className={bouton}>
          Accepter
        </button>
      </div>

      <Link
        href="/confidentialite#cookies"
        className="mt-4 inline-block text-[0.75rem] font-light text-dimmer underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
      >
        En savoir plus sur les cookies
      </Link>
    </aside>
  );
}
