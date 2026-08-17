"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Droplet,
  Gauge,
  Moon,
  Timer,
  TrendingUp,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { EASE, container, rise } from "@/lib/motion";

type ProtocolId = "sommeil" | "entrainement";

type Protocol = {
  id: ProtocolId;
  eyebrow: string;
  range: string;
  title: string;
  description: string;
  points: { icon: LucideIcon; label: string; detail: string }[];
  /** Bornes du palier d'altitude, en mètres. */
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

const PROTOCOLS: Protocol[] = [
  {
    id: "sommeil",
    eyebrow: "Mode Sommeil · Live High",
    range: "2 000 – 3 500 m",
    title: "Dormir en altitude, s'entraîner au niveau de la mer",
    description:
      "Le générateur alimente une tente posée sur votre lit. L'exposition est longue et modérée : l'acclimatation s'installe pendant la nuit, sans jamais dégrader la qualité des séances du lendemain.",
    points: [
      {
        icon: Moon,
        label: "8 à 10 h par nuit",
        detail: "Une dose longue, à intensité faible, qui n'empiète sur rien.",
      },
      {
        icon: Droplet,
        label: "Acclimatation",
        detail: "La voie la plus documentée pour préparer un séjour en altitude.",
      },
      {
        icon: Gauge,
        label: "Montée progressive",
        detail: "On gagne 300 à 500 mètres de palier par semaine.",
      },
    ],
    axis: [2000, 3500],
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
    id: "entrainement",
    eyebrow: "Mode Entraînement · Train High / IHT",
    range: "4 000 – 6 000 m",
    title: "Concentrer la contrainte sur la séance",
    description:
      "Sous masque, à l'arrêt ou sur home-trainer, par alternance de cycles courts en hypoxie et de retours à l'air ambiant. L'exposition est brève et forte : elle vise la tolérance et le travail ventilatoire.",
    points: [
      {
        icon: Timer,
        label: "20 à 60 min",
        detail: "Des séries courtes, à des paliers nettement plus hauts.",
      },
      {
        icon: TrendingUp,
        label: "VO2max",
        detail: "Le plafond aérobie travaillé sous contrainte maximale.",
      },
      {
        icon: Wind,
        label: "Réponse ventilatoire",
        detail: "Un système respiratoire sollicité plus fort qu'à plat.",
      },
    ],
    axis: [4000, 6000],
    theme: {
      border: "hover:border-indigo-300/35",
      glow: "bg-[radial-gradient(circle_at_50%_0%,rgba(129,140,248,0.16),transparent_70%)]",
      badge: "border-indigo-300/25 bg-indigo-400/[0.07] text-indigo-100/90",
      icon: "text-indigo-300",
      title: "from-indigo-100 to-blue-300",
      segment: "from-blue-400 to-indigo-500",
    },
  },
];

/** Repères affichés sous l'axe. */
const MARKERS = [
  { value: 0, label: "0 m", caption: "Niveau de la mer", align: "left" },
  { value: 3500, label: "3 500 m", caption: "Palier nocturne", align: "center" },
  { value: 6500, label: "6 500 m", caption: "Plafond du système", align: "right" },
] as const;

const AXIS_MIN = 0;
const AXIS_MAX = 6500;

/** Convertit une altitude en position sur l'axe, en pourcentage. */
function toAxis(value: number) {
  const ratio = (value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN);
  return Math.round(ratio * 1000) / 10;
}

export function ProtocolsSection() {
  const [hovered, setHovered] = useState<ProtocolId | null>(null);

  return (
    <section
      id="protocoles"
      aria-labelledby="protocoles-titre"
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
          Les protocoles
        </motion.span>

        <motion.h2
          variants={rise}
          id="protocoles-titre"
          className="mt-5 text-[1.85rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl"
        >
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Un générateur,
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-200 to-indigo-300 bg-clip-text text-transparent">
            deux protocoles d&apos;altitude.
          </span>
        </motion.h2>

        <motion.p
          variants={rise}
          className="mt-6 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty"
        >
          {
            "La dose d'altitude se joue sur deux leviers : la durée et le palier. Longue et modérée pendant la nuit, courte et élevée à l'entraînement — les deux se conduisent depuis le même appareil."
          }
        </motion.p>
      </motion.div>

      {/* ── Axe d'altitude ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        aria-hidden
        className="mt-16 hidden sm:block"
      >
        <div className="relative h-px w-full bg-white/[0.09]">
          {PROTOCOLS.map((protocol) => {
            const start = toAxis(protocol.axis[0]);
            const end = toAxis(protocol.axis[1]);

            return (
              <motion.span
                key={protocol.id}
                animate={{ opacity: hovered === protocol.id ? 1 : 0.5 }}
                transition={{ duration: 0.4, ease: EASE }}
                style={{ left: `${start}%`, width: `${end - start}%` }}
                className={`absolute -top-[1px] h-[3px] rounded-full bg-gradient-to-r ${protocol.theme.segment}`}
              />
            );
          })}
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

      {/* ── Les deux protocoles ──────────────────────────────────────── */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {PROTOCOLS.map((protocol, index) => (
          <motion.article
            key={protocol.id}
            initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.9, ease: EASE, delay: index * 0.12 }}
            onHoverStart={() => setHovered(protocol.id)}
            onHoverEnd={() => setHovered(null)}
            className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-8 backdrop-blur-xl transition-colors duration-500 sm:p-10 ${protocol.theme.border}`}
          >
            {/* Halo d'accent, révélé au survol */}
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60 transition-opacity duration-500 group-hover:opacity-100 ${protocol.theme.glow}`}
            />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[0.66rem] font-medium tracking-[0.24em] text-white/45 uppercase">
                  {protocol.eyebrow}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[0.68rem] font-medium tracking-[0.08em] ${protocol.theme.badge}`}
                >
                  {protocol.range}
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-medium tracking-[-0.02em] text-balance sm:text-[1.75rem]">
                <span
                  className={`bg-gradient-to-r bg-clip-text text-transparent ${protocol.theme.title}`}
                >
                  {protocol.title}
                </span>
              </h3>

              <p className="mt-4 text-[0.95rem] leading-relaxed font-light text-white/55 text-pretty">
                {protocol.description}
              </p>

              <ul className="mt-9 flex flex-col gap-5 border-t border-white/[0.07] pt-8">
                {protocol.points.map(({ icon: Icon, label, detail }) => (
                  <li key={label} className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <Icon
                        className={`h-3.5 w-3.5 ${protocol.theme.icon}`}
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

      {/* ── Liaison entre les deux protocoles ────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mt-12 flex items-center justify-center gap-3 text-center text-[0.8rem] font-light tracking-[0.06em] text-white/40"
      >
        <Timer className="h-3.5 w-3.5 text-white/30" strokeWidth={1.5} />
        {
          "Les deux protocoles se combinent : nuits en tente, séances sous masque, depuis la même station."
        }
      </motion.p>
    </section>
  );
}
