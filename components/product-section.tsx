"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Mountain,
  Package,
  Volume2,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { EASE, container, rise } from "@/lib/motion";

type Spec = {
  id: string;
  label: string;
  icon: LucideIcon;
  metric: string;
  metricLabel: string;
  title: string;
  description: string;
  /** Remplissage de la jauge, de 0 à 1. Poids visuel, sans unité. */
  ratio: number;
};

const SPECS: Spec[] = [
  {
    id: "altitude",
    label: "Altitude",
    icon: Mountain,
    metric: "6 500 m",
    metricLabel: "Altitude simulée",
    title: "L'altitude se règle au mètre près",
    description:
      "Le générateur abaisse la fraction d'oxygène de 20,9 % à 9 %, soit n'importe quel palier entre le niveau de la mer et 6 500 mètres (21 330 ft). Vous fixez le sommet, la machine tient la consigne.",
    ratio: 1,
  },
  {
    id: "flux",
    label: "Flux d'air",
    icon: Wind,
    metric: "100 L/min",
    metricLabel: "Débit hypoxique",
    title: "Un débit qui suit l'effort",
    description:
      "Cent litres d'air hypoxique par minute : de quoi alimenter un masque en pleine séance comme une tente d'altitude sur une nuit entière.",
    ratio: 0.78,
  },
  {
    id: "silence",
    label: "Silence",
    icon: Volume2,
    metric: "≤ 50 dB",
    metricLabel: "Niveau sonore",
    title: "Assez discret pour tourner la nuit",
    description:
      "Cinquante décibels au maximum, l'ordre de grandeur d'un réfrigérateur. Pour les nuits sous tente, l'unité se place volontiers hors de la chambre, reliée au circuit.",
    ratio: 0.5,
  },
  {
    id: "format",
    label: "Format",
    icon: Package,
    metric: "27 kg",
    metricLabel: "Poids net",
    title: "Le volume d'un gros appareil ménager",
    description:
      "365 × 375 × 600 mm sur roulettes, pour 550 watts au maximum. Il se déplace d'une pièce à l'autre sans démontage.",
    ratio: 0.45,
  },
];

/** Fiche technique complète, telle que fournie par le constructeur. */
const DATASHEET = [
  { label: "Concentration hypoxique", value: "9 % – 20,9 % O₂" },
  { label: "Altitude simulée", value: "0 – 6 500 m (0 – 21 330 ft)" },
  { label: "Débit hypoxique", value: "100 L/min" },
  { label: "Niveau sonore", value: "≤ 50 dB" },
  { label: "Consommation", value: "≤ 550 W" },
  { label: "Poids net", value: "27 kg" },
  { label: "Dimensions", value: "365 × 375 × 600 mm" },
  { label: "Alarmes", value: "Coupure d'alimentation, pression haute / basse" },
  { label: "En option", value: "Oxymètre de pouls, système de monitoring" },
];

