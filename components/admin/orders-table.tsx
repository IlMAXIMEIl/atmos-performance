"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";

import { changeStatus, type ActionState } from "@/app/admin/actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { toQueryString, type AdminFilters } from "@/lib/admin-filters";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/order-status";

/**
 * Une ligne du tableau, telle que le serveur la prépare.
 *
 * Les valeurs arrivent **déjà formatées**. Deux raisons, et la seconde est la
 * plus importante :
 *
 * - seul ce qui s'affiche traverse la frontière. Adresse, téléphone et note
 *   interne restent sur le serveur : ils ne sont lisibles que sur la fiche,
 *   et n'ont rien à faire dans la charge utile de la liste ;
 * - une date ou un montant formatés dans un composant client seraient
 *   recalculés à l'hydratation, avec le risque d'écart que
 *   `lib/format.ts` documente longuement.
 */
export type OrderRow = {
  reference: string;
  receivedAt: string;
  name: string;
  email: string;
  quantity: string;
  amount: string;
  plan: string;
  status: OrderStatus;
};

/** En-tête de colonne triable : il bascule le sens au second clic. */
function SortableHeader({
  label,
  column,
  filters,
  className = "",
}: {
  label: string;
  column: "date" | "montant";
  filters: AdminFilters;
  className?: string;
}) {
  const active = filters.sort === column;
  const direction = active && filters.direction === "asc" ? "desc" : "asc";
  const Icon = filters.direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      // `aria-sort` appartient à l'en-tête de colonne, pas au lien qu'il
      // contient : c'est la colonne qui est triée.
      aria-sort={
        active
          ? filters.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={`px-3 py-2.5 font-normal ${className}`}
    >
      <Link
        href={`/admin${toQueryString(filters, { sort: column, direction, page: 1 })}`}
        className={`inline-flex items-center gap-1.5 transition-colors hover:text-ink ${
          active ? "text-ink" : ""
        }`}
      >
        {label}
        {active && <Icon className="h-3 w-3" strokeWidth={2.2} aria-hidden />}
      </Link>
    </th>
  );
}

