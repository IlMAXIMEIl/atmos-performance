"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Droplets,
  HeartPulse,
  Moon,
  RefreshCw,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { EASE, container, rise } from "@/lib/motion";

type ModeId = "hypoxie" | "hyperoxie";

type Mode = {
  id: ModeId;
  eyebrow: string;
  range: string;
  title: string;
  description: string;
  benefits: { icon: LucideIcon; label: string; detail: string }[];
  /** Bornes du segment sur l'axe d'oxygène, en % d'O₂. */
  axis: [number, number];
  /** Classes Tailwind écrites en toutes lettres pour rester détectables. */
  theme: {
    border: string;
    glow: string;
    badge: string;
    icon: string;
    title: string;
    segment: string;
  };
};

const MODES: Mode[] = [
  {
    id: "hypoxie",
    eyebrow: "Hypoxie · Entraînement",
    range: "9,5 – 15 % O₂",
    title: "Monter sans quitter la pièce",
    description:
      "En raréfiant l'oxygène, le corps compense : la ventilation s'ajuste, le réseau capillaire se densifie, le transport de l'oxygène gagne en efficacité. L'adaptation d'un stage en altitude, sans le déplacement.",
    benefits: [
      {
        icon: TrendingUp,
        label: "VO2max",
        detail: "Un plafond aérobie repoussé séance après séance.",
      },
      {
        icon: Droplets,
        label: "Hématocrite",
        detail: "Davantage de transporteurs d'oxygène en circulation.",
      },
      {
        icon: HeartPulse,
        label: "Économie d'effort",
        detail: "La même allure, à un coût cardiaque plus faible.",
      },
    ],
    axis: [9.5, 15],
    theme: {
      border: "hover:border-cyan-300/35",
      glow: "bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.16),transparent_70%)]",
      badge: "border-cyan-300/25 bg-cyan-400/[0.07] text-cyan-100/90",
      icon: "text-cyan-300",
      title: "from-cyan-100 to-sky-300",
      segment: "from-cyan-300 to-sky-500",
    },
  },
  {
    id: "hyperoxie",
    eyebrow: "Hyperoxie · Récupération",
    range: "jusqu'à 40 % O₂",
    title: "Redescendre plus vite",
    description:
      "Après l'effort, un air enrichi accélère la resaturation et l'évacuation des déchets métaboliques. Le retour au calme est plus net, et la séance suivante arrive plus tôt.",
    benefits: [
      {
        icon: RefreshCw,
        label: "Régénération",
        detail: "Les tissus retrouvent leur niveau d'oxygénation plus vite.",
      },
      {
        icon: Activity,
        label: "Clairance",
        detail: "Les sous-produits de l'effort sont évacués plus tôt.",
      },
      {
        icon: Moon,
        label: "Nuit réparatrice",
        detail: "Un retour au calme qui se prolonge jusqu'au sommeil.",
      },
    ],
    axis: [24, 40],
    theme: {
      border: "hover:border-amber-200/35",
      glow: "bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.14),transparent_70%)]",
      badge: "border-amber-200/25 bg-amber-300/[0.07] text-amber-100/90",
      icon: "text-amber-200",
      title: "from-amber-100 to-orange-300",
      segment: "from-amber-200 to-orange-400",
    },
  },
];

/** Repères affichés sous l'axe. */
const MARKERS = [
  { value: 9.5, label: "9,5 %", caption: "Sommet simulé", align: "left" },
  { value: 20.9, label: "20,9 %", caption: "Air ambiant", align: "center" },
  { value: 40, label: "40 %", caption: "Air enrichi", align: "right" },
] as const;

const AXIS_MIN = 8;
const AXIS_MAX = 42;

/** Convertit une fraction d'O₂ en position sur l'axe, en pourcentage. */
function toAxis(value: number) {
  const ratio = (value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN);
  return Math.round(ratio * 1000) / 10;
}

