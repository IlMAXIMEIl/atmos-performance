"use client";

import { ouvrirBandeau } from "@/lib/consentement";

/**
 * Le geste de retrait du consentement, sous forme de lien sobre.
 *
 * Monté dans la page de confidentialité et le pied de page : le RGPD exige
 * que retirer son accord soit aussi accessible que le donner, à tout
 * moment. Le clic rouvre simplement le bandeau — même écran, même choix.
 */
export function GererCookies({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={ouvrirBandeau}
      className={
        className ??
        "text-[0.92rem] leading-relaxed font-light text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
      }
    >
      Gérer mes cookies
    </button>
  );
}
