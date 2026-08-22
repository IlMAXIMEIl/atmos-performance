import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Clock, HelpCircle, Mail } from "lucide-react";
import Stripe from "stripe";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { DROP_NAME } from "@/lib/offering";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Précommande confirmée — ATMOS PERFORMANCE",
  description: "Votre précommande a bien été enregistrée.",
  robots: { index: false },
  // Sans cette ligne, la page hérite du canonique de la racine et se déclare
  // doublon de l'accueil — signal contradictoire avec le `noindex`.
  alternates: { canonical: `${SITE_URL}/reservation/confirmee` },
};

type Search = Record<string, string | string[] | undefined>;

/** Où atterrit un paiement qui n'a pas abouti. */
const RETRY_URL = "/?paiement=echec#offres";

type Outcome = "succeeded" | "pending" | "unknown";

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

/**
 * Vérifie l'état réel du paiement auprès de Stripe.
 *
 * **`redirect_status` présent dans l'URL n'est jamais consulté.** Stripe
 * l'ajoute au retour de Klarna ou PayPal, mais c'est une chaîne dans la barre
 * d'adresse : n'importe qui peut la remplacer par `succeeded` et obtenir une
 * page de remerciement pour un paiement refusé. Seule la réponse de l'API
 * fait foi.
 *
 * Le `client_secret` de l'URL est comparé à celui de l'intention retrouvée.
 * Sans cette liaison, un visiteur qui devine un identifiant `pi_…` verrait
 * l'état du paiement de quelqu'un d'autre.
 */
async function verifyPayment(
  params: Search,
): Promise<{ outcome: Outcome | "failed"; reference: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return { outcome: "unknown", reference: "" };

  const intentId = one(params.payment_intent);
  const clientSecret = one(params.payment_intent_client_secret);
  const sessionId = one(params.session_id);

  if (!intentId && !sessionId) return { outcome: "unknown", reference: "" };

  try {
    const stripe = new Stripe(secretKey);

    // Tunnel intégré : le Payment Element renvoie l'intention.
    if (intentId) {
      const intent = await stripe.paymentIntents.retrieve(intentId);
      if (!clientSecret || intent.client_secret !== clientSecret) {
        return { outcome: "unknown", reference: "" };
      }

      const reference = intent.id;

      switch (intent.status) {
        case "succeeded":
          return { outcome: "succeeded", reference };
        // Klarna et les virements peuvent rester quelques minutes en attente
        // de confirmation : ce n'est ni un succès ni un échec.
        case "processing":
        case "requires_action":
        case "requires_confirmation":
          return { outcome: "pending", reference };
        case "requires_payment_method":
        case "canceled":
          return { outcome: "failed", reference };
        default:
          return { outcome: "unknown", reference: "" };
      }
    }

    // Tunnel hébergé : la location y reste, son empreinte de caution
    // exigeant une session Checkout.
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      return { outcome: "succeeded", reference: session.id };
    }
    if (session.status === "expired") {
      return { outcome: "failed", reference: session.id };
    }
    return {
      outcome: session.payment_status === "unpaid" ? "failed" : "pending",
      reference: session.id,
    };
  } catch (error) {
    // Identifiant inconnu, clé refusée, Stripe injoignable : on ne remercie
    // pas, mais on n'accuse pas non plus d'échec — le paiement peut très bien
    // être passé.
    console.error("Vérification du paiement impossible", error);
    return { outcome: "unknown", reference: "" };
  }
}

