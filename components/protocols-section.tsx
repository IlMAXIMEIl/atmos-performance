"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Droplet,
  Gauge,
  HeartPulse,
  Moon,
  Plane,
  RotateCcw,
  ShieldCheck,
  Timer,
  TrendingUp,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { EASE, container, rise } from "@/lib/motion";

type ProtocolId = "sommeil" | "entrainement" | "exposition";

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
    eyebrow: "Mode Sommeil · LHTL",
    range: "2 100 – 2 600 m",
    title: "Dormir en altitude, s'entraîner au niveau de la mer",
    description:
      "Le générateur alimente une tente posée sur votre lit. L'exposition est longue et modérée : l'acclimatation s'installe pendant la nuit, sans jamais dégrader la qualité des séances du lendemain.",
    points: [
      {
        icon: Moon,
        label: "12 à 14 h par jour",
        detail: "Une dose longue, à intensité faible, qui n'empiète sur rien.",
      },
      {
        icon: ShieldCheck,
        label: "Plafond de verre à 2 600 m",
        detail:
          "Figé, sans exception de niveau. La réponse EPO est optimale entre 2 200 et 2 500 m ; au-delà, le sommeil se dégrade plus vite que le gain hématologique ne progresse.",
      },
      {
        icon: Gauge,
        label: "Montée progressive",
        detail: "On gagne 300 à 500 mètres de palier par semaine.",
      },
    ],
    axis: [2100, 2600],
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
    eyebrow: "Mode Entraînement · IHT",
    range: "2 500 – 3 500 m",
    title: "Le cardio d'une séance intense, sans les chocs",
    description:
      "Sous masque, à l'effort sous-maximal — marche, home-trainer, rameur. Le palier reste modéré parce que l'intensité vient de l'air, pas de l'allure : on atteint la fréquence cardiaque cible sans charge mécanique.",
    points: [
      {
        icon: Timer,
        label: "35 à 45 min",
        detail: "Par cycles alternés, 3 à 4 fois par semaine.",
      },
      {
        icon: TrendingUp,
        label: "VO2max et capillarisation",
        detail:
          "Le stimulus périphérique : VEGF, angiogenèse, efficacité mitochondriale.",
      },
      {
        icon: HeartPulse,
        label: "Reprise après blessure",
        detail:
          "Un cran plus bas, autour de 2 400 m, pour entretenir le cardio sans solliciter la zone lésée.",
      },
    ],
    axis: [2500, 3500],
    theme: {
      border: "hover:border-indigo-300/35",
      glow: "bg-[radial-gradient(circle_at_50%_0%,rgba(129,140,248,0.16),transparent_70%)]",
      badge: "border-indigo-300/25 bg-indigo-400/[0.07] text-indigo-100/90",
      icon: "text-indigo-300",
      title: "from-indigo-100 to-blue-300",
      segment: "from-blue-400 to-indigo-500",
    },
  },
  {
    id: "exposition",
    eyebrow: "Mode Exposition · IHE",
    range: "3 500 – 5 000 m",
    title: "Le choc hypoxique, au repos complet",
    description:
      "Assis ou allongé, sans le moindre effort. Des cycles courts en hypoxie profonde alternés avec des retours à l'air ambiant : c'est le gradient répété, et non la durée, qui porte le stimulus.",
    points: [
      {
        icon: Wind,
        label: "Cycles 5 min / 5 min",
        detail: "Cinq alternances par séance, sans jamais quitter le fauteuil.",
      },
      {
        icon: Droplet,
        label: "Mitochondries et tonus vagal",
        detail:
          "La voie du biohacking : HIF-1α, PGC-1α, variabilité cardiaque, sommeil profond.",
      },
      {
        icon: Gauge,
        label: "Le palier le plus haut",
        detail:
          "Réservé au repos strict : ces altitudes ne se pratiquent jamais à l'effort.",
      },
    ],
    axis: [3500, 5000],
    theme: {
      border: "hover:border-violet-300/35",
      glow: "bg-[radial-gradient(circle_at_50%_0%,rgba(167,139,250,0.16),transparent_70%)]",
      badge: "border-violet-300/25 bg-violet-400/[0.07] text-violet-100/90",
      icon: "text-violet-300",
      title: "from-violet-100 to-purple-300",
      segment: "from-violet-400 to-purple-500",
    },
  },
];

