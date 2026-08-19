"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  CalendarClock,
  Check,
  CreditCard,
  Infinity as InfinityIcon,
  KeyRound,
  LifeBuoy,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import Link from "next/link";

import { WaitlistForm } from "@/components/waitlist-form";
import { WaitlistModal } from "@/components/waitlist-modal";
import {
  BATCH_NAME,
  BATCH_SCARCITY,
  BATCH_UNITS,
  INCLUDED_ITEMS,
  INSTALLMENTS_NOTE,
  LEASING_DEPOSIT_NOTE,
  LEASING_OPEN,
  ORDERS_OPEN,
  PREORDER_STEPS,
  WAITLIST_CTA,
} from "@/lib/offering";
import { EASE, container, rise } from "@/lib/motion";

/**
 * Le tunnel de commande est chargé à la demande.
 *
 * Il ne s'ouvre que si `ORDERS_OPEN` vaut `true`, mais un import statique le
 * ferait tout de même descendre dans le bundle de la page d'accueil : le
 * bundler ne peut pas éliminer la branche, l'import étant résolu avant que la
 * constante ne soit connue. En `dynamic`, son morceau n'est téléchargé que
 * lorsqu'il est réellement rendu.
 */
const ReservationModal = dynamic(() =>
  import("@/components/reservation-modal").then((mod) => mod.ReservationModal),
);

type PlanId = "achat" | "leasing";

type Plan = {
  id: PlanId;
  label: string;
  badge: string;
  price: string;
  /** Placé sous le prix : unité, durée d'engagement, mentions. */
  terms: string;
  pitch: string;
  highlights: { icon: LucideIcon; label: string; detail: string }[];
  cta: string;
};

const PLANS: Plan[] = [
  {
    id: "achat",
    label: "Achat",
    badge: `Édition de lancement · ${BATCH_NAME}`,
    price: "1 890 €",
    terms: "TTC · comptant ou paiement fractionné",
    pitch:
      "L'appareil vous appartient dès la livraison. Aucune échéance, aucune condition de restitution.",
    highlights: [
      {
        icon: KeyRound,
        label: "Propriété immédiate",
        detail: "Le générateur est à vous, sans durée d'engagement.",
      },
      {
        icon: ShieldCheck,
        label: "Garantie 3 ans",
        detail:
          "Pièces et main-d'œuvre comprises, retour atelier pris en charge.",
      },
      {
        icon: InfinityIcon,
        label: "Mises à jour à vie",
        detail: "Nouveaux protocoles et évolutions logicielles inclus.",
      },
    ],
    cta: ORDERS_OPEN ? "Précommander ATMOS ONE" : WAITLIST_CTA,
  },
  {
    id: "leasing",
    label: "Location",
    badge: LEASING_OPEN ? "1 mois minimum" : "Bientôt disponible",
    price: "350 €",
    terms: "par mois · 39 € d'expédition",
    pitch:
      "Le même appareil, entretenu par nos soins, mois par mois. Vous arrêtez quand vous voulez passé le premier mois.",
    highlights: [
      {
        icon: KeyRound,
        label: "Loyers déduits à l'achat",
        detail:
          "100 % des loyers versés viennent en déduction des 1 890 € si vous décidez d'acheter.",
      },
      {
        icon: Wrench,
        label: "Maintenance incluse",
        detail: "Entretien et pièces d'usure entièrement pris en charge.",
      },
      {
        icon: CalendarClock,
        label: "Mois par mois",
        detail:
          "Une première période de 30 jours, reconduite tant que vous le souhaitez.",
      },
    ],
    cta: "Louer ATMOS ONE",
  },
];

/** Livré quelle que soit la formule retenue. */

/** Le premier élément dépend de la formule ; ces deux-là ne varient pas. */
const ASSURANCES = [
  { icon: Truck, text: "Livraison estimée au premier trimestre 2027" },
  {
    icon: CalendarClock,
    text: `${BATCH_NAME} : ${BATCH_UNITS} unités, puis série suivante`,
  },
];

