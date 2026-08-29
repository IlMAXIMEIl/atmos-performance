"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { Suspense } from "react";
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
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import Link from "next/link";

import { WaitlistForm } from "@/components/waitlist-form";
import { WaitlistModal } from "@/components/waitlist-modal";
import {
  DROP_NAME,
  DROP_SCARCITY,
  DROP_UNITS,
  INCLUDED_ITEMS,
  INSTALLMENTS_NOTE,
  LEASING_DEPOSIT_NOTE,
  LEASING_MONTHLY_EUR,
  LEASING_OPEN,
  LEASING_SHIPPING_EUR,
  ORDERS_OPEN,
  PURCHASE_PRICE_EUR,
  REFERENCE_PRICE_EUR,
  WAITLIST_CTA,
  formatEuros,
} from "@/lib/offering";
import { PaymentFailedNotice } from "@/components/offers/payment-failed-notice";
import { PreorderSteps } from "@/components/offers/preorder-steps";
import { LeadCapture } from "@/components/waitlist/lead-capture";
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
    badge: `Tarif de première série · ${DROP_NAME}`,
    price: formatEuros(PURCHASE_PRICE_EUR),
    terms: `TTC · comptant ou fractionné · prix de référence ${formatEuros(REFERENCE_PRICE_EUR)} dès la série 2`,
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
        // Deux ans, comme la garantie légale de conformité — la seule que nous
        // devions à ce jour. Toute durée supérieure serait une garantie
        // commerciale : un engagement contractuel distinct, à décrire dans les
        // CGV avant de l'annoncer ici.
        label: "Garantie 2 ans",
        detail:
          "Pièces, main-d'œuvre et frais de renvoi pris en charge sur tout défaut de fabrication.",
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
    price: formatEuros(LEASING_MONTHLY_EUR),
    terms: `par mois · ${formatEuros(LEASING_SHIPPING_EUR)} d'expédition`,
    pitch:
      "Le même appareil, entretenu par nos soins, mois par mois. Vous arrêtez quand vous voulez passé le premier mois.",
    highlights: [
      {
        icon: KeyRound,
        label: "Loyers déduits à l'achat",
        detail: `100 % des loyers versés viennent en déduction du prix du kit si vous décidez d'acheter — dans la limite de ${formatEuros(REFERENCE_PRICE_EUR)}.`,
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
    text: `${DROP_NAME} : ${DROP_UNITS} unités, puis série suivante`,
  },
];

/**
 * Ce qui se passe après la livraison.
 *
 * Placé au moment de la décision plutôt que dans une page annexe : l'objection
 * « et si ça tombe en panne ? » suit immédiatement le prix. Tenu en trois
 * lignes denses — il rassure, il ne raconte pas ; le détail vit dans les CGV.
 *
 * Le périmètre de la garantie est décrit comme une conséquence, jamais comme
 * une condition : la garantie légale de conformité est d'ordre public et ne
 * peut pas être subordonnée à un entretien. Une panne née d'un défaut
 * d'entretien sort du périmètre parce qu'elle n'est pas un défaut de
 * fabrication — pas parce qu'une clause l'exclut.
 */
const AFTER_SALE = [
  {
    icon: ShieldCheck,
    title: "Garantie 2 ans",
    body: "Défauts de fabrication : pièces, main-d'œuvre et frais de renvoi pris en charge.",
  },
  {
    icon: LifeBuoy,
    title: "SAV depuis la France",
    body: "Diagnostic à distance, pièces expédiées de notre stock.",
  },
  {
    icon: RotateCcw,
    title: "14 jours pour changer d'avis",
    body: "Rétractation sans motif ; frais de retour à votre charge.",
  },
];

/** Partagé par les deux CTA, qui ne diffèrent que par la balise rendue. */
const CTA_CLASS =
  "group relative mt-11 inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-accent px-8 py-4 text-sm font-semibold tracking-[0.04em] text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_-12px_var(--accent)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-void focus-visible:outline-none";

