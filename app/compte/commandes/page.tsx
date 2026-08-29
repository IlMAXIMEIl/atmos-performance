import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, PackageOpen } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatNumber } from "@/lib/format";
import { espaceClientConfigure } from "@/lib/supabase/env";
import { creerClient, clientConnecte } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mes commandes — ATMOS",
  description: "Vos commandes et leur suivi.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Ce que la fenêtre `mes_commandes()` de la migration 0038 renvoie.
 *
 * Le rattachement se fait par l'email vérifié du compte — celui que Stripe a
 * enregistré à l'achat. Aucun écran « associez votre commande » : si les
 * adresses concordent, la commande est là.
 */
type Commande = {
  reference: string;
  plan: string;
  payment_status: string;
  statut: "recue" | "en_fabrication" | "expediee" | "annulee";
  amount_total: number;
  currency: string;
  received_at: string;
  tracking_number: string;
  quantity: number | null;
  livemode: boolean;
};

/** Les statuts, dits comme on les dirait à un client — pas comme en base. */
const STATUTS: Record<Commande["statut"], { label: string; classe: string }> = {
  recue: {
    label: "Reçue",
    classe: "border-line text-dim",
  },
  en_fabrication: {
    label: "En fabrication",
    classe: "border-accent/40 text-accent",
  },
  expediee: {
    label: "Expédiée",
    classe: "border-emerald-300/40 text-emerald-200",
  },
  annulee: {
    label: "Annulée",
    classe: "border-line text-dimmer",
  },
};

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function dateLongue(iso: string): string {
  const date = new Date(iso);
  return `${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
}

/** 219 000 centimes → « 2 190 € ». Les montants Stripe sont en centimes. */
function montant(centimes: number): string {
  return `${formatNumber(Math.round(centimes / 100))} €`;
}

export default async function CommandesPage() {
  if (!espaceClientConfigure()) redirect("/");

  const utilisateur = await clientConnecte();
  if (!utilisateur) redirect("/compte/connexion");

  const supabase = await creerClient();
  const { data } = await supabase.rpc("mes_commandes");
  const commandes = (data as Commande[] | null) ?? [];

  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.12),transparent_70%)]"
      />

      <SiteHeader maxWidth="max-w-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-10 pb-24">
        <Link
          href="/compte"
          className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-dim transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Mon protocole
        </Link>

        <span className="font-mono mt-10 block text-[0.66rem] tracking-[0.26em] text-accent uppercase">
          Mes commandes
        </span>

        <h1 className="mt-4 text-[1.9rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
          {commandes.length === 0
            ? "Aucune commande pour l'instant."
            : "Vos commandes."}
        </h1>

        {commandes.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-line px-6 py-10 text-center">
            <PackageOpen
              className="mx-auto h-6 w-6 text-dimmer"
              strokeWidth={1.4}
            />
            <p className="mt-4 text-[0.9rem] leading-relaxed font-light text-dim text-pretty">
              Les commandes passées avec l&apos;adresse{" "}
              <span className="text-ink">{utilisateur.email}</span>{" "}
              apparaîtront ici automatiquement.
            </p>
            <Link
              href="/#offres"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-line-strong bg-white/[0.03] px-6 py-3 text-[0.85rem] font-medium text-ink transition-colors hover:bg-white/[0.07]"
            >
              Découvrir les offres
            </Link>
          </div>
        ) : (
          <ul className="mt-10 flex flex-col gap-4">
            {commandes.map((commande) => {
              const statut = STATUTS[commande.statut] ?? STATUTS.recue;
              return (
                <li
                  key={commande.reference}
                  className="rounded-3xl border border-line bg-white/[0.02] p-6 sm:p-7"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <span className="text-[1.05rem] font-medium tracking-tight text-ink">
                      ATMOS ONE
                      {commande.quantity !== null && commande.quantity > 1
                        ? ` × ${commande.quantity}`
                        : ""}
                      {commande.plan === "location" && (
                        <span className="ml-2 text-[0.8rem] font-light text-dim">
                          location
                        </span>
                      )}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-[0.7rem] font-medium tracking-[0.08em] uppercase ${statut.classe}`}
                    >
                      {statut.label}
                    </span>
                  </div>

                  <dl className="mt-5 flex flex-col gap-2 border-t border-line pt-5 text-[0.85rem] font-light">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-dimmer">Passée le</dt>
                      <dd className="text-dim">{dateLongue(commande.received_at)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-dimmer">Montant</dt>
                      <dd className="text-dim tabular-nums">
                        {montant(commande.amount_total)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-dimmer">Référence</dt>
                      <dd className="font-mono text-[0.75rem] text-dim">
                        {commande.reference}
                      </dd>
                    </div>
                    {commande.tracking_number !== "" && (
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-dimmer">Suivi colis</dt>
                        <dd className="font-mono text-[0.75rem] text-accent">
                          {commande.tracking_number}
                        </dd>
                      </div>
                    )}
                    {!commande.livemode && (
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-dimmer">Mode</dt>
                        <dd className="text-amber-200/90">Paiement de test</dd>
                      </div>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 text-[0.78rem] leading-relaxed font-light text-dimmer text-pretty">
          Une question sur une commande ? Écrivez-nous en indiquant sa
          référence — elle est faite pour ça.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