/**
 * Ce qui se passe après la livraison.
 *
 * Placé au moment de la décision plutôt que dans une page annexe : l'objection
 * « et si ça tombe en panne ? » suit immédiatement le prix.
 *
 * Le périmètre de la garantie est décrit comme une conséquence, jamais comme
 * une condition : la garantie légale de conformité est d'ordre public et ne
 * peut pas être subordonnée à un entretien. Une panne née d'un défaut
 * d'entretien sort du périmètre parce qu'elle n'est pas un défaut de
 * fabrication — pas parce qu'une clause l'exclut. Une clause de ce genre serait
 * réputée non écrite, donc sans effet protecteur.
 */
const AFTER_SALE = [
  {
    icon: ShieldCheck,
    title: "Garantie 2 ans, pièces et main-d'œuvre",
    body: "La garantie légale de conformité couvre tout défaut de fabrication pendant deux ans à compter de la livraison, sans frais, sans franchise et sans formalité d'enregistrement.",
    note: "Restent hors périmètre les pannes qui ne relèvent pas d'un défaut de fabrication : filtres non remplacés aux intervalles indiqués, appareil utilisé en environnement poussiéreux ou humide, choc, immersion, ouverture du boîtier.",
  },
  {
    icon: LifeBuoy,
    title: "Assistance et diagnostic depuis la France",
    body: "Un interlocuteur, pas un formulaire. Le diagnostic se fait à distance dans la majorité des cas, et les pièces de rechange partent de notre stock — sans transiter par un service après-vente à l'étranger.",
    note: null,
  },
  {
    icon: RotateCcw,
    title: "14 jours pour changer d'avis",
    body: "Droit de rétractation légal à compter de la réception, sans motif à donner. Remboursement sous quatorze jours après retour de l'appareil.",
    note: "Les frais de retour par transporteur sont à votre charge. L'appareil doit revenir complet avec ses accessoires — conservez l'emballage d'origine, c'est le seul conditionnement prévu pour ce transport.",
  },
];

/** Partagé par les deux CTA, qui ne diffèrent que par la balise rendue. */
const CTA_CLASS =
  "group relative mt-11 inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 px-8 py-4 text-sm font-semibold tracking-[0.04em] text-[#04070D] shadow-[0_0_36px_-6px_rgba(56,189,248,0.65)] transition-all duration-300 hover:shadow-[0_0_54px_-4px_rgba(56,189,248,0.9)] focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C10] focus-visible:outline-none";

/**
 * Le simulateur d'altitude renvoie vers `/?reserver=achat#offres` avec la
 * configuration du visiteur : la modale d'achat — ou, tant que les commandes
 * sont fermées, celle de la liste prioritaire — s'ouvre alors d'elle-même,
 * plutôt que de le laisser rechercher le bouton.
 *
 * L'URL est un état extérieur à React, d'où `useSyncExternalStore` : un effet
 * appellerait `setState` en cascade, et `useSearchParams` ferait sortir toute
 * la page d'accueil du prérendu — trop cher pour la page la plus référencée du
 * site. Seul l'achat est concerné, la location n'ouvrant qu'après le Batch n°1.
 */
function subscribeToHistory(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function readRequestedPlan() {
  return new URLSearchParams(window.location.search).get("reserver");
}

/** Côté serveur il n'y a pas d'URL à lire : le rendu initial reste fermé. */
function readNothing() {
  return null;
}

const swap = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -12, filter: "blur(6px)" },
  transition: { duration: 0.4, ease: EASE },
};