/** Transition commune aux bascules de pilule (lecture de mesure + panneau). */
const swap = {
  initial: { opacity: 0, y: 10, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(6px)" },
  transition: { duration: 0.4, ease: EASE },
};

export function ProductSection() {
  const [activeId, setActiveId] = useState(SPECS[0].id);
  const railRef = useRef<HTMLDivElement | null>(null);

  const active = SPECS.find((spec) => spec.id === activeId) ?? SPECS[0];

  /**
   * La scène est épinglée, le défilement ne fait qu'avancer le chapitre.
   *
   * Au-dessus de `lg`, la carte et le panneau descriptif restent tous deux
   * immobiles au centre de l'écran ; c'est le texte de droite qui se substitue
   * sur place. Le rail — un conteneur volontairement plus haut que la fenêtre —
   * fournit la distance de défilement, et la position à l'intérieur de ce rail
   * donne le chapitre à afficher.
   *
   * Rien n'est détourné : aucun événement bloqué, aucun mouvement forcé. La
   * page défile normalement, seul le contenu épinglé change.
   */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    /**
     * Chapitre courant, déduit de la progression dans le rail.
     *
     * Calcul direct plutôt qu'observateur d'intersection : il se vérifie à
     * n'importe quelle position de défilement, et il donne le bon état dès le
     * montage — utile quand on arrive par l'ancre `#produit`, la page étant
     * alors déjà positionnée au milieu de la section.
     */
    const chapterAt = () => {
      const rect = rail.getBoundingClientRect();
      const runway = rect.height - window.innerHeight;
      if (runway <= 0) return 0;

      const index = Math.floor((-rect.top / runway) * SPECS.length);
      return Math.min(SPECS.length - 1, Math.max(0, index));
    };

    let current = -1;
    const sync = () => {
      const next = chapterAt();
      // React n'est réveillé que lorsque le chapitre change réellement : un
      // défilement continu ne provoque alors aucun rendu superflu.
      if (next !== current) {
        current = next;
        setActiveId(SPECS[next].id);
      }
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  /** Les pilules amènent au chapitre voulu, sur le rail. */
  function goToChapter(index: number) {
    const rail = railRef.current;
    if (!rail) return;

    const runway = rail.offsetHeight - window.innerHeight;
    if (runway <= 0) return;

    window.scrollTo({
      // Au milieu du segment du chapitre, pour ne pas se poser sur une bascule.
      top:
        rail.getBoundingClientRect().top +
        window.scrollY +
        (runway * (index + 0.5)) / SPECS.length,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
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
            ATMOS ONE.
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
            Générateur d&apos;altitude hypoxique.
          </span>
        </motion.h2>

        <motion.p
          variants={rise}
          className="mt-6 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty"
        >
          {
            "ATMOS ONE sépare l'azote de l'oxygène pour abaisser la fraction d'oxygène de 20,9 % à 9 %, soit n'importe quel palier entre le niveau de la mer et 6 500 mètres. Un seul appareil, piloté depuis une station unique."
          }
        </motion.p>
      </motion.div>

      {/*
        Le rail donne la distance de défilement de la scène épinglée : trois
        fenêtres pour quatre chapitres, soit une demi-fenêtre chacun une fois
        l'entrée et la sortie déduites. C'est le prix de l'effet — épingler
        suppose du défilement à consommer — et une demi-fenêtre par chapitre
        est le compromis entre une bascule trop nerveuse et un défilement qui
        s'éternise.

        Le rail ne s'applique qu'au-dessus de `lg` : épingler sur téléphone
        produirait un long défilement mort, où l'on pousse l'écran sans que
        rien n'avance.
      */}
      <div ref={railRef} className="mt-16 lg:h-[300vh]">
        <div className="lg:sticky lg:top-24 lg:flex lg:h-[calc(100vh-6rem)] lg:items-center">
          <div className="grid w-full items-start gap-12 lg:grid-cols-2 lg:gap-20">
            {/* ── Visuel : l'unité et sa lecture temps réel ─────────────── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 1.1, ease: EASE }}
              className="relative mx-auto w-full max-w-md lg:sticky lg:top-28 lg:self-start"
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
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]"
                    />
                    <span className="text-[0.6rem] font-light tracking-[0.18em] text-white/45 uppercase">
                      En service
                    </span>
                  </span>
                </div>

                {/*
              Le cliché est sur fond noir opaque (aucune transparence, pourtour
              mesuré à 5/255). Deux traitements se cumulent pour effacer ce
              fond : `screen`, qui laisse le support inchangé là où l'image est
              noire, et un masque radial qui estompe les bords — ce dernier
              reste valable même si le `backdrop-blur` du panneau isole le
              mélange dans son propre contexte d'empilement.
            */}
                <div className="relative mt-6 aspect-square w-full">
                  <motion.div
                    aria-hidden
                    animate={{
                      opacity: [0.35, 0.6, 0.35],
                      scale: [0.96, 1.03, 0.96],
                    }}
                    transition={{
                      duration: 9,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="pointer-events-none absolute inset-[12%] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.14),transparent_70%)]"
                  />

                  <Image
                    src="/generator.png"
                    alt="Le générateur ATMOS ONE, vu de face : écran de contrôle, sortie hypoxique et débitmètre."
                    width={1024}
                    height={1024}
                    sizes="(min-width: 1024px) 28rem, (min-width: 640px) 60vw, 85vw"
                    className="relative h-full w-full object-contain mix-blend-screen [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_95%)]"
                  />
                </div>

                {/* Lecture de la mesure sélectionnée */}
                <div className="mt-6 border-t border-white/[0.07] pt-6">
                  <div className="flex min-h-[3.25rem] items-baseline justify-between gap-4">
                    <AnimatePresence mode="wait">
                      <motion.div key={active.id} {...swap}>
                        <div className="text-2xl font-medium tracking-tight text-white sm:text-3xl">
                          {active.metric}
                        </div>
                        <div className="mt-1.5 text-[0.62rem] font-light tracking-[0.2em] text-white/45 uppercase">
                          {active.metricLabel}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Jauge : conserve le lien visuel entre les pilules et l'unité */}
                  <div className="mt-5 h-px w-full bg-white/[0.09]">
                    <motion.div
                      initial={false}
                      animate={{ scaleX: active.ratio }}
                      transition={{ duration: 1.1, ease: EASE }}
                      className="h-px w-full origin-left bg-gradient-to-r from-cyan-300 to-blue-500"
                    />
                  </div>
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
              <nav aria-label="Caractéristiques du générateur">
                <ul className="flex flex-wrap gap-2.5">
                  {SPECS.map((spec) => {
                    const Icon = spec.icon;
                    const isActive = spec.id === active.id;

                    return (
                      <li key={spec.id}>
                        <button
                          type="button"
                          onClick={() => goToChapter(SPECS.indexOf(spec))}
                          aria-current={isActive ? "true" : undefined}
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
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/*
            Les quatre chapitres occupent le même emplacement sur grand écran.

            Empilés sous `lg`, ils se superposent au-dessus : chacun est calé
            sur la même case et seul le chapitre courant est opaque. C'est ce
            qui donne la substitution sur place — le texte change, la mise en
            page ne bouge pas d'un pixel.

            Chacun porte sa propre mesure sous `lg`, où la carte n'est pas
            épinglée et sort du champ. Au-dessus, cette mesure est masquée :
            c'est la carte, restée à l'écran, qui l'affiche.
          */}
              <div className="mt-10 flex flex-col border-t border-white/[0.07] lg:relative lg:mt-9 lg:block lg:min-h-[15rem] lg:border-t-0">
                {SPECS.map((spec) => (
                  <div
                    key={spec.id}
                    aria-hidden={spec.id !== active.id ? "true" : undefined}
                    className={`border-b border-white/[0.06] py-7 last:border-b-0 lg:absolute lg:inset-x-0 lg:top-0 lg:border-b-0 lg:py-0 lg:transition-opacity lg:duration-500 ${
                      spec.id === active.id
                        ? "lg:opacity-100"
                        : "lg:pointer-events-none lg:opacity-0"
                    }`}
                  >
                    <div className="text-[0.62rem] font-medium tracking-[0.2em] text-cyan-300/60 uppercase lg:hidden">
                      {spec.metric} · {spec.metricLabel}
                    </div>

                    <h3 className="mt-2.5 text-xl font-medium tracking-tight text-white text-balance sm:text-2xl lg:mt-0 lg:text-3xl">
                      {spec.title}
                    </h3>

                    <p className="mt-3 max-w-lg text-[0.92rem] leading-relaxed font-light text-white/55 text-pretty lg:mt-5 lg:text-[1rem]">
                      {spec.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Fiche technique ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mt-20 border-t border-white/[0.07] pt-8"
      >
        {/*
          Repliée par défaut, en `<details>` natif.

          Elle rassure l'acheteur technique mais ne vend rien : personne ne
          commande pour des dimensions en millimètres. Déployée, elle coûtait à
          elle seule un écran entier de défilement sur téléphone, entre la
          présentation du produit et les offres.

          `<details>` plutôt qu'un état React : aucun script à hydrater, le
          contenu reste dans le DOM — donc indexé — et le repli fonctionne même
          si le JavaScript échoue.
        */}
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-2 [&::-webkit-details-marker]:hidden">
            <span className="text-[0.64rem] font-medium tracking-[0.24em] text-white/40 uppercase transition-colors group-hover:text-white/70">
              Fiche technique
            </span>

            <span className="flex shrink-0 items-center gap-2.5 text-[0.75rem] font-light text-white/35 transition-colors group-hover:text-white/60">
              <span className="group-open:hidden">Afficher</span>
              <span className="hidden group-open:inline">Masquer</span>
              {/*
                Deux icônes plutôt qu'une rotation : `group-open:rotate-180`
                ne produit aucune règle applicable dans cette version de
                Tailwind — la propriété `rotate` reste à 0 alors même que le
                sélecteur correspond. Le masquage conditionnel, lui, fonctionne.
              */}
              <ChevronDown
                className="h-4 w-4 group-open:hidden"
                strokeWidth={1.6}
              />
              <ChevronUp
                className="hidden h-4 w-4 group-open:block"
                strokeWidth={1.6}
              />
            </span>
          </summary>

          <dl className="mt-6 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
            {DATASHEET.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-5 border-t border-white/[0.06] py-3.5"
              >
                <dt className="shrink-0 text-[0.7rem] font-light tracking-[0.14em] text-white/35 uppercase">
                  {row.label}
                </dt>
                <dd className="text-right text-[0.88rem] font-light text-white/80 text-pretty">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      </motion.div>
    </section>
  );
}
