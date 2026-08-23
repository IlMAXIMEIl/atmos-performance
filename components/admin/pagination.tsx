import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { toQueryString, type AdminFilters } from "@/lib/admin-filters";

/**
 * Pagination, en liens et non en boutons.
 *
 * Chaque page est une URL : elle s'ouvre dans un onglet, se met en signet et
 * se retrouve par le retour arrière. Un bouton qui appellerait le routeur
 * n'offrirait rien de tout cela, pour le même travail.
 *
 * Pas de numéros de page : au-delà de quelques centaines de commandes, la
 * liste des numéros devient plus longue que ce qu'elle aide à atteindre — et
 * ce n'est pas comme ça qu'on cherche une commande. Pour cela il y a les
 * filtres.
 */
export function Pagination({
  filters,
  page,
  pageCount,
  total,
  perPage,
}: {
  filters: AdminFilters;
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
}) {
  if (pageCount <= 1) return null;

  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  const step =
    "inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 font-mono text-[0.68rem] tracking-[0.12em] uppercase transition-colors";

  return (
    <nav
      aria-label="Pagination des commandes"
      className="mt-5 flex flex-wrap items-center justify-between gap-4"
    >
      <p className="font-mono text-[0.7rem] tracking-[0.1em] text-dimmer">
        {first} – {last} sur {total}
      </p>

      <div className="flex items-center gap-2.5">
        {page > 1 ? (
          <Link
            href={`/admin${toQueryString(filters, { page: page - 1 })}`}
            rel="prev"
            className={`${step} text-dim hover:border-accent/40 hover:text-accent`}
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Précédente
          </Link>
        ) : (
          <span className={`${step} cursor-default text-dimmer opacity-45`}>
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Précédente
          </span>
        )}

        <span className="font-mono text-[0.7rem] tracking-[0.1em] text-dim">
          {page} / {pageCount}
        </span>

        {page < pageCount ? (
          <Link
            href={`/admin${toQueryString(filters, { page: page + 1 })}`}
            rel="next"
            className={`${step} text-dim hover:border-accent/40 hover:text-accent`}
          >
            Suivante
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        ) : (
          <span className={`${step} cursor-default text-dimmer opacity-45`}>
            Suivante
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        )}
      </div>
    </nav>
  );
}