/**
 * Les deux usages qui encadrent un séjour en altitude réelle.
 *
 * Volontairement tenus en bande compacte plutôt qu'en section : ce sont des
 * arguments d'appoint, ils n'ont pas à peser autant que les deux protocoles.
 */
const USE_CASES = [
  {
    icon: Plane,
    title: "Avant le départ",
    detail:
      "Trois semaines de nuits sous tente avant un trek, un sommet ou un stage, et vous arrivez déjà acclimaté. Les premiers jours ne sont plus consacrés à s'adapter, et le risque de mal aigu des montagnes diminue.",
  },
  {
    icon: RotateCcw,
    title: "Au retour",
    detail:
      "Les gains d'un stage en altitude s'effacent en deux à trois semaines une fois redescendu. Quelques nuits par semaine au même palier prolongent l'adaptation au lieu de la laisser filer.",
  },
];

/** Repères affichés sous l'axe. */
const MARKERS = [
  { value: 0, label: "0 m", caption: "Niveau de la mer", align: "left" },
  {
    value: 2600,
    label: "2 600 m",
    caption: "Plafond nocturne",
    align: "center",
  },
  {
    value: 6500,
    label: "6 500 m",
    caption: "Plafond du système",
    align: "right",
  },
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
            trois protocoles d&apos;altitude.
          </span>
        </motion.h2>

        <motion.p
          variants={rise}
          className="mt-6 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty"
        >
          {
            "La dose d'altitude se joue sur deux leviers : la durée et le palier. Longue et modérée pendant la nuit, modérée à l'effort, courte et profonde au repos. Chaque protocole a sa plage — c'est la modalité qui la fixe, jamais l'objectif — et les trois se conduisent depuis le même appareil."
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
          {PROTOCOLS.map((protocol, index) => {
            const start = toAxis(protocol.axis[0]);
            const end = toAxis(protocol.axis[1]);

            return (
              <motion.span
                key={protocol.id}
                animate={{ opacity: hovered === protocol.id ? 1 : 0.45 }}
                transition={{ duration: 0.4, ease: EASE }}
                style={{
                  left: `${start}%`,
                  width: `${end - start}%`,
                  top: `${index * 7 - 1}px`,
                }}
                className={`absolute h-[3px] rounded-full bg-gradient-to-r ${protocol.theme.segment}`}
              />
            );
          })}
        </div>

        <div className="relative mt-8 h-9">
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
      <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-6">
        {PROTOCOLS.map((protocol, index) => (
          <motion.article
            key={protocol.id}
            initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.9, ease: EASE, delay: index * 0.12 }}
            onHoverStart={() => setHovered(protocol.id)}
            onHoverEnd={() => setHovered(null)}
            className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-8 backdrop-blur-xl transition-colors duration-500 ${protocol.theme.border}`}
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

      {/* ── Encadrer un séjour en altitude réelle ────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl sm:p-10"
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span className="text-[0.66rem] font-medium tracking-[0.24em] text-white/45 uppercase">
            Et autour d&apos;un séjour en altitude
          </span>
          <p className="text-[0.88rem] font-light text-white/50 text-pretty">
            {
              "La tente ne sert pas qu'à préparer une saison : elle encadre aussi les départs en montagne."
            }
          </p>
        </div>

        <div className="mt-8 grid gap-8 border-t border-white/[0.07] pt-8 sm:grid-cols-2 sm:gap-10">
          {USE_CASES.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex items-start gap-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                <Icon
                  className="h-3.5 w-3.5 text-cyan-300/80"
                  strokeWidth={1.6}
                />
              </span>
              <div>
                <div className="text-sm font-medium tracking-tight text-white/90">
                  {title}
                </div>
                <p className="mt-1.5 text-[0.85rem] leading-relaxed font-light text-white/45 text-pretty">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Liaison entre les deux protocoles ────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mt-10 flex items-center justify-center gap-3 text-center text-[0.8rem] font-light tracking-[0.06em] text-white/40"
      >
        <Timer className="h-3.5 w-3.5 text-white/30" strokeWidth={1.5} />
        {
          "Les trois protocoles se combinent : nuits en tente, séances sous masque, expositions au repos — depuis la même station."
        }
      </motion.p>
    </section>
  );
}
