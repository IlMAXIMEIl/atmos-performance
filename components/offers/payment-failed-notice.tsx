"use client";

import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

/**
 * Message affiché au retour d'un paiement qui n'a pas abouti.
 *
 * `/reservation/confirmee` renvoie ici — `/?paiement=echec#offres` — quand
 * Stripe confirme que l'intention est en échec. Le visiteur retombe donc au
 * pied des offres, à l'endroit exact où il peut recommencer.
 *
 * Le texte insiste sur l'absence de débit : c'est la première question que se
 * pose quelqu'un dont le paiement vient d'échouer, et un doute là-dessus coûte
 * un email au support et une vente.
 */
export function PaymentFailedNotice() {
  const failed = useSearchParams().get("paiement") === "echec";
  if (!failed) return null;

  return (
    <p
      role="alert"
      className="mb-10 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/[0.07] px-5 py-4 text-[0.9rem] leading-relaxed text-danger-soft"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.8} />
      <span>
        Votre paiement n&apos;a pas abouti et{" "}
        <strong className="font-semibold">aucun montant n&apos;a été débité</strong>.
        Vous pouvez reprendre ci-dessous, avec le même moyen de paiement ou un
        autre.
      </span>
    </p>
  );
}
