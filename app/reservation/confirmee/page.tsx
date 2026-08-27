import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Clock, HelpCircle, Mail } from "lucide-react";

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
 * Demande le verdict à `confirm-payment`, dans Supabase.
 *
 * ## Cette page ne parle plus à Stripe, et n'écrit plus rien
 *
 * Elle interrogeait l'API de Stripe, vérifiait le `client_secret`, puis
 * enregistrait la commande en base. Tout cela vit désormais dans une Edge
 * Function : la vitrine transmet les paramètres bruts de son URL de retour
 * et reçoit un verdict, sans détenir la moindre clé Supabase.
 *
 * Ce qui n'a pas changé, et qui compte : c'est toujours le **second chemin
 * d'écriture**, indépendant du webhook. Le webhook seul ne suffit pas — mal
 * configuré, Stripe ne livre rien du tout, et la commande est payée sans
 * exister nulle part. La fonction fait converger les deux par idempotence.
 *
 * `redirect_status`, que Stripe ajoute dans l'URL au retour de Klarna ou
 * PayPal, n'est toujours pas consulté : c'est une chaîne dans la barre
 * d'adresse, remplaçable par n'importe qui. La fonction revérifie auprès de
 * Stripe, et c'est sa réponse qui fait foi.
 *
 * ## Un échec réseau n'accuse jamais d'échec de paiement
 *
 * Fonction injoignable, secret mal configuré, délai dépassé : on renvoie
 * `unknown`. La page dit alors la seule chose vraie — nous n'avons pas
 * retrouvé ce paiement — plutôt que de renvoyer vers un nouveau règlement
 * un client qui a déjà payé.
 */
async function verifyPayment(
  params: Search,
): Promise<{ outcome: Outcome | "failed"; reference: string }> {
  const url = process.env.CONFIRM_FUNCTION_URL;
  const secret = process.env.CONFIRM_SHARED_SECRET;

  if (!url || !secret) {
    console.error(
      "CONFIRM_FUNCTION_URL ou CONFIRM_SHARED_SECRET absent : voir .env.example",
    );
    return { outcome: "unknown", reference: "" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-confirm-secret": secret,
      },
      body: JSON.stringify({
        payment_intent: one(params.payment_intent),
        client_secret: one(params.payment_intent_client_secret),
        session_id: one(params.session_id),
      }),
      // Le client attend devant sa page : mieux vaut un « nous n'avons pas
      // retrouvé ce paiement » au bout de huit secondes qu'un écran blanc.
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`confirm-payment a répondu ${response.status}`);
      return { outcome: "unknown", reference: "" };
    }

    const body = (await response.json()) as {
      outcome?: string;
      reference?: string;
    };

    // Le verdict vient d'un service distant : on ne le recopie pas les yeux
    // fermés dans un type qui pilote l'affichage et une redirection.
    const outcome = body.outcome;
    if (
      outcome !== "succeeded" &&
      outcome !== "pending" &&
      outcome !== "failed" &&
      outcome !== "unknown"
    ) {
      console.error(`Verdict inattendu de confirm-payment : ${outcome}`);
      return { outcome: "unknown", reference: "" };
    }

    return { outcome, reference: body.reference ?? "" };
  } catch (error) {
    console.error("confirm-payment injoignable", error);
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

        {/*
          L'invitation à l'espace client vient après le paiement, jamais
          avant : le tunnel reste sans compte, c'est un principe du plan. Le
          rattachement est automatique — la fenêtre `mes_commandes` matche
          l'email vérifié du compte avec celui que Stripe vient
          d'enregistrer — donc aucune promesse hasardeuse ici : se connecter
          suffit.
        */}
        <aside className="mt-14 rounded-2xl border border-accent/30 bg-accent/[0.05] p-6 sm:p-7">
          <Eyebrow as="h2">Votre espace</Eyebrow>
          <p className="mt-4 max-w-[36em] text-[0.92rem] leading-relaxed text-dim text-pretty">
            {
              "Suivez votre commande et, dès réception de l'appareil, vos nuits d'exposition : connectez-vous avec l'adresse email de votre commande — un code à six chiffres, pas de mot de passe."
            }
          </p>
          <Link
            href="/compte/connexion"
            className="group mt-5 inline-flex items-center gap-2.5 text-[0.9rem] font-semibold text-accent"
          >
            Activer mon espace
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={1.8}
            />
          </Link>
        </aside>

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
