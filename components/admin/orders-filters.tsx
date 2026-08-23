"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { toQueryString, type AdminFilters } from "@/lib/admin-filters";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-status";

/**
 * Barre de recherche et de filtres.
 *
 * Elle n'a **aucun état propre** au-delà du champ de saisie : les filtres
 * actifs sont ceux de l'URL, passés en prop par la page. Un état local
 * doublonnerait l'URL et les deux divergeraient au premier retour arrière du
 * navigateur.
 *
 * L'élément reste un vrai `<form method="get">`. Sans JavaScript il se
 * soumet nativement — l'URL est plus verbeuse, les paramètres vides
 * compris, et la page les ignore. Avec JavaScript, `onSubmit` reprend la
 * main et pousse une URL propre par le routeur, sans rechargement complet.
 */
export function OrdersFilters({
  filters,
  total,
}: {
  filters: AdminFilters;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(filters.search);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
    Le champ suit l'URL quand l'URL change sous lui.

    Un retour arrière du navigateur, ou le bouton « Effacer », modifient
    `filters.search` sans passer par la frappe : le champ doit suivre, sinon
    il affiche encore la recherche précédente sur une liste qui, elle, a
    changé.

    L'ajustement est fait **pendant le rendu**, pas dans un effet. React le
    recommande explicitement pour ce cas — remettre un état à zéro quand une
    prop change — et le rendu se termine avant que quoi que ce soit ne soit
    peint : il n'y a pas l'image intermédiaire qu'un `useEffect` produirait,
    ni le second rendu en cascade que le linter refuse.
  */
  const [urlSearch, setUrlSearch] = useState(filters.search);
  if (filters.search !== urlSearch) {
    setUrlSearch(filters.search);
    setSearch(filters.search);
  }

  /** Toute navigation repart de la page 1 : la 7 n'existe peut-être plus. */
  function apply(changes: Partial<AdminFilters>) {
    router.push(
      `${pathname}${toQueryString(filters, { page: 1, ...changes })}`,
    );
  }

  /**
   * La saisie attend 350 ms avant de partir.
   *
   * Sans ce délai, « dupont » lancerait six requêtes et six rendus serveur,
   * dont cinq jetés. Le champ, lui, reste immédiat : c'est l'état local qui
   * l'affiche, pas l'URL.
   */
  function onSearchChange(value: string) {
    setSearch(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => apply({ search: value }), 350);
  }

  const active =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.plan) ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  const field =
    "rounded-lg border border-line-strong bg-deep px-3 py-2.5 text-[0.85rem] text-ink focus:border-accent/50 focus:outline-none";

  return (
    <form
      method="get"
      action={pathname}
      onSubmit={(event) => {
        event.preventDefault();
        if (debounce.current) clearTimeout(debounce.current);
        apply({ search });
      }}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-deep/60 p-4"
    >
      <div className="flex min-w-[16rem] flex-1 flex-col gap-1.5">
        <label
          htmlFor="admin-search"
          className="font-mono text-[0.62rem] tracking-[0.16em] text-dimmer uppercase"
        >
          Recherche
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-dimmer"
            strokeWidth={1.8}
            aria-hidden
          />
          <input
            id="admin-search"
            name="q"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Email, référence de paiement, nom"
            className={`${field} w-full pl-9 placeholder:text-dimmer`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-status"
          className="font-mono text-[0.62rem] tracking-[0.16em] text-dimmer uppercase"
        >
          Statut
        </label>
        <select
          id="admin-status"
          name="statut"
          value={filters.status ?? ""}
          onChange={(event) =>
            apply({
              status: (event.target.value || null) as AdminFilters["status"],
            })
          }
          className={field}
        >
          <option value="">Tous</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-plan"
          className="font-mono text-[0.62rem] tracking-[0.16em] text-dimmer uppercase"
        >
          Formule
        </label>
        <select
          id="admin-plan"
          name="plan"
          value={filters.plan ?? ""}
          onChange={(event) => apply({ plan: event.target.value || null })}
          className={field}
        >
          <option value="">Toutes</option>
          <option value="achat">Achat</option>
          <option value="leasing">Location</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-from"
          className="font-mono text-[0.62rem] tracking-[0.16em] text-dimmer uppercase"
        >
          Du
        </label>
        <input
          id="admin-from"
          name="du"
          type="date"
          value={filters.from ?? ""}
          onChange={(event) => apply({ from: event.target.value || null })}
          className={field}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-to"
          className="font-mono text-[0.62rem] tracking-[0.16em] text-dimmer uppercase"
        >
          Au
        </label>
        <input
          id="admin-to"
          name="au"
          type="date"
          value={filters.to ?? ""}
          onChange={(event) => apply({ to: event.target.value || null })}
          className={field}
        />
      </div>

      {/* Repli sans JavaScript : avec, `onSubmit` a déjà pris la main. */}
      <button
        type="submit"
        className="rounded-lg border border-line-strong px-4 py-2.5 font-mono text-[0.66rem] tracking-[0.14em] text-dim uppercase transition-colors hover:border-accent/40 hover:text-accent"
      >
        Filtrer
      </button>

      {active && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 font-mono text-[0.66rem] tracking-[0.14em] text-dimmer uppercase transition-colors hover:text-danger-soft"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
          Effacer
        </button>
      )}

      <p
        aria-live="polite"
        className="ml-auto self-center font-mono text-[0.7rem] tracking-[0.1em] text-dimmer"
      >
        {total} commande{total > 1 ? "s" : ""}
      </p>
    </form>
  );
}