export function OffersSection() {
  const [planId, setPlanId] = useState<PlanId>("achat");
  const [modalOpen, setModalOpen] = useState(false);
  const [invitationDeclined, setInvitationDeclined] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const plan = PLANS.find((item) => item.id === planId) ?? PLANS[0];

  // Une invitation venue de l'URL ne vaut qu'une fois : refermer la modale ne
  // doit pas la faire réapparaître au rendu suivant.
  const requestedPlan = useSyncExternalStore(
    subscribeToHistory,
    readRequestedPlan,
    readNothing,
  );
  const invited = requestedPlan === "achat" && !invitationDeclined;

  function closeModal() {
    setModalOpen(false);
    setInvitationDeclined(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;

    event.preventDefault();
    const index = PLANS.findIndex((item) => item.id === planId);
    const next = PLANS[(index + step + PLANS.length) % PLANS.length];
    setPlanId(next.id);
    tabRefs.current[next.id]?.focus();
  }

  return (
    <section
      id="offres"
      aria-labelledby="offres-titre"
      className="relative z-20 mx-auto w-full max-w-7xl scroll-mt-24 px-6 py-24 sm:py-32 lg:px-10"
    >
      {/* ── En-tête de section ───────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.span
          variants={rise}
          className="block text-[0.68rem] font-medium tracking-[0.28em] text-cyan-300/70 uppercase"
        >
          Les offres
        </motion.span>

        <motion.h2
          variants={rise}
          id="offres-titre"
          className="mt-5 text-[1.85rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl"
        >
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Une machine.
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
            Deux façons d&apos;y accéder.
          </span>
        </motion.h2>

        <motion.p
          variants={rise}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed font-light text-white/55 text-pretty"
        >
          {`L'édition de lancement ouvre la précommande à l'achat ferme, en série limitée. ${BATCH_SCARCITY}. La location suivra : laissez votre email pour être prévenu de son ouverture.`}
        </motion.p>

        {/* Bascule Achat / Leasing */}
        <motion.div
          variants={rise}
          role="tablist"
          aria-label="Choix de la formule"
          onKeyDown={handleKeyDown}
          className="mx-auto mt-12 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-md"
        >
          {PLANS.map((item) => {
            const isActive = item.id === plan.id;

            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[item.id] = node;
                }}
                type="button"
                role="tab"
                id={`formule-${item.id}`}
                aria-selected={isActive}
                aria-controls={`offre-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setPlanId(item.id)}
                className={`relative rounded-full px-7 py-2.5 text-[0.82rem] font-medium tracking-[0.06em] transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:outline-none ${
                  isActive
                    ? "text-[#04070D]"
                    : "text-white/55 hover:text-white/85"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="formule-active"
                    transition={{ duration: 0.45, ease: EASE }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 shadow-[0_0_28px_-6px_rgba(56,189,248,0.8)]"
                  />
                )}
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </motion.div>
      </motion.div>

      {/* ── Carte de l'offre sélectionnée ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative mt-14 overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.015] backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.16),transparent_70%)]"
        />

        <div
          id={`offre-${plan.id}`}
          role="tabpanel"
          aria-labelledby={`formule-${plan.id}`}
          tabIndex={0}
          className="relative grid gap-12 p-8 focus-visible:outline-none sm:p-12 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:p-14"
        >
          {/* Prix et engagement */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div key={plan.id} {...swap}>
                <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/[0.07] px-3.5 py-1 text-[0.66rem] font-medium tracking-[0.16em] text-cyan-100/90 uppercase">
                  {plan.badge}
                </span>

                <div className="mt-8 flex items-baseline gap-3">
                  <span className="text-5xl font-medium tracking-[-0.04em] text-white sm:text-6xl">
                    {plan.price}
                  </span>
                </div>

                <div className="mt-3 text-[0.8rem] font-light tracking-[0.1em] text-white/45 uppercase">
                  {plan.terms}
                </div>

                {/*
                  Un fait, pas un plaidoyer. Le circuit de distribution
                  n'appelle pas de démonstration : celui qui se demande d'où
                  vient l'écart trouve sa réponse en six mots, les autres ne
                  s'arrêtent pas.
                */}
                <p className="mt-3 text-[0.82rem] font-light text-white/35">
                  Vendu en direct, sans distributeur ni revendeur.
                </p>

                {/*
                  Sous le prix, une mention par formule — jamais les deux. Le
                  fractionnement est réservé à l'achat ; la location se règle
                  comptant et appelle une empreinte bancaire, annoncée ici en
                  retrait plutôt qu'au moment de payer.
                */}
                {plan.id === "achat" ? (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.05] px-4 py-3.5">
                    <CreditCard
                      className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300"
                      strokeWidth={1.5}
                    />
                    <p className="text-[0.82rem] leading-relaxed font-light text-cyan-50/70 text-pretty">
                      {INSTALLMENTS_NOTE}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-[0.78rem] leading-relaxed font-light text-white/35 text-pretty">
                    {LEASING_DEPOSIT_NOTE}
                  </p>
                )}

                <p className="mt-7 max-w-md text-[0.95rem] leading-relaxed font-light text-white/55 text-pretty">
                  {plan.pitch}
                </p>

                <ul className="mt-10 flex flex-col gap-5">
                  {plan.highlights.map(({ icon: Icon, label, detail }) => (
                    <li key={label} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                        <Icon
                          className="h-3.5 w-3.5 text-cyan-300"
                          strokeWidth={1.6}
                        />
                      </span>
                      <div>
                        <div className="text-sm font-medium tracking-tight text-white/90">
                          {label}
                        </div>
                        <div className="mt-1 text-[0.85rem] leading-relaxed font-light text-white/45 text-pretty">
                          {detail}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Contenu de la livraison, identique aux deux formules */}
          <div className="lg:border-l lg:border-white/[0.07] lg:pl-16">
            <div className="text-[0.64rem] font-medium tracking-[0.24em] text-white/40 uppercase">
              Dans les deux cas
            </div>

            <ul className="mt-7 flex flex-col gap-4">
              {INCLUDED_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3.5">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/80"
                    strokeWidth={2}
                  />
                  <span className="text-[0.92rem] leading-relaxed font-light text-white/70 text-pretty">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            {/*
              Au lancement, seul l'achat ferme est ouvert. La location garde sa
              carte mais bascule sur une inscription à la liste d'attente.
            */}
            {plan.id === "leasing" && !LEASING_OPEN ? (
              <WaitlistForm />
            ) : (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className={CTA_CLASS}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
                <span className="relative">{plan.cta}</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            )}

            <p className="mt-5 text-center text-[0.78rem] font-light text-white/35">
              {plan.id === "leasing"
                ? LEASING_OPEN
                  ? "1er mois et expédition réglés en ligne, caution par simple empreinte bancaire."
                  : `La location ouvrira après le ${BATCH_NAME}. Laissez votre email pour être prévenu.`
                : ORDERS_OPEN
                  ? "Paiement sécurisé à la précommande, au comptant ou fractionné."
                  : "Aucun paiement aujourd'hui : vous rejoignez la liste prioritaire, prévenue en premier à l'ouverture."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Réassurance ──────────────────────────────────────────────── */}
      <motion.ul
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="mt-10 grid gap-4 sm:grid-cols-3"
      >
        {[
          {
            icon: Boxes,
            text:
              plan.id === "leasing"
                ? `Ouverture de la location après le ${BATCH_NAME}`
                : BATCH_SCARCITY,
          },
          ...ASSURANCES,
        ].map(({ icon: Icon, text }) => (
          <motion.li
            key={text}
            variants={rise}
            className="flex items-center justify-center gap-3 rounded-2xl border border-white/[0.07] px-5 py-4 text-center"
          >
            <Icon
              className="h-3.5 w-3.5 shrink-0 text-cyan-300/70"
              strokeWidth={1.5}
            />
            <span className="text-[0.8rem] font-light text-white/45 text-pretty">
              {text}
            </span>
          </motion.li>
        ))}
      </motion.ul>

      {/* ── Après l'achat ────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 sm:p-10"
      >
        <motion.div variants={rise} className="max-w-2xl">
          <h3 className="text-[0.66rem] font-medium tracking-[0.24em] text-white/45 uppercase">
            Après l&apos;achat
          </h3>
          <p className="mt-4 text-[1.15rem] leading-snug font-medium tracking-[-0.02em] text-balance text-white sm:text-2xl">
            Ce qui se passe une fois la machine chez vous.
          </p>
        </motion.div>

        <div className="mt-9 grid gap-8 border-t border-white/[0.07] pt-8 md:grid-cols-3 md:gap-10">
          {AFTER_SALE.map(({ icon: Icon, title, body, note }) => (
            <motion.div key={title} variants={rise}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                <Icon className="h-4 w-4 text-cyan-300" strokeWidth={1.6} />
              </span>

              <h4 className="mt-6 text-[0.95rem] leading-snug font-medium tracking-tight text-balance text-white">
                {title}
              </h4>

              <p className="mt-3 text-[0.86rem] leading-relaxed font-light text-white/55 text-pretty">
                {body}
              </p>

              {note && (
                <p className="mt-3 text-[0.78rem] leading-relaxed font-light text-white/35 text-pretty">
                  {note}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={rise}
          className="mt-8 border-t border-white/[0.07] pt-6 text-[0.8rem] leading-relaxed font-light text-white/35 text-pretty"
        >
          Le détail des garanties, des modalités de retour et de la prise en
          charge des frais figure dans nos{" "}
          <Link
            href="/cgv"
            className="text-white/55 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
          >
            conditions générales de vente
          </Link>
          .
        </motion.p>
      </motion.div>

      {/* ── Déroulé de la précommande ────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        aria-labelledby="precommande-titre"
        className="relative mt-8 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-white/[0.02] px-7 py-10 backdrop-blur-md sm:px-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"
        />

        <div className="relative">
          <motion.h3
            variants={rise}
            id="precommande-titre"
            className="text-center text-[0.68rem] font-medium tracking-[0.28em] text-cyan-300/70 uppercase"
          >
            Comment se passe la précommande
          </motion.h3>

          <motion.ol
            variants={container}
            className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
          >
            {PREORDER_STEPS.map((step, index) => (
              <motion.li key={step.title} variants={rise} className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/[0.08] text-[0.8rem] font-medium text-cyan-200">
                  {index + 1}
                </span>

                <div className="mt-4 text-[0.92rem] leading-snug font-medium tracking-tight text-white/90 text-pretty">
                  {step.title}
                </div>

                <p className="mt-2 text-[0.85rem] leading-relaxed font-light text-white/45 text-pretty">
                  {step.detail}
                </p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </motion.div>

      {/* ── Teaser : prochain produit de la gamme ────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative mt-8 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-white/[0.02] px-8 py-9 text-center backdrop-blur-md"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_at_50%_100%,rgba(129,140,248,0.14),transparent_70%)]"
        />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-1 text-[0.6rem] font-medium tracking-[0.24em] text-white/45 uppercase">
            <Sparkles
              className="h-3 w-3 text-indigo-300/80"
              strokeWidth={1.5}
            />
            À venir
          </span>

          <h3 className="mt-5 text-lg font-medium tracking-[0.06em] text-white/85 uppercase sm:text-xl">
            ATMOS Chamber
          </h3>

          <p className="mx-auto mt-3 max-w-md text-[0.88rem] leading-relaxed font-light text-white/40 text-pretty">
            Notre caisson de régénération hyperbare, second appareil de la
            gamme. Un produit distinct du générateur d&apos;altitude.
          </p>
        </div>
      </motion.aside>

      {/*
        Tant que les commandes ne sont pas ouvertes, les boutons d'action
        mènent à la liste prioritaire plutôt qu'au tunnel de paiement : la
        société n'est pas encore immatriculée, rien ne peut être encaissé.
      */}
      {ORDERS_OPEN ? (
        <ReservationModal
          open={modalOpen || invited}
          onClose={closeModal}
          plan={plan.id}
        />
      ) : (
        <WaitlistModal open={modalOpen || invited} onClose={closeModal} />
      )}
    </section>
  );
}
