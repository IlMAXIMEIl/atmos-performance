import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { OrderDetailsForm } from "@/components/admin/order-details-form";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/admin-session";
import { Eyebrow } from "@/components/ui/eyebrow";
import { formatAmount, formatDay, formatParisDateTime } from "@/lib/format";
import {
  getOrder,
  listOrderEvents,
  ORDER_STATUS_LABELS,
  PLAN_LABELS,
} from "@/lib/orders";

/**
 * Titre d'onglet, tiré de la seule référence.
 *
 * Pas de lecture en base ici : `generateMetadata` s'exécute en parallèle de
 * la page, et y appeler `getOrder` doublerait la requête pour n'écrire qu'un
 * titre. La référence suffit à distinguer deux onglets ouverts côte à côte,
 * ce qui est tout ce qu'on lui demande.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  return { title: `${decodeURIComponent(reference)} — Administration` };
}

/**
 * Lien vers le paiement dans Stripe.
 *
 * **Deux formes de référence, deux écrans.** Le tunnel intégré enregistre une
 * intention (`pi_…`), qui vit sous `/payments`. La location passe encore par
 * une session Checkout (`cs_…`), et cet identifiant-là renvoie une page
 * introuvable sous `/payments` : il faut `/checkout/sessions`. Envoyer les
 * deux au même endroit donnerait un lien mort une commande sur deux.
 */
function stripeUrl(reference: string): string {
  const base = "https://dashboard.stripe.com";
  return reference.startsWith("cs_")
    ? `${base}/checkout/sessions/${reference}`
    : `${base}/payments/${reference}`;
}

