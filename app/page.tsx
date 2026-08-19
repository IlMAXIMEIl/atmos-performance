"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Gauge,
  Menu,
  Mountain,
  RefreshCw,
  Wind,
  X,
} from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { FAQ, FaqSection } from "@/components/faq-section";
import { NextProductSection } from "@/components/next-product-section";
import { OffersSection } from "@/components/offers-section";
import { ProductSection } from "@/components/product-section";
import { ProtocolsSection } from "@/components/protocols-section";
import { ScienceSection } from "@/components/science-section";
import { SiteFooter } from "@/components/site-footer";
import { BATCH_NAME, BATCH_UNITS, WAITLIST_CTA_SHORT } from "@/lib/offering";
import { EASE, container, rise } from "@/lib/motion";
import { faqPageSchema, productSchema } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

/**
 * Navigation principale, tenue au strict nécessaire.
 *
 * Le parcours d'achat se joue sur trois entrées : ce qu'est l'appareil, ce
 * qu'on en fait, et l'outil qui le prouve. Les offres sont portées par le
 * bouton d'appel, toujours visible — les y remettre en lien ferait doublon.
 * Tout le reste — blog, glossaire, à propos, mentions — vit dans le pied de
 * page : accessible à qui le cherche, invisible pour qui ne le cherche pas.
 */
const NAV_LINKS = [
  { label: "Produit", href: "#produit" },
  { label: "Protocoles", href: "#protocoles" },
  { label: "Simulateur", href: "/outils/simulateur-altitude" },
];

