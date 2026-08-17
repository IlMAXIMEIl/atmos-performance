"use client";

import { motion } from "framer-motion";
import {
  Droplet,
  Fingerprint,
  Microscope,
  type LucideIcon,
} from "lucide-react";

import { EASE, container, rise } from "@/lib/motion";

const FIGURES = [
  { value: "3 semaines", label: "avant les premières adaptations mesurables" },
  { value: "60 – 90 min", label: "d'exposition par séance" },
  { value: "2 à 3 ×", label: "par semaine en phase d'entretien" },
  { value: "30 ans", label: "de littérature sur l'hypoxie intermittente" },
];

const PILLARS: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}[] = [
  {
    icon: Microscope,
    eyebrow: "Les études",
    title: "Un terrain déjà balisé",
    description:
      "L'exposition intermittente en hypoxie normobarique est documentée depuis les années 1990, du laboratoire au sport de haut niveau. Les protocoles proposés reprennent les schémas les plus étudiés plutôt qu'une recette maison.",
  },
  {
    icon: Droplet,
    eyebrow: "Le fer",
    title: "La condition préalable",
    description:
      "Sans réserves de fer suffisantes, la réponse à l'altitude ne se met pas en place. Un bilan de ferritine avant de démarrer, puis un contrôle en cours de cycle : c'est la première ligne du protocole, pas une option.",
  },
  {
    icon: Fingerprint,
    eyebrow: "L'adaptation",
    title: "Personne ne répond pareil",
    description:
      "Entre deux athlètes soumis au même palier, la réponse varie fortement. La dose d'altitude se règle donc séance après séance, à partir de ce que la station enregistre, plutôt qu'une fois pour toutes.",
  },
];

export function ScienceSection() {
  return (
    <section
      id="science"
      aria-labelledby="science-titre"
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
          La science
        </motion.span>

        <motion.h2
          variants={rise}
          id="science-titre"
          className="mt-5 text-[1.85rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl"
        >
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Rien de magique.
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
            De la physiologie.
          </span>
        </motion.h2>

        <motion.p
          variants={rise}
          className="mt-6 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty"
        >
          {
            "L'altitude simulée n'est pas un raccourci : c'est une contrainte que le corps apprend à absorber, sur des durées connues et à des doses mesurées. Voici ce que cela suppose."
          }
        </motion.p>
      </motion.div>

      {/* ── Chiffres clés ────────────────────────────────────────────── */}
      <motion.dl
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-16 grid grid-cols-1 divide-y divide-white/[0.07] border-y border-white/[0.07] sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0"
      >
        {FIGURES.map((figure) => (
          <motion.div
            key={figure.value}
            variants={rise}
            // Colonne unique : aucun retrait. En grille : les items de bord
            // restent alignés sur les marges de la section.
            className="px-0 py-8 sm:px-6 lg:first:pl-0 lg:last:pr-0"
          >
            <dt className="text-2xl font-medium tracking-[-0.025em] text-white sm:text-[1.7rem]">
              {figure.value}
            </dt>
            <dd className="mt-2.5 text-[0.85rem] leading-relaxed font-light text-white/45 text-pretty">
              {figure.label}
            </dd>
          </motion.div>
        ))}
      </motion.dl>

      {/* ── Les trois piliers de réassurance ─────────────────────────── */}
      <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-8">
        {PILLARS.map(({ icon: Icon, eyebrow, title, description }, index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: EASE, delay: index * 0.1 }}
            className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-8 backdrop-blur-xl transition-colors duration-500 hover:border-cyan-300/25"
          >
            {/* Halo discret au survol */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.14),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />

            <div className="relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <Icon className="h-4 w-4 text-cyan-300/85" strokeWidth={1.5} />
              </span>

              <div className="mt-7 text-[0.64rem] font-medium tracking-[0.24em] text-white/40 uppercase">
                {eyebrow}
              </div>

              <h3 className="mt-3 text-lg font-medium tracking-tight text-white text-balance sm:text-xl">
                {title}
              </h3>

              <p className="mt-4 text-[0.9rem] leading-relaxed font-light text-white/50 text-pretty">
                {description}
              </p>
            </div>
          </motion.article>
        ))}
      </div>

      {/* ── Réserve d'usage ──────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mx-auto mt-14 max-w-2xl text-center text-[0.78rem] leading-relaxed font-light text-white/35 text-pretty"
      >
        {
          "Ces informations sont données à titre indicatif et ne constituent pas un avis médical. En cas de pathologie cardiaque ou respiratoire, un avis médical est nécessaire avant toute exposition."
        }
      </motion.p>
    </section>
  );
}