/** Une ligne « libellé / valeur » de la fiche. */
function Field({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="border-b border-line/60 py-3 last:border-0">
      <dt className="font-mono text-[0.62rem] tracking-[0.16em] text-dimmer uppercase">
        {label}
      </dt>
      <dd
        className={`mt-1.5 text-[0.9rem] leading-relaxed break-words text-ink ${
          mono ? "font-mono text-[0.8rem]" : ""
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  await requireAdmin();

  const { reference } = await params;
  const order = await getOrder(decodeURIComponent(reference));

  // Référence inconnue : une vraie 404, et non une page vide. Une commande
  // supprimée ou une URL mal recopiée doivent se distinguer d'une commande
  // sans coordonnées.
  if (!order) notFound();

  const events = await listOrderEvents(order.id);
  const name = `${order.firstName} ${order.lastName}`.trim();

  const panel = "rounded-2xl border border-line bg-deep/60 p-5";

  return (
    <AdminShell
      title={name || order.email || "Commande"}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusBadge status={order.status} />
          <span className="font-mono text-[0.76rem] text-dimmer">
            {formatParisDateTime(order.receivedAt)}
          </span>
        </span>
      }
      actions={
        <>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.14em] text-dim uppercase transition-colors duration-300 hover:border-accent/40 hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
            Liste
          </Link>

          {/*
            Le lien qui évite d'ouvrir Stripe à la main et d'y chercher le
            paiement : rembourser ou vérifier un règlement se fait de là, en
            un clic, sans quitter le poste.
          */}
          <a
            href={stripeUrl(order.reference)}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.14em] text-void uppercase transition-transform duration-300 hover:-translate-y-0.5"
          >
            Voir dans Stripe
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <section aria-labelledby="client" className={panel}>
          <Eyebrow as="h2" id="client">
            Client
          </Eyebrow>

          <dl className="mt-4">
            <Field label="Nom">{name || "—"}</Field>
            <Field label="Email">
              <a
                href={`mailto:${order.email}`}
                className="text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent"
              >
                {order.email || "—"}
              </a>
            </Field>
            <Field label="Téléphone">
              {order.phone ? (
                <a
                  href={`tel:${order.phone.replace(/\s/g, "")}`}
                  className="text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent"
                >
                  {order.phone}
                </a>
              ) : (
                "—"
              )}
            </Field>
            {/* `whitespace-pre-line` : l'adresse arrive telle que le client
                l'a saisie, retours à la ligne compris. */}
            <Field label="Adresse">
              <span className="whitespace-pre-line">{order.address || "—"}</span>
            </Field>
            <Field label="Options">{order.options || "aucune"}</Field>
          </dl>
        </section>

        <section aria-labelledby="commande" className={panel}>
          <Eyebrow as="h2" id="commande">
            Commande
          </Eyebrow>

          <dl className="mt-4">
            <Field label="Montant">
              <span className="text-[1.15rem] font-semibold">
                {formatAmount(order.amountTotal, order.currency)}
              </span>
            </Field>
            <Field label="Formule">
              {PLAN_LABELS[order.plan] ?? order.plan}
            </Field>
            {order.quantity && <Field label="Quantité">{order.quantity}</Field>}
            {/*
              Affiché tel quel, sans mise en forme.

              `balanceDue` est recopié d'une métadonnée Stripe par le webhook,
              et **aucun chemin du code ne l'écrit aujourd'hui** : ni
              `app/api/checkout/route.ts` ni `app/api/payment-intent/route.ts`
              ne posent cette clé. Son format n'est donc défini nulle part.
              Le lire comme des centimes serait une convention inventée ici,
              que le premier producteur réel contredirait.
            */}
            {order.balanceDue && (
              <Field label="Solde dû" mono>
                {order.balanceDue}
              </Field>
            )}
            {order.startDate && (
              <Field label="Location">
                {formatDay(order.startDate)}
                {order.endDate ? ` → ${formatDay(order.endDate)}` : ""}
              </Field>
            )}
            <Field label="Paiement">{order.paymentStatus}</Field>
            <Field label="Référence" mono>
              {order.reference}
            </Field>
            {order.eventId && (
              <Field label="Événement Stripe" mono>
                {order.eventId}
              </Field>
            )}
          </dl>
        </section>

        <div className="flex flex-col gap-5 lg:col-span-2 xl:col-span-1">
          <section aria-labelledby="statut" className={panel}>
            <Eyebrow as="h2" id="statut">
              Statut
            </Eyebrow>
            <div className="mt-4">
              <OrderStatusForm
                reference={order.reference}
                status={order.status}
              />
            </div>
          </section>

          <section aria-labelledby="traitement" className={panel}>
            <Eyebrow as="h2" id="traitement">
              Traitement
            </Eyebrow>
            <div className="mt-4">
              <OrderDetailsForm
                reference={order.reference}
                trackingNumber={order.trackingNumber}
                internalNote={order.internalNote}
              />
            </div>
          </section>

          <section aria-labelledby="journal" className={panel}>
            <Eyebrow as="h2" id="journal">
              Journal
            </Eyebrow>

            {events.length === 0 ? (
              <p className="mt-4 text-[0.85rem] leading-relaxed text-dim">
                Rien depuis l&apos;enregistrement de la commande. Chaque changement
                de statut, chaque note et chaque numéro de suivi laissera une
                ligne ici.
              </p>
            ) : (
              <ol className="mt-4 flex flex-col">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-col gap-1.5 border-b border-line/60 py-3 last:border-0"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <time
                        // L'attribut porte l'instant exact ; le texte affiche
                        // l'heure de Paris, formatée sur le serveur.
                        dateTime={event.createdAt}
                        className="font-mono text-[0.72rem] text-dimmer"
                      >
                        {formatParisDateTime(event.createdAt)}
                      </time>
                      {event.status && (
                        <span className="text-[0.85rem] text-ink">
                          → {ORDER_STATUS_LABELS[event.status]}
                        </span>
                      )}
                    </div>
                    {event.note && (
                      <p className="text-[0.84rem] leading-relaxed whitespace-pre-line text-dim">
                        {event.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
