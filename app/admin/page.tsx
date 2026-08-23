import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { OrdersFilters } from "@/components/admin/orders-filters";
import { OrdersTable, type OrderRow } from "@/components/admin/orders-table";
import { Pagination } from "@/components/admin/pagination";
import {
  readFilters,
  toQueryString,
  type SearchParams,
} from "@/lib/admin-filters";
import { requireAdmin } from "@/lib/admin-session";
import { formatAmount, formatParisDateTime } from "@/lib/format";
import {
  countOrdersByStatus,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PLAN_LABELS,
  searchOrders,
} from "@/lib/orders";

export const metadata: Metadata = { title: "Commandes — Administration" };

/**
 * Liste des commandes.
 *
 * La page est rendue à la demande — `requireAdmin` lit les cookies, ce qui
 * suffit à l'écarter du pré-rendu — et n'est jamais mise en cache : elle doit
 * montrer l'état de la base à l'instant où on la regarde, pas celui d'il y a
 * dix minutes.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();

  const filters = readFilters(await searchParams);

  let page;
  let counts;
  try {
    // Les deux requêtes sont indépendantes : les enchaîner ferait attendre la
    // liste derrière un décompte qui ne la conditionne pas.
    [page, counts] = await Promise.all([
      searchOrders(filters),
      countOrdersByStatus(),
    ]);
  } catch (error) {
    console.error("Lecture des commandes impossible", error);
    return (
      <AdminShell title="Commandes">
        <div className="rounded-2xl border border-danger/35 bg-danger/[0.07] px-6 py-8">
          <h2 className="text-[1.05rem] font-semibold text-danger-soft">
            La base n&apos;a pas répondu.
          </h2>
          <p className="mt-3 max-w-[52em] text-[0.9rem] leading-relaxed text-dim text-pretty">
            Les commandes sont en sécurité — Stripe reste la source de vérité,
            et cette table n&apos;en est qu&apos;une copie interrogeable. C&apos;est la
            connexion qui a échoué.{" "}
            <code className="font-mono text-[0.82rem] text-dim">
              GET /api/health/db
            </code>{" "}
            dit laquelle des variables <code className="font-mono">DB_*</code>{" "}
            est en cause et vers quel hôte l&apos;application compose.
          </p>
        </div>
      </AdminShell>
    );
  }

  const rows: OrderRow[] = page.orders.map((order) => ({
    reference: order.reference,
    // Formatage côté serveur : voir le commentaire de `OrderRow`.
    receivedAt: formatParisDateTime(order.receivedAt),
    name: `${order.firstName} ${order.lastName}`.trim(),
    email: order.email,
    quantity: order.quantity ?? "—",
    amount: formatAmount(order.amountTotal, order.currency),
    plan: PLAN_LABELS[order.plan] ?? order.plan,
    status: order.status,
  }));

  return (
    <AdminShell
      title="Commandes"
      subtitle={
        <>
          Traitement des commandes. Chiffre d&apos;affaires, remboursements et
          exports comptables restent{" "}
          <a
            href="https://dashboard.stripe.com/payments"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent"
          >
            dans Stripe
            <ExternalLink className="h-3 w-3" strokeWidth={2} />
          </a>
          , qui les fait mieux.
        </>
      }
      actions={
        /*
          L'export porte la chaîne de requête courante : il rend exactement
          les lignes affichées, filtres et tri compris. `download` demande
          l'enregistrement plutôt que l'affichage, quand bien même un
          navigateur déciderait d'ouvrir le CSV.
        */
        <a
          href={`/admin/export${toQueryString(filters)}`}
          download
          className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.14em] text-dim uppercase transition-colors duration-300 hover:border-accent/40 hover:text-accent"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
          Export CSV
        </a>
      }
    >
      {/*
        Compteurs par statut, cliquables.

        Ce sont des filtres, pas un tableau de bord : ils répondent à « il me
        reste combien de commandes à traiter ? », qui est la première question
        qu'on se pose en ouvrant cette page.
      */}
      <div className="mb-5 flex flex-wrap gap-2.5">
        {ORDER_STATUSES.map((status) => {
          const active = filters.status === status;

          return (
            <Link
              key={status}
              href={`/admin${toQueryString(filters, {
                // Recliquer sur le statut actif le retire : le raccourci sert
                // dans les deux sens.
                status: active ? null : status,
                page: 1,
              })}`}
              aria-current={active ? "true" : undefined}
              className={`inline-flex items-baseline gap-2 rounded-full border px-4 py-2 font-mono text-[0.68rem] tracking-[0.12em] uppercase transition-colors duration-300 ${
                active
                  ? "border-accent/45 bg-accent-soft text-accent"
                  : "border-line-strong text-dim hover:border-accent/30 hover:text-ink"
              }`}
            >
              {ORDER_STATUS_LABELS[status]}
              <span className="text-[0.78rem] tracking-normal">
                {counts[status]}
              </span>
            </Link>
          );
        })}
      </div>

      <OrdersFilters filters={filters} total={page.total} />

      <div className="mt-5">
        <OrdersTable rows={rows} filters={filters} />
      </div>

      <Pagination
        filters={filters}
        page={page.page}
        pageCount={page.pageCount}
        total={page.total}
        perPage={page.perPage}
      />
    </AdminShell>
  );
}
