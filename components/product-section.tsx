"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gauge, Mountain, Volume2, Wind, type LucideIcon } from "lucide-react";

import { EASE, container, rise } from "@/lib/motion";

type Spec = {
  id: string;
  label: string;
  icon: LucideIcon;
  metric: string;
  metricLabel: string;
  title: string;
  description: string;
  /** Remplissage de l'anneau et des graduations, de 0 à 1. */
  ratio: number;
};

const SPECS: Spec[] = [
  {
    id: "altitude",
    label: "Altitude",
    icon: Mountain,
    metric: "6 000 m",
    metricLabel: "Altitude simulée",
    title: "L'altitude se règle au mètre près",
    description:
      "Le générateur abaisse la fraction d'oxygène jusqu'à 9,5 % pour reproduire n'importe quel palier entre le niveau de la mer et 6 000 mètres. Vous fixez le sommet, la machine tient la consigne.",
    ratio: 0.92,
  },
  {
    id: "flux",
    label: "Flux d'air",
    icon: Wind,
    metric: "120 L/min",
    metricLabel: "Débit continu",
    title: "Un débit qui suit l'effort",
    description:
      "De quoi alimenter un masque en sprint comme une tente d'altitude sur une nuit entière. Le flux s'ajuste à votre ventilation, sans à-coup ni sensation de résistance.",
    ratio: 0.7,
  },
  {
    id: "regulation",
    label: "Régulation",
    icon: Gauge,
    metric: "± 0,1 %",
    metricLabel: "Stabilité O₂",
    title: "Une consigne tenue en boucle fermée",
    description:
      "Un capteur mesure la fraction d'oxygène en continu et corrige la séparation membranaire en temps réel. La consigne ne dérive pas, du premier au dernier intervalle.",
    ratio: 0.85,
  },
  {
    id: "silence",
    label: "Silence",
    icon: Volume2,
    metric: "42 dB",
    metricLabel: "Niveau sonore",
    title: "Assez discret pour dormir à côté",
    description:
      "Compresseur suspendu et double caisson acoustique : l'appareil reste sous le niveau d'une chambre calme, y compris en exposition nocturne prolongée.",
    ratio: 0.42,
  },
];

const RING_RADIUS = 78;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const TICK_COUNT = 48;
const VENT_COUNT = 24;

/**
 * Les graduations sont calculées au rendu, côté serveur puis côté client.
 * `Math.cos`/`Math.sin` ne sont pas garantis bit-à-bit identiques entre les
 * deux moteurs : on arrondit pour que le HTML sérialisé corresponde et éviter
 * une erreur d'hydratation.
 */
const TICKS = Array.from({ length: TICK_COUNT }, (_, index) => {
  const angle = (index / TICK_COUNT) * Math.PI * 2;
  const round = (value: number) => Math.round(value * 1000) / 1000;

  return {
    ratio: index / TICK_COUNT,
    x1: round(100 + Math.cos(angle) * 88),
    y1: round(100 + Math.sin(angle) * 88),
    x2: round(100 + Math.cos(angle) * 94),
    y2: round(100 + Math.sin(angle) * 94),
  };
});

