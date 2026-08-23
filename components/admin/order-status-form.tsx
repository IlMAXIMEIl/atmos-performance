"use client";

import { useActionState } from "react";

import { changeStatus, type ActionState } from "@/app/admin/actions";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/order-status";

/**
 * Changement de statut depuis la fiche.
 *
 * Même action serveur que le lot de la liste — `changeStatus` accepte une
 * référence comme cinquante. Deux chemins d'écriture pour un seul geste
 * auraient fini par diverger sur ce qu'ils journalisent.
 *
 * Les quatre statuts sont des boutons, pas une liste déroulante : ils tiennent
 * tous à l'écran, et le geste passe de trois interactions (ouvrir, choisir,
 * valider) à une seule.
 */
export function OrderStatusForm({
  reference,
  status,
}: {
  reference: string;
  status: OrderStatus;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    changeStatus,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="reference" value={reference} />

      <label
        htmlFor="status-note"
        className="font-mono text-[0.62rem] tracking-[0.16em] text-dimmer uppercase"
      >
        Note jointe au changement
      </label>
      <input
        id="status-note"
        name="note"
        type="text"
        placeholder="Facultative — consignée dans le journal"
        className="rounded-lg border border-line-strong bg-deep px-3 py-2.5 text-[0.85rem] text-ink placeholder:text-dimmer focus:border-accent/50 focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((candidate) => {
          const current = candidate === status;

          return (
            <button
              key={candidate}
              type="submit"
              name="status"
              value={candidate}
              // Le statut en place n'est pas cliquable : l'action l'ignorerait
              // de toute façon, autant ne pas laisser croire qu'il se passe
              // quelque chose.
              disabled={current || isPending}
              className={`rounded-full border px-4 py-2 font-mono text-[0.68rem] tracking-[0.12em] uppercase transition-colors duration-300 ${
                current
                  ? "cursor-default border-accent/45 bg-accent-soft text-accent"
                  : "border-line-strong text-dim hover:border-accent/40 hover:text-accent disabled:cursor-wait disabled:opacity-50"
              }`}
            >
              {ORDER_STATUS_LABELS[candidate]}
            </button>
          );
        })}
      </div>

      {(state.error || state.message) && (
        <p
          role="status"
          className={`rounded-lg border px-3.5 py-2.5 text-[0.82rem] ${
            state.error
              ? "border-danger/35 bg-danger/10 text-danger-soft"
              : "border-accent/30 bg-accent-soft text-accent"
          }`}
        >
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}