export default async function ReservationConfirmeePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { outcome, reference } = await verifyPayment(await searchParams);

  // Échec avéré : retour au tunnel plutôt qu'une page qui affirme le
  // contraire de ce qui s'est passé.
  if (outcome === "failed") redirect(RETRY_URL);

  const view = VIEWS[outcome];

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-void text-ink">
      {/* Même halo que le pied du hero : la page appartient au site, elle
          n'est pas une sortie de secours posée à côté. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_50%_-10%,rgba(59,158,255,0.16),transparent_65%)]"
      />

      <SiteHeader maxWidth="max-w-3xl" />

      <main className="relative z-20 mx-auto w-full max-w-3xl px-6 pt-10 pb-24 lg:px-10">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full border ${view.badge}`}
        >
          <view.icon className="h-5 w-5" strokeWidth={1.8} />
        </span>

        <Eyebrow className="mt-8">{view.eyebrow}</Eyebrow>

        <h1 className="mt-6 text-[clamp(2.1rem,5vw,3.4rem)] leading-[1.03] font-semibold tracking-[-0.035em] text-balance">
          <span className="text-ink">{view.title}</span>{" "}
          <span className="text-accent">{view.titleAccent}</span>
        </h1>

        <p className="mt-7 max-w-[38em] leading-[1.7] text-dim text-pretty">
          {view.body}
        </p>

        {/* Référence du paiement : c'est ce qu'on demande au client quand il
            écrit au support, et la seule chose qu'il n'a pas sous la main
            s'il ne l'a pas notée. */}
        {reference && (
          <p className="mt-8 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-deep px-4 py-3 font-mono text-[0.72rem] tracking-[0.06em] text-dimmer">
            <span className="tracking-[0.16em] uppercase">Référence</span>
            <span className="text-ink">{reference}</span>
          </p>
        )}

        {view.steps && (
          <section aria-labelledby="suite-titre" className="mt-14">
            <Eyebrow as="h2" id="suite-titre">
              La suite
            </Eyebrow>

            <ol className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-3">
              {view.steps.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-void font-mono text-[0.72rem] text-accent">
                    {index + 1}
                  </span>
                  <h3 className="text-[0.98rem] leading-snug font-semibold tracking-[-0.01em] text-ink">
                    {step.title}
                  </h3>
                  <p className="text-[0.88rem] leading-relaxed text-dim text-pretty">
                    {step.detail}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-10 sm:flex-row">
          <Link
            href={view.primary.href}
            className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            {view.primary.label}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={1.8}
            />
          </Link>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center justify-center gap-2.5 rounded-full border border-line-strong px-7 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-accent hover:text-accent"
          >
            <Mail className="h-4 w-4" strokeWidth={1.8} />
            Nous écrire
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * Les trois états affichables. `failed` n'y figure pas : il redirige.
 *
 * `unknown` est délibérément prudent. Il couvre l'arrivée sur la page sans
 * référence de paiement — un lien partagé, un signet — et l'indisponibilité de
 * Stripe. Dans les deux cas, affirmer que l'unité est réservée serait une
 * promesse qu'on ne peut pas tenir.
 */
const VIEWS: Record<
  Outcome,
  {
    icon: typeof Check;
    badge: string;
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    steps?: { title: string; detail: string }[];
    primary: { label: string; href: string };
  }
> = {
  succeeded: {
    icon: Check,
    badge:
      "border-accent/40 bg-accent/10 text-accent shadow-[0_0_40px_-10px_var(--accent)]",
    eyebrow: "Précommande confirmée",
    title: "Votre unité",
    titleAccent: "est réservée.",
    body: `Votre précommande du ${DROP_NAME} est enregistrée. Un récapitulatif part par email dans les prochaines minutes — c'est lui qui fait foi.`,
    steps: [
      {
        title: "Récapitulatif par email",
        detail:
          "Montant, coordonnées et référence de paiement, dans les minutes qui suivent.",
      },
      {
        title: "Fabrication dans la série",
        detail: `Votre unité est réservée dans le ${DROP_NAME}, puis produite avec le reste de la série.`,
      },
      {
        title: "Mise en service",
        detail:
          "Nous revenons vers vous pour caler la livraison et le premier réglage de l'appareil.",
      },
    ],
    primary: { label: "Retour à l'accueil", href: "/" },
  },

  pending: {
    icon: Clock,
    badge: "border-warm/40 bg-warm/10 text-warm",
    eyebrow: "Paiement en cours",
    title: "Votre paiement",
    titleAccent: "est en cours de validation.",
    body: "Votre moyen de paiement demande quelques instants de plus. Vous recevrez un email dès que la confirmation nous parvient — inutile de payer une seconde fois. Cette page peut être rechargée dans quelques minutes.",
    primary: { label: "Retour à l'accueil", href: "/" },
  },

  unknown: {
    icon: HelpCircle,
    badge: "border-line-strong bg-white/[0.03] text-dim",
    eyebrow: "Référence introuvable",
    title: "Nous n'avons pas",
    titleAccent: "retrouvé ce paiement.",
    body: "Aucune référence valide n'accompagne cette page — un lien partagé, un signet, ou une adresse tronquée. Si vous venez de régler, votre email de confirmation fait foi : il arrive dans les minutes qui suivent. En cas de doute, écrivez-nous plutôt que de recommencer un paiement.",
    primary: { label: "Voir les offres", href: "/#offres" },
  },
};