const METRICS = [
  { icon: Mountain, value: "Jusqu'à 6 500 m", label: "d'altitude simulée" },
  { icon: Wind, value: "9 % à 20,9 % O₂", label: "réglable au mètre près" },
  {
    icon: RefreshCw,
    value: `${BATCH_NAME} · ${BATCH_UNITS} unités`,
    label: "paiement en 3x ou 4x disponible",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0B0C10] font-[family-name:var(--font-geist-sans)] text-white selection:bg-cyan-400/25">
      {/* Le générateur et les questions fréquentes, tels que cette page les
          présente. `FAQ` est le tableau qui alimente l'accordéon plus bas :
          balisage et affichage sortent de la même source. */}
      <JsonLd data={[productSchema(), faqPageSchema(FAQ, SITE_URL)]} />

      {/* ── Atmosphère lumineuse ─────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Halo principal cyan, très diffus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.2, ease: EASE }}
          className="absolute left-1/2 top-[-30%] h-[70rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.16),rgba(37,99,235,0.06)_38%,transparent_68%)] blur-[2px]"
        />
        {/* Respiration lente : rappel du cycle d'exposition à l'altitude */}
        <motion.div
          animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.06, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-[-10%] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.14),transparent_65%)]"
        />
        {/* Voile bleu froid en bas de page */}
        <div className="absolute inset-x-0 bottom-0 h-[26rem] bg-[radial-gradient(ellipse_at_bottom,rgba(30,64,175,0.18),transparent_70%)]" />
        {/* Grille technique */}
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_35%,black,transparent)]" />
        {/* Vignettage */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(9,10,15,0.85)_100%)]" />
      </div>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-30 mx-auto w-full max-w-7xl px-6 py-6 lg:px-10"
      >
        <nav className="flex items-center justify-between">
          <a
            href="#"
            className="text-[1.05rem] font-medium tracking-[0.42em] text-white/95 transition-colors hover:text-white"
          >
            ATMOS
          </a>

          <div className="hidden items-center gap-6 lg:flex xl:gap-10">
            {NAV_LINKS.map((link) => {
              // Les ancres restent de simples <a> ; les routes passent par
              // <Link> pour bénéficier de la navigation client.
              const Tag = link.href.startsWith("/") ? Link : "a";
              return (
                <Tag
                  key={link.label}
                  href={link.href}
                  className="group relative text-[0.8rem] font-light tracking-[0.16em] text-white/55 uppercase transition-colors duration-300 hover:text-white"
                >
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gradient-to-r from-cyan-300 to-transparent transition-all duration-300 group-hover:w-full" />
                </Tag>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#offres"
              className="hidden rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-[0.78rem] font-medium tracking-[0.14em] text-white/90 uppercase backdrop-blur-md transition-all duration-300 hover:border-cyan-300/40 hover:bg-white/[0.08] hover:text-white sm:inline-block"
            >
              {WAITLIST_CTA_SHORT}
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              className="rounded-full border border-white/10 p-2.5 text-white/70 transition-colors hover:text-white lg:hidden"
            >
              {menuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden lg:hidden"
            >
              <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6">
                {NAV_LINKS.map((link) => {
                  const Tag = link.href.startsWith("/") ? Link : "a";
                  return (
                    <Tag
                      key={link.label}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-light tracking-[0.16em] text-white/65 uppercase"
                    >
                      {link.label}
                    </Tag>
                  );
                })}
                <a
                  href="#offres"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 text-sm font-medium tracking-[0.16em] text-cyan-200 uppercase sm:hidden"
                >
                  {WAITLIST_CTA_SHORT}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="relative z-20">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-16 pb-20 text-center sm:pt-24 lg:pt-28"
        >
          {/* Badge de lancement */}
          <motion.div variants={rise}>
            <div className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-cyan-300/25 bg-cyan-400/[0.06] px-4 py-1.5 backdrop-blur-md">
              <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.22),transparent_70%)] opacity-70" />
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_2px_rgba(34,211,238,0.8)]" />
              </span>
              <span className="text-[0.68rem] font-medium tracking-[0.2em] text-cyan-100/90 uppercase">
                {`Édition de Lancement • ${BATCH_NAME} • ${BATCH_UNITS} unités`}
              </span>
            </div>
          </motion.div>

          {/* Titre principal */}
          <motion.h1
            variants={rise}
            className="mt-9 text-[2.1rem] leading-[1.05] font-medium tracking-[-0.035em] text-balance sm:text-6xl sm:leading-[1.02] lg:text-[5.1rem]"
          >
            <span className="block bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent">
              {"Dominez l'Altitude."}
            </span>
            <span className="mt-1.5 block bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              Sans quitter votre chambre.
            </span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            variants={rise}
            className="mt-8 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty sm:text-lg"
          >
            {
              "Le générateur d'altitude hypoxique ATMOS ONE reproduit jusqu'à 6 500 mètres chez vous. Travaillez votre VO2max et préparez vos acclimatations, nuit après nuit ou séance après séance."
            }
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={rise}
            className="mt-11 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row"
          >
            <a
              href="#offres"
              className="group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 px-8 py-4 text-sm font-semibold tracking-[0.04em] text-[#04070D] shadow-[0_0_36px_-6px_rgba(56,189,248,0.65)] transition-all duration-300 hover:shadow-[0_0_54px_-4px_rgba(56,189,248,0.9)] sm:w-auto"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
              <span className="relative">Rejoindre la liste prioritaire</span>
              <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <a
              href="#produit"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/15 bg-white/[0.03] px-8 py-4 text-sm font-medium tracking-[0.04em] text-white/85 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.07] hover:text-white sm:w-auto"
            >
              <Gauge className="h-4 w-4 text-cyan-300/80" />
              Découvrir le générateur
            </a>
          </motion.div>

          {/* Réassurance */}
          <motion.div
            variants={rise}
            className="mt-20 w-full max-w-3xl border-t border-white/[0.07] pt-8"
          >
            <dl className="grid grid-cols-1 divide-y divide-white/[0.07] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {METRICS.map(({ icon: Icon, value, label }) => (
                <div
                  key={value}
                  className="flex flex-col items-center gap-1.5 px-4 py-5 sm:py-2"
                >
                  <Icon
                    className="mb-1 h-4 w-4 text-cyan-300/70"
                    strokeWidth={1.5}
                  />
                  <dt className="text-sm font-medium tracking-tight text-white/90">
                    {value}
                  </dt>
                  <dd className="text-[0.7rem] font-light tracking-[0.12em] text-white/40 uppercase">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </motion.section>

        {/* ── Section Produit ──────────────────────────────────────────── */}
        <ProductSection />

        {/* ── Section Protocoles ───────────────────────────────────────── */}
        <ProtocolsSection />

        {/*
          Le prix arrive ici, et pas trois sections plus bas.

          À ce point le visiteur sait ce qu'est l'appareil et ce qu'on en fait :
          il a de quoi vouloir le tarif. Le laisser descendre encore trois
          écrans avant de le lui montrer ne le convainc pas davantage, ça
          l'épuise. Ce qui vient après — la gamme, la science, la FAQ — sert
          celui qui hésite encore, pas celui qui est déjà décidé.
        */}
        <OffersSection />

        {/*
          La gamme, juste après le prix.

          Elle répond au doute qui suit précisément l'annonce d'un tarif chez
          une marque qu'on ne connaît pas : est-ce une maison qui construit une
          gamme, ou un produit isolé ?
        */}
        <NextProductSection />

        {/* ── Section Science ──────────────────────────────────────────── */}
        <ScienceSection />

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <FaqSection />
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
}
