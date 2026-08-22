import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, Clock, HelpCircle } from "lucide-react";
import Stripe from "stripe";

import { DROP_NAME } from "@/lib/offering";
import { SITE_URL } from "@/lib/site";

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

type Outcome = "succeeded" | "pending" | "failed" | "unknown";

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
async function verifyPayment(params: Search): Promise<Outcome> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return "unknown";

  const intentId = one(params.payment_intent);
  const clientSecret = one(params.payment_intent_client_secret);
  const sessionId = one(params.session_id);

  if (!intentId && !sessionId) return "unknown";

  try {
    const stripe = new Stripe(secretKey);

    // Tunnel intégré : le Payment Element renvoie l'intention.
    if (intentId) {
      const intent = await stripe.paymentIntents.retrieve(intentId);
      if (!clientSecret || intent.client_secret !== clientSecret) {
        return "unknown";
      }

      switch (intent.status) {
        case "succeeded":
          return "succeeded";
        // Klarna et les virements peuvent rester quelques minutes en attente
        // de confirmation : ce n'est ni un succès ni un échec.
        case "processing":
        case "requires_action":
        case "requires_confirmation":
          return "pending";
        case "requires_payment_method":
        case "canceled":
          return "failed";
        default:
          return "unknown";
      }
    }

    // Tunnel hébergé : la location y reste, son empreinte de caution
    // exigeant une session Checkout.
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") return "succeeded";
    if (session.status === "expired") return "failed";
    return session.payment_status === "unpaid" ? "failed" : "pending";
  } catch (error) {
    // Identifiant inconnu, clé refusée, Stripe injoignable : on ne remercie
    // pas, mais on n'accuse pas non plus d'échec — le paiement peut très bien
    // être passé.
    console.error("Vérification du paiement impossible", error);
    return "unknown";
  }
}

export default async function ReservationConfirmeePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const outcome = await verifyPayment(await searchParams);

  // Échec avéré : retour au tunnel plutôt qu'une page qui affirme le
  // contraire de ce qui s'est passé.
  if (outcome === "failed") redirect(RETRY_URL);

  const view = VIEWS[outcome];

  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.14),transparent_70%)]"
      />

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-28 text-center sm:py-36 lg:px-10">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full border ${view.badge}`}
        >
          <view.icon className="h-6 w-6" strokeWidth={2} />
        </span>

        <h1 className="mt-9 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance text-ink sm:text-4xl">
          {view.title}
        </h1>

        <p className="mt-6 max-w-lg text-base leading-relaxed font-light text-dim text-pretty">
          {view.body}
        </p>

        {view.note && (
          <p className="mt-4 text-[0.82rem] font-light text-dimmer">
            {view.note}
          </p>
        )}

        <Link
          href="/"
          className="group mt-12 inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-ink backdrop-blur-md transition-all duration-300 hover:border-accent/40 hover:bg-white/[0.07]"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour à l&apos;accueil
        </Link>
      </main>
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
  Exclude<Outcome, "failed">,
  {
    icon: typeof Check;
    badge: string;
    title: string;
    body: string;
    note?: string;
  }
> = {
  succeeded: {
    icon: Check,
    badge:
      "border-accent/40 bg-accent/10 text-accent shadow-[0_0_40px_-8px_var(--accent)]",
    title: "Votre unité est réservée.",
    body: `Votre précommande du ${DROP_NAME} a bien été enregistrée. Vous recevez un récapitulatif par email dans les prochaines minutes. Notre équipe revient vers vous pour caler la date de mise en service.`,
    note: "Votre unité est réservée dans la série de lancement, puis fabriquée et expédiée directement.",
  },
  pending: {
    icon: Clock,
    badge: "border-warm/40 bg-warm/10 text-warm",
    title: "Paiement en cours de validation.",
    body: "Votre moyen de paiement demande quelques instants supplémentaires. Vous recevrez un email dès que la confirmation nous parvient — inutile de payer une seconde fois.",
    note: "Cette page peut être rechargée dans quelques minutes pour connaître l'état.",
  },
  unknown: {
    icon: HelpCircle,
    badge: "border-line-strong bg-white/[0.03] text-dim",
    title: "Nous n'avons pas retrouvé ce paiement.",
    body: "Aucune référence de paiement valide n'accompagne cette page. Si vous venez de régler, votre email de confirmation fait foi : il arrive dans les minutes qui suivent.",
    note: "En cas de doute, écrivez-nous plutôt que de recommencer un paiement.",
  },
};
