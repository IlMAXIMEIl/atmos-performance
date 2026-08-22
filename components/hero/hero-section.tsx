"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Gauge } from "lucide-react";

import { SkyCanvas } from "@/components/hero/sky-canvas";
import { REVEAL_EASE } from "@/components/scroll-reveal";
import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  MAX_ALTITUDE,
  MIN_FIO2,
  SEA_LEVEL_FIO2,
  formatDecimal,
  formatNumber,
} from "@/lib/altitude";
import { DROP_NAME, DROP_UNITS, WAITLIST_CTA } from "@/lib/offering";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Réassurance sous le hero.
 *
 * Ces trois chiffres viennent des constantes du produit, pas du texte : le
 * plafond et les bornes de FiO₂ affichés ici sont exactement ceux que le
 * simulateur applique. Un jour où `MAX_ALTITUDE` bouge, cette ligne bouge.
 */
const METRICS = [
  {
    value: `Jusqu'à ${formatNumber(MAX_ALTITUDE)} m`,
    label: "d'altitude simulée",
  },
  {
    value: `${formatDecimal(MIN_FIO2)} % à ${formatDecimal(SEA_LEVEL_FIO2)} % O₂`,
    label: "réglable au mètre près",
  },
  {
    value: `${DROP_NAME} · ${DROP_UNITS} unités`,
    label: "paiement en 3x ou 4x disponible",
  },
];

/**
 * Hero de la page d'accueil : ciel peint au canvas, titre en volets masqués,
 * parallaxe au départ du défilement.
 *
 * La section revendique ses entrées (`data-reveal-scope`) : elles jouent au
 * chargement, en cascade, alors que le moteur global de `ScrollRevealController`
 * attend qu'un bloc entre dans le champ. Sans cette marque, les deux
 * animeraient les mêmes éléments.
 */
export function HeroSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia(root);

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-reveal]", { opacity: 1, y: 0 });
        gsap.set("[data-reveal-line] > *", { yPercent: 0 });
      });

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({
          defaults: { duration: 0.9, ease: REVEAL_EASE },
        });

        intro
          // Surtitre, accroche, boutons, bandeau de pied : même mouvement,
          // décalés dans l'ordre du document.
          .fromTo(
            "[data-reveal]",
            { y: 22 },
            { opacity: 1, y: 0, stagger: 0.24 },
            0.1,
          )
          // Le titre part pendant que le surtitre finit d'arriver.
          .fromTo(
            "[data-reveal-line] > *",
            { yPercent: 105 },
            { yPercent: 0, duration: 1.15, ease: "power4.out", stagger: 0.09 },
            0.22,
          );

        // Parallaxe : le texte s'enfonce et s'efface, le ciel suit de plus
        // loin. `scrub` accroche l'avancement au défilement lui-même — la
        // scène n'a pas de durée propre, elle a une course.
        const parallax = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        parallax
          .to("[data-hero-inner]", { yPercent: 14, ease: "none", duration: 1 }, 0)
          .to(
            "[data-hero-inner]",
            { opacity: 0, ease: "none", duration: 0.72 },
            0,
          )
          .to("[data-hero-sky]", { yPercent: 6, ease: "none", duration: 1 }, 0);
      });

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <>
      <section
        ref={root}
        data-reveal-scope
        aria-labelledby="hero-titre"
        className="relative isolate flex min-h-[max(34rem,calc(100svh-9rem))] flex-col overflow-hidden"
      >
        <div data-hero-sky className="absolute inset-0 -z-10 scale-110">
          <SkyCanvas />
        </div>

        {/* Voile : remonte l'accent depuis l'horizon et éteint le haut et le
            bas de l'image pour que le texte tienne sans caisson. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_78%_at_50%_118%,rgba(59,158,255,0.2),transparent_62%),linear-gradient(180deg,rgba(4,7,13,0.62),transparent_34%,rgba(4,7,13,0.9))]"
        />

        <div className="mx-auto flex w-full max-w-[1240px] flex-1 items-center px-6 py-16 lg:px-10">
          <div
            data-hero-inner
            className="flex w-full flex-col items-start gap-6"
          >
            <Eyebrow data-reveal>
              {`Édition de lancement — ${DROP_NAME}`}
            </Eyebrow>

            {/* Volets masqués : chaque ligne est rognée par son parent et
                glisse depuis le bas. Le texte reste une seule phrase pour
                les lecteurs d'écran. */}
            <h1
              id="hero-titre"
              className="max-w-[26ch] text-[clamp(2.3rem,5.2vw,4.4rem)] leading-[1] font-semibold tracking-[-0.035em] text-ink"
            >
              <span data-reveal-line>
                <span>{"Dominez l'altitude."}</span>
              </span>
              <span data-reveal-line>
                <span className="text-accent">Sans quitter votre chambre.</span>
              </span>
            </h1>

            <p
              data-reveal
              className="max-w-[34em] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-[1.6] text-dim text-pretty"
            >
              {`Le générateur d'altitude hypoxique ATMOS ONE reproduit jusqu'à ${formatNumber(MAX_ALTITUDE)} mètres chez vous. Travaillez votre VO2max et préparez vos acclimatations, nuit après nuit ou séance après séance.`}
            </p>

            <div
              data-reveal
              className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap"
            >
              <ButtonLink href="#offres">
                {WAITLIST_CTA}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </ButtonLink>
              <ButtonLink href="#produit" variant="ghost">
                <Gauge className="h-4 w-4 text-accent" />
                Découvrir le générateur
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* Bandeau de pied de hero : les repères techniques d'un côté, l'état
            du lancement de l'autre, l'invitation à défiler au milieu. */}
        <div
          data-reveal
          className="mx-auto flex w-full max-w-[1240px] items-end justify-center gap-4 px-6 pb-8 font-mono text-[0.64rem] tracking-[0.17em] text-dimmer uppercase sm:justify-between lg:px-10"
        >
          <p className="hidden leading-[1.7] sm:block">
            Hypoxie normobare
            <br />
            {`${formatDecimal(SEA_LEVEL_FIO2)} % → ${formatDecimal(MIN_FIO2)} % d'O₂ inspiré`}
          </p>

          <span aria-hidden className="flex flex-col items-center gap-1.5">
            Défiler
            <span className="h-8 w-px animate-[hero-cue_2.1s_ease-in-out_infinite] bg-gradient-to-b from-accent to-transparent motion-reduce:animate-none" />
          </span>

          <p className="hidden text-right leading-[1.7] sm:block">
            {`Plafond ${formatNumber(MAX_ALTITUDE)} m`}
            <br />
            Livraison France · Europe
          </p>
        </div>
      </section>

      {/* Hors de la scène du hero : ces chiffres relèvent du moteur global de
          révélation, comme toutes les sections qui suivront. */}
      <div className="mx-auto w-full max-w-[1240px] px-6 lg:px-10">
        <dl
          data-reveal
          className="grid grid-cols-1 divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          {METRICS.map(({ value, label }) => (
            <div key={value} className="flex flex-col gap-1.5 px-5 py-6">
              <dt className="font-mono text-sm tracking-[0.02em] text-ink">
                {value}
              </dt>
              <dd className="text-[0.72rem] leading-[1.5] tracking-[0.1em] text-dimmer uppercase">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
