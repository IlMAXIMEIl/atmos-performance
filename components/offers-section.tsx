"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Infinity as InfinityIcon,
  KeyRound,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { ReservationModal } from "@/components/reservation-modal";
import { EASE, container, rise } from "@/lib/motion";

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
    badge: "Vous êtes propriétaire",
    price: "8 900 €",
    terms: "TTC · paiement unique",
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
        detail: "Pièces et main-d'œuvre comprises, retour atelier pris en charge.",
      },
      {
        icon: InfinityIcon,
        label: "Mises à jour à vie",
        detail: "Nouveaux protocoles et évolutions logicielles inclus.",
      },
    ],
    cta: "Réserver ma place",
  },
  {
    id: "leasing",
    label: "Leasing",
    badge: "Sans apport",
    price: "290 €",
    terms: "par mois · engagement 24 mois",
    pitch:
      "Le même appareil, entretenu et renouvelé par nos soins, pour une mensualité fixe.",
    highlights: [
      {
        icon: Wrench,
        label: "Maintenance incluse",
        detail: "Entretien annuel et pièces d'usure entièrement pris en charge.",
      },
      {
        icon: RefreshCcw,
        label: "Échange de génération",
        detail: "Passage au modèle suivant à mi-contrat, sans surcoût.",
      },
      {
        icon: CalendarClock,
        label: "Sortie à 12 mois",
        detail: "Résiliation possible après un an, avec 60 jours de préavis.",
      },
    ],
    cta: "Demander un leasing",
  },
];

/** Livré quelle que soit la formule retenue. */
const INCLUDED = [
  "Générateur ATMOS ONE",
  "Masque et circuit respiratoire",
  "Station de contrôle",
  "Protocoles guidés Live High et Train High",
  "Accompagnement au démarrage",
];

const ASSURANCES = [
  { icon: PackageCheck, text: "Acompte de 500 € entièrement remboursable" },
  { icon: Truck, text: "Livraison estimée au premier trimestre 2027" },
  { icon: CalendarClock, text: "Vague #1 limitée à 100 unités" },
];

const swap = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -12, filter: "blur(6px)" },
  transition: { duration: 0.4, ease: EASE },
};

export function OffersSection() {
  const [planId, setPlanId] = useState<PlanId>("achat");
  const [modalOpen, setModalOpen] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const plan = PLANS.find((item) => item.id === planId) ?? PLANS[0];

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
          {
            "La vague #1 ouvre la pré-vente aux deux formules. Le matériel livré est strictement le même : seule la manière de le financer change."
          }
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
                  isActive ? "text-[#04070D]" : "text-white/55 hover:text-white/85"
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
              {INCLUDED.map((item) => (
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

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="group relative mt-11 inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 px-8 py-4 text-sm font-semibold tracking-[0.04em] text-[#04070D] shadow-[0_0_36px_-6px_rgba(56,189,248,0.65)] transition-all duration-300 hover:shadow-[0_0_54px_-4px_rgba(56,189,248,0.9)] focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C10] focus-visible:outline-none"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
              <span className="relative">{plan.cta}</span>
              <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <p className="mt-5 text-center text-[0.78rem] font-light text-white/35">
              Sans engagement à cette étape : la réservation fixe votre rang dans
              la vague #1.
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
        {ASSURANCES.map(({ icon: Icon, text }) => (
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
            <Sparkles className="h-3 w-3 text-indigo-300/80" strokeWidth={1.5} />
            À venir
          </span>

          <h3 className="mt-5 text-lg font-medium tracking-[0.06em] text-white/85 uppercase sm:text-xl">
            ATMOS Chamber
          </h3>

          <p className="mx-auto mt-3 max-w-md text-[0.88rem] leading-relaxed font-light text-white/40 text-pretty">
            Notre caisson de régénération hyperbare, second appareil de la gamme.
            Un produit distinct du générateur d&apos;altitude.
          </p>
        </div>
      </motion.aside>

      <ReservationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        planId={plan.id}
        planLabel={plan.label}
      />
    </section>
  );
}
