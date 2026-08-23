"use client";

import { useActionState } from "react";

import { saveDetails, type ActionState } from "@/app/admin/actions";

/**
 * Numéro de suivi et note interne.
 *
 * Deux champs libres, volontairement. Un transporteur choisi dans une liste,
 * un lien de suivi reconstruit, une intégration logistique : rien de tout
 * cela ne se justifie tant qu'il n'y a pas le volume pour le payer. Un champ
 * texte se recopie depuis n'importe quel transporteur et ne tombe jamais en
 * panne.
 */
export function OrderDetailsForm({
  reference,
  trackingNumber,
  internalNote,
}: {
  reference: string;
  trackingNumber: string;
  internalNote: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    saveDetails,
    {},
  );

  const field =
    "w-full rounded-lg border border-line-strong bg-deep px-3 py-2.5 text-[0.88rem] text-ink placeholder:text-dimmer focus:border-accent/50 focus:outline-none";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="reference" value={reference} />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tracking"
          className="font-mono text-[0.62rem] tracking-[0.16em] text-dimmer uppercase"
        >
          Numéro de suivi
        </label>
        <input
          id="tracking"
          name="trackingNumber"
          type="text"
          /*
            `defaultValue` et non `value` : le champ est non contrôlé, ce qui
            laisse la saisie en cours intacte quand le rendu serveur repasse
            après un changement de statut. Contrôlé, il reviendrait à la
            valeur enregistrée au milieu d'une frappe.
          */
          defaultValue={trackingNumber}
          placeholder="Tel que le transporteur le donne"
          className={field}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="internal-note"
          className="font-mono text-[0.62rem] tracking-[0.16em] text-dimmer uppercase"
        >
          Note interne
        </label>
        <textarea
          id="internal-note"
          name="internalNote"
          rows={4}
          defaultValue={internalNote}
          placeholder="Ce que le client ne voit pas : rappel à passer, contrainte de livraison, arrangement particulier."
          className={`${field} resize-y leading-relaxed`}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full border border-line-strong px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.14em] text-ink uppercase transition-colors duration-300 hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>

        {(state.error || state.message) && (
          <p
            role="status"
            className={`text-[0.82rem] ${
              state.error ? "text-danger-soft" : "text-accent"
            }`}
          >
            {state.error ?? state.message}
          </p>
        )}
      </div>
    </form>
  );
}