export function OrdersTable({
  rows,
  filters,
}: {
  rows: OrderRow[];
  filters: AdminFilters;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    changeStatus,
    {},
  );
  const allBox = useRef<HTMLInputElement>(null);

  /*
    La sélection est remise à zéro dès que les lignes changent.

    Une page tournée, un filtre resserré : la sélection porterait sur des
    commandes qui ne sont plus à l'écran, et le lot s'appliquerait à des
    lignes que personne ne voit.

    Cela couvre aussi le cas d'après le lot : `changeStatus` appelle
    `revalidatePath`, la route est rendue à nouveau dans la même réponse, et
    `rows` arrive avec une nouvelle identité. Un second effet pour vider la
    sélection après succès serait redondant.

    Ajustement **pendant le rendu**, pas dans un effet : c'est le motif que
    React documente pour remettre un état à zéro quand une prop change, et il
    évite le rendu en cascade qu'un `useEffect` déclencherait.
  */
  const [renderedRows, setRenderedRows] = useState(rows);
  if (rows !== renderedRows) {
    setRenderedRows(rows);
    setSelected([]);
  }

  // « Certaines, pas toutes » n'a pas d'attribut HTML : il se pose en
  // JavaScript, sur la propriété de l'élément.
  useEffect(() => {
    if (allBox.current) {
      allBox.current.indeterminate =
        selected.length > 0 && selected.length < rows.length;
    }
  }, [selected, rows.length]);

  function toggle(reference: string) {
    setSelected((current) =>
      current.includes(reference)
        ? current.filter((item) => item !== reference)
        : [...current, reference],
    );
  }

  /*
    Le retour de l'action, extrait pour être affiché dans les deux cas.

    Un lot fait souvent sortir ses lignes du filtre courant — passer en
    « Expédiée » les trois commandes d'une liste filtrée sur « En
    fabrication » la vide entièrement. Si la confirmation ne vivait que dans
    la branche « il y a des lignes », l'opérateur verrait le tableau se vider
    sans savoir si son changement est passé, a échoué, ou n'a rien fait.
  */
  const feedback = (state.error || state.message) && (
    <p
      role="status"
      className={`mt-3 rounded-lg border px-4 py-2.5 text-[0.85rem] ${
        state.error
          ? "border-danger/35 bg-danger/10 text-danger-soft"
          : "border-accent/30 bg-accent-soft text-accent"
      }`}
    >
      {state.error ?? state.message}
    </p>
  );

  if (rows.length === 0) {
    return (
      <>
        {/* Le message d'abord : c'est lui qui explique le tableau vide. */}
        {feedback}
        <p className="mt-3 rounded-2xl border border-line bg-deep/60 px-6 py-14 text-center text-[0.9rem] text-dim">
          Aucune commande ne correspond à ces filtres.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-line bg-deep/60">
        <table className="w-full min-w-[56rem] border-collapse text-left">
          <thead className="border-b border-line font-mono text-[0.62rem] tracking-[0.14em] text-dimmer uppercase">
            <tr>
              <th scope="col" className="w-10 px-3 py-2.5">
                <input
                  ref={allBox}
                  type="checkbox"
                  checked={selected.length === rows.length}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? rows.map((row) => row.reference)
                        : [],
                    )
                  }
                  aria-label="Tout sélectionner sur cette page"
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </th>
              <SortableHeader label="Date" column="date" filters={filters} />
              <th scope="col" className="px-3 py-2.5 font-normal">
                Client
              </th>
              <th scope="col" className="px-3 py-2.5 font-normal">
                Formule
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">
                Qté
              </th>
              <SortableHeader
                label="Montant"
                column="montant"
                filters={filters}
                className="text-right"
              />
              <th scope="col" className="px-3 py-2.5 font-normal">
                Statut
              </th>
              <th scope="col" className="px-3 py-2.5 font-normal">
                Référence
              </th>
              <th scope="col" className="w-10 px-3 py-2.5">
                <span className="sr-only">Ouvrir</span>
              </th>
            </tr>
          </thead>

          <tbody className="text-[0.85rem]">
            {rows.map((row) => {
              const checked = selected.includes(row.reference);

              return (
                <tr
                  key={row.reference}
                  className={`border-b border-line/60 transition-colors last:border-0 ${
                    checked ? "bg-accent-soft" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(row.reference)}
                      aria-label={`Sélectionner la commande de ${row.name || row.email}`}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                  </td>

                  <td className="px-3 py-3 font-mono text-[0.76rem] whitespace-nowrap text-dim">
                    {row.receivedAt}
                  </td>

                  <td className="px-3 py-3">
                    <span className="block text-ink">{row.name || "—"}</span>
                    <span className="block text-[0.78rem] text-dimmer">
                      {row.email}
                    </span>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap text-dim">
                    {row.plan}
                  </td>

                  <td className="px-3 py-3 text-right font-mono text-[0.78rem] text-dim">
                    {row.quantity}
                  </td>

                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap text-ink">
                    {row.amount}
                  </td>

                  <td className="px-3 py-3">
                    <StatusBadge status={row.status} />
                  </td>

                  <td className="px-3 py-3 font-mono text-[0.72rem] text-dimmer">
                    {row.reference}
                  </td>

                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/commandes/${row.reference}`}
                      aria-label={`Ouvrir la commande ${row.reference}`}
                      className="inline-flex text-dimmer transition-colors hover:text-accent"
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/*
        Barre d'actions en lot.

        Collée en bas de la fenêtre tant qu'une sélection existe : le jour où
        une série entière part à la fabrication, on coche cinquante lignes et
        la commande reste sous la main sans avoir à remonter.

        Le `sticky` ne tient que si aucun ancêtre n'a `overflow-hidden` — d'où
        l'`overflow-x-clip` de `AdminShell`.
      */}
      {selected.length > 0 && (
        <form
          action={formAction}
          className="sticky bottom-4 z-20 mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-elev/95 px-4 py-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md"
        >
          {selected.map((reference) => (
            <input
              key={reference}
              type="hidden"
              name="reference"
              value={reference}
            />
          ))}

          <span className="font-mono text-[0.7rem] tracking-[0.12em] text-accent uppercase">
            {selected.length} sélectionnée{selected.length > 1 ? "s" : ""}
          </span>

          <label htmlFor="bulk-status" className="sr-only">
            Nouveau statut
          </label>
          <select
            id="bulk-status"
            name="status"
            defaultValue="en_fabrication"
            className="rounded-lg border border-line-strong bg-deep px-3 py-2 text-[0.85rem] text-ink focus:border-accent/50 focus:outline-none"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <label htmlFor="bulk-note" className="sr-only">
            Note jointe au journal
          </label>
          <input
            id="bulk-note"
            name="note"
            type="text"
            placeholder="Note (facultative), consignée dans le journal"
            className="min-w-[14rem] flex-1 rounded-lg border border-line-strong bg-deep px-3 py-2 text-[0.85rem] text-ink placeholder:text-dimmer focus:border-accent/50 focus:outline-none"
          />

          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-accent px-5 py-2 text-[0.82rem] font-semibold text-void transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
          >
            {isPending ? "Application…" : "Appliquer"}
          </button>

          <button
            type="button"
            onClick={() => setSelected([])}
            className="px-2 font-mono text-[0.66rem] tracking-[0.12em] text-dimmer uppercase transition-colors hover:text-ink"
          >
            Annuler
          </button>
        </form>
      )}

      {feedback}
    </>
  );
}