/**
 * Le simulateur d'altitude renvoie vers `/?reserver=achat#offres` avec la
 * configuration du visiteur : la modale d'achat — ou, tant que les commandes
 * sont fermées, celle de la liste prioritaire — s'ouvre alors d'elle-même,
 * plutôt que de le laisser rechercher le bouton.
 *
 * L'URL est un état extérieur à React, d'où `useSyncExternalStore` : un effet
 * appellerait `setState` en cascade, et `useSearchParams` ferait sortir toute
 * la page d'accueil du prérendu — trop cher pour la page la plus référencée du
 * site. Seul l'achat est concerné, la location n'ouvrant qu'après le Drop n°1.
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
      {/* `useSearchParams` force le rendu dynamique de tout ce qui l'entoure :
          la frontière `Suspense` cantonne cet effet à ce seul message. */}
      <Suspense fallback={null}>
        <PaymentFailedNotice />
      </Suspense>

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
          className="font-mono block text-[0.68rem] tracking-[0.28em] text-accent uppercase"
        >
          Les offres
        </motion.span>

        <motion.h2
          variants={rise}
          id="offres-titre"
          className="mt-5 text-[1.85rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl"
        >
          <span className="text-ink">
            Une machine.
          </span>{" "}
          <span className="text-accent">
            Deux façons d&apos;y accéder.
          </span>
        </motion.h2>

        <motion.p
          variants={rise}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed font-light text-dim text-pretty"
        >
          {`L'édition de lancement ouvre la précommande à l'achat ferme, en série limitée. ${DROP_SCARCITY}. La location suivra : laissez votre email pour être prévenu de son ouverture.`}
        </motion.p>

        {/* Bascule Achat / Leasing */}
        <motion.div
          variants={rise}
          role="tablist"
          aria-label="Choix de la formule"
          onKeyDown={handleKeyDown}
          className="mx-auto mt-12 inline-flex rounded-full border border-line bg-white/[0.03] p-1.5 backdrop-blur-md"
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
                className={`relative rounded-full px-7 py-2.5 text-[0.82rem] font-medium tracking-[0.06em] transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  isActive
                    ? "text-void"
                    : "text-dim hover:text-ink"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="formule-active"
                    transition={{ duration: 0.45, ease: EASE }}
                    className="absolute inset-0 rounded-full bg-accent shadow-[0_8px_28px_-10px_var(--accent)]"
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
        className="relative mt-14 overflow-hidden rounded-xl border border-line bg-gradient-to-b from-white/[0.07] to-white/[0.015] backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.16),transparent_70%)]"
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
                <span className="font-mono inline-flex rounded-full border border-accent/40 bg-accent/[0.07] px-3.5 py-1 text-[0.66rem] tracking-[0.16em] text-accent uppercase">
                  {plan.badge}
                </span>

                <div className="mt-8 flex items-baseline gap-3">
                  <span className="text-5xl font-medium tracking-[-0.04em] text-ink sm:text-6xl">
                    {plan.price}
                  </span>
                </div>

                <div className="mt-3 text-[0.8rem] font-light tracking-[0.1em] text-dim uppercase">
                  {plan.terms}
                </div>

                {/*
                  Un fait, pas un plaidoyer. Le circuit de distribution
                  n'appelle pas de démonstration : celui qui se demande d'où
                  vient l'écart trouve sa réponse en six mots, les autres ne
                  s'arrêtent pas.
                */}
                <p className="mt-3 text-[0.82rem] font-light text-dimmer">
                  Vendu en direct, sans distributeur ni revendeur.
                </p>

                {/*
                  Sous le prix, une mention par formule — jamais les deux. Le
                  fractionnement est réservé à l'achat ; la location se règle
                  comptant et appelle une empreinte bancaire, annoncée ici en
                  retrait plutôt qu'au moment de payer.
                */}
                {plan.id === "achat" ? (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/[0.05] px-4 py-3.5">
                    <CreditCard
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      strokeWidth={1.5}
                    />
                    <p className="text-[0.82rem] leading-relaxed font-light text-accent text-pretty">
                      {INSTALLMENTS_NOTE}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-[0.78rem] leading-relaxed font-light text-dimmer text-pretty">
                    {LEASING_DEPOSIT_NOTE}
                  </p>
                )}

                <p className="mt-7 max-w-md text-[0.95rem] leading-relaxed font-light text-dim text-pretty">
                  {plan.pitch}
                </p>

                <ul className="mt-10 flex flex-col gap-5">
                  {plan.highlights.map(({ icon: Icon, label, detail }) => (
                    <li key={label} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.03]">
                        <Icon
                          className="h-3.5 w-3.5 text-accent"
                          strokeWidth={1.6}
                        />
                      </span>
                      <div>
                        <div className="text-sm font-medium tracking-tight text-ink">
                          {label}
                        </div>
                        <div className="mt-1 text-[0.85rem] leading-relaxed font-light text-dim text-pretty">
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
          <div className="lg:border-l lg:border-line lg:pl-16">
            <div className="font-mono text-[0.64rem] tracking-[0.24em] text-dimmer uppercase">
              Dans les deux cas
            </div>

            <ul className="mt-7 flex flex-col gap-4">
              {INCLUDED_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3.5">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    strokeWidth={2}
                  />
                  <span className="text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
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

            <p className="mt-5 text-center text-[0.78rem] font-light text-dimmer">
              {plan.id === "leasing"
                ? LEASING_OPEN
                  ? "1er mois et expédition réglés en ligne, caution par simple empreinte bancaire."
                  : `La location ouvrira après le ${DROP_NAME}. Laissez votre email pour être prévenu.`
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
                ? `Ouverture de la location après le ${DROP_NAME}`
                : DROP_SCARCITY,
          },
          ...ASSURANCES,
        ].map(({ icon: Icon, text }) => (
          <motion.li
            key={text}
            variants={rise}
            className="flex items-center justify-center gap-3 rounded-2xl border border-line px-5 py-4 text-center"
          >
            <Icon
              className="h-3.5 w-3.5 shrink-0 text-accent"
              strokeWidth={1.5}
            />
            <span className="text-[0.8rem] font-light text-dim text-pretty">
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
        viewport={{ once: true, amount: 0.3 }}
        className="mt-8 rounded-xl border border-line bg-white/[0.02] px-7 py-7 sm:px-9"
      >
        <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          {AFTER_SALE.map(({ icon: Icon, title, body }) => (
            <motion.div key={title} variants={rise} className="flex gap-3.5">
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                strokeWidth={1.6}
              />
              <div>
                <div className="text-[0.85rem] font-medium tracking-tight text-ink">
                  {title}
                </div>
                <p className="mt-1.5 text-[0.8rem] leading-relaxed font-light text-dimmer text-pretty">
                  {body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={rise}
          className="mt-7 border-t border-line pt-5 text-[0.78rem] font-light text-dimmer"
        >
          Conditions détaillées dans nos{" "}
          <Link
            href="/cgv"
            className="text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
          >
            conditions générales de vente
          </Link>
          .
        </motion.p>
      </motion.div>

      {/* ── Déroulé de la précommande ──────────────────────────────────
          Sorti du caisson qui l'enfermait : le fil qui relie les quatre
          étapes a besoin d'air pour se lire, et le bloc « Après l'achat »
          juste au-dessus garde son cadre — le contraste sépare les deux. */}
      <PreorderSteps />

      {/*
        La capture, en clair et en dernier.

        Le bouton de la carte d'offre ouvre la même liste, mais dans une modale
        — il faut vouloir cliquer pour la voir. Ici le visiteur vient de lire le
        prix, les garanties et les quatre étapes : c'est le point où il décide,
        et le formulaire doit y être posé, pas caché derrière un geste.

        Le bloc disparaît le jour où `ORDERS_OPEN` passe à `true` : la carte
        redevient un tunnel de commande, et deux appels à l'action concurrents
        sur le même écran se voleraient le clic.
      */}
      {!ORDERS_OPEN && <LeadCapture source="drop-1" />}

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