export function DualitySection() {
  const [hovered, setHovered] = useState<ModeId | null>(null);

  return (
    <section
      id="technologie"
      aria-labelledby="dualite-titre"
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
          Le principe
        </motion.span>

        <motion.h2
          variants={rise}
          id="dualite-titre"
          className="mt-5 text-[1.85rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl"
        >
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Deux atmosphères,
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-200 via-white/80 to-amber-200 bg-clip-text text-transparent">
            deux effets opposés.
          </span>
        </motion.h2>

        <motion.p
          variants={rise}
          className="mt-6 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty"
        >
          {
            "On raréfie l'oxygène pour provoquer l'adaptation, on l'enrichit pour accélérer le retour au calme. Le même appareil couvre les deux extrémités du spectre."
          }
        </motion.p>
      </motion.div>

      {/* ── Axe d'oxygène ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        aria-hidden
        className="mt-16 hidden sm:block"
      >
        <div className="relative h-px w-full bg-white/[0.09]">
          {MODES.map((mode) => {
            const start = toAxis(mode.axis[0]);
            const end = toAxis(mode.axis[1]);

            return (
              <motion.span
                key={mode.id}
                animate={{ opacity: hovered === mode.id ? 1 : 0.5 }}
                transition={{ duration: 0.4, ease: EASE }}
                style={{ left: `${start}%`, width: `${end - start}%` }}
                className={`absolute -top-[1px] h-[3px] rounded-full bg-gradient-to-r ${mode.theme.segment}`}
              />
            );
          })}

          {/* Repère de l'air ambiant */}
          <span
            style={{ left: `${toAxis(20.9)}%` }}
            className="absolute -top-2 h-4 w-px bg-white/25"
          />
        </div>

        <div className="relative mt-4 h-9">
          {MARKERS.map((marker) => (
            <div
              key={marker.label}
              style={{ left: `${toAxis(marker.value)}%` }}
              className={`absolute top-0 ${
                marker.align === "left"
                  ? "translate-x-0"
                  : marker.align === "right"
                    ? "-translate-x-full"
                    : "-translate-x-1/2"
              }`}
            >
              <div className="text-[0.72rem] font-medium tracking-tight text-white/70">
                {marker.label}
              </div>
              <div className="mt-0.5 text-[0.6rem] font-light tracking-[0.14em] text-white/35 uppercase">
                {marker.caption}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Les deux cartes ──────────────────────────────────────────── */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {MODES.map((mode, index) => (
          <motion.article
            key={mode.id}
            initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.9, ease: EASE, delay: index * 0.12 }}
            onHoverStart={() => setHovered(mode.id)}
            onHoverEnd={() => setHovered(null)}
            className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-8 backdrop-blur-xl transition-colors duration-500 sm:p-10 ${mode.theme.border}`}
          >
            {/* Halo d'accent, révélé au survol */}
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60 transition-opacity duration-500 group-hover:opacity-100 ${mode.theme.glow}`}
            />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[0.66rem] font-medium tracking-[0.24em] text-white/45 uppercase">
                  {mode.eyebrow}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[0.68rem] font-medium tracking-[0.08em] ${mode.theme.badge}`}
                >
                  {mode.range}
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-medium tracking-[-0.02em] text-balance sm:text-[1.75rem]">
                <span
                  className={`bg-gradient-to-r bg-clip-text text-transparent ${mode.theme.title}`}
                >
                  {mode.title}
                </span>
              </h3>

              <p className="mt-4 text-[0.95rem] leading-relaxed font-light text-white/55 text-pretty">
                {mode.description}
              </p>

              <ul className="mt-9 flex flex-col gap-5 border-t border-white/[0.07] pt-8">
                {mode.benefits.map(({ icon: Icon, label, detail }) => (
                  <li key={label} className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <Icon
                        className={`h-3.5 w-3.5 ${mode.theme.icon}`}
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
            </div>
          </motion.article>
        ))}
      </div>

      {/* ── Liaison entre les deux modes ─────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mt-12 flex items-center justify-center gap-3 text-center text-[0.8rem] font-light tracking-[0.06em] text-white/40"
      >
        <Timer className="h-3.5 w-3.5 text-white/30" strokeWidth={1.5} />
        {"On bascule d'un mode à l'autre depuis la station, sans rien débrancher."}
      </motion.p>
    </section>
  );
}