/** Transition commune aux bascules de pilule (lecture centrale + panneau). */
const swap = {
  initial: { opacity: 0, y: 10, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(6px)" },
  transition: { duration: 0.4, ease: EASE },
};

export function ProductSection() {
  const [activeId, setActiveId] = useState(SPECS[0].id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const active = SPECS.find((spec) => spec.id === activeId) ?? SPECS[0];

  // Navigation clavier attendue sur un `tablist` : flèches gauche / droite.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;

    event.preventDefault();
    const index = SPECS.findIndex((spec) => spec.id === activeId);
    const next = SPECS[(index + step + SPECS.length) % SPECS.length];
    setActiveId(next.id);
    tabRefs.current[next.id]?.focus();
  }

  return (
    <section
      id="produit"
      aria-labelledby="produit-titre"
      className="relative z-20 mx-auto w-full max-w-7xl scroll-mt-24 px-6 py-24 sm:py-32 lg:px-10"
    >
      {/* ── En-tête de section ───────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="max-w-3xl"
      >
        <motion.span
          variants={rise}
          className="block text-[0.68rem] font-medium tracking-[0.28em] text-cyan-300/70 uppercase"
        >
          Le générateur
        </motion.span>

        <motion.h2
          variants={rise}
          id="produit-titre"
          className="mt-5 text-[1.85rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl"
        >
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Une seule machine.
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
            Deux atmosphères.
          </span>
        </motion.h2>

        <motion.p
          variants={rise}
          className="mt-6 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty"
        >
          {
            "ATMOS ONE sépare l'azote de l'oxygène pour produire, à la demande, un air d'altitude ou un air enrichi. Un seul appareil, piloté depuis une station unique."
          }
        </motion.p>
      </motion.div>

      <div className="mt-16 grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
        {/* ── Visuel : l'unité et sa lecture temps réel ─────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="relative mx-auto w-full max-w-md"
        >
          {/* Halo froid derrière l'appareil */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.18),transparent_70%)] blur-2xl"
          />

          <div className="flex flex-col rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.015] p-7 backdrop-blur-xl sm:p-9">
            {/* Bandeau supérieur de l'unité */}
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-medium tracking-[0.3em] text-white/70 uppercase">
                Atmos One
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]"
                />
                <span className="text-[0.6rem] font-light tracking-[0.18em] text-white/45 uppercase">
                  En service
                </span>
              </span>
            </div>

            {/* Cadran */}
            <div className="relative mt-8 aspect-square w-full">
              <svg
                viewBox="0 0 200 200"
                aria-hidden
                className="h-full w-full -rotate-90"
              >
                <defs>
                  <linearGradient id="atmos-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>

                {/* Graduations : celles couvertes par la mesure s'allument */}
                {TICKS.map((tick, index) => (
                  <line
                    key={index}
                    x1={tick.x1}
                    y1={tick.y1}
                    x2={tick.x2}
                    y2={tick.y2}
                    stroke={
                      tick.ratio <= active.ratio
                        ? "rgba(103,232,249,0.55)"
                        : "rgba(148,163,184,0.18)"
                    }
                    strokeWidth="1"
                    className="transition-[stroke] duration-500"
                  />
                ))}

                <circle
                  cx="100"
                  cy="100"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="rgba(148,163,184,0.14)"
                  strokeWidth="1.5"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="url(#atmos-ring)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={RING_LENGTH}
                  initial={false}
                  animate={{ strokeDashoffset: RING_LENGTH * (1 - active.ratio) }}
                  transition={{ duration: 1.1, ease: EASE }}
                />
              </svg>

              {/* Respiration au centre du cadran */}
              <motion.div
                aria-hidden
                animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.94, 1.04, 0.94] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute inset-[18%] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_70%)]"
              />

              {/* Lecture de la mesure active */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <AnimatePresence mode="wait">
                  <motion.div key={active.id} {...swap}>
                    <div className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
                      {active.metric}
                    </div>
                    <div className="mt-2.5 text-[0.62rem] font-light tracking-[0.2em] text-white/45 uppercase">
                      {active.metricLabel}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Grille de sortie d'air */}
            <div
              aria-hidden
              className="mt-8 flex items-end justify-center gap-1.5"
            >
              {Array.from({ length: VENT_COUNT }, (_, index) => (
                <motion.span
                  key={index}
                  animate={{ opacity: [0.12, 0.5, 0.12], scaleY: [0.65, 1, 0.65] }}
                  transition={{
                    duration: 3.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.09,
                  }}
                  className="h-7 w-px origin-bottom bg-gradient-to-t from-cyan-300/70 to-transparent"
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Pilules interactives et détail ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
          className="lg:pt-6"
        >
          <div
            role="tablist"
            aria-label="Caractéristiques du générateur"
            onKeyDown={handleKeyDown}
            className="flex flex-wrap gap-2.5"
          >
            {SPECS.map((spec) => {
              const Icon = spec.icon;
              const isActive = spec.id === active.id;

              return (
                <button
                  key={spec.id}
                  ref={(node) => {
                    tabRefs.current[spec.id] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`pilule-${spec.id}`}
                  aria-selected={isActive}
                  aria-controls={`panneau-${spec.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveId(spec.id)}
                  className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[0.78rem] font-medium tracking-[0.06em] transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:outline-none ${
                    isActive
                      ? "border-cyan-300/40 text-white"
                      : "border-white/10 text-white/50 hover:border-white/25 hover:text-white/85"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="pilule-active"
                      transition={{ duration: 0.45, ease: EASE }}
                      className="absolute inset-0 rounded-full bg-cyan-400/[0.09] shadow-[0_0_28px_-8px_rgba(56,189,248,0.8)]"
                    />
                  )}
                  <Icon
                    className={`relative h-3.5 w-3.5 transition-colors duration-300 ${
                      isActive ? "text-cyan-300" : "text-white/35"
                    }`}
                    strokeWidth={1.6}
                  />
                  <span className="relative">{spec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Détail de la pilule sélectionnée */}
          <div className="mt-10 min-h-[13rem] border-t border-white/[0.07] pt-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                id={`panneau-${active.id}`}
                role="tabpanel"
                aria-labelledby={`pilule-${active.id}`}
                tabIndex={0}
                {...swap}
                className="focus-visible:outline-none"
              >
                <h3 className="text-xl font-medium tracking-tight text-white text-balance sm:text-2xl">
                  {active.title}
                </h3>
                <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed font-light text-white/55 text-pretty">
                  {active.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
