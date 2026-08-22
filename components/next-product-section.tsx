"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { container, rise } from "@/lib/motion";
import { DROP_NAME } from "@/lib/offering";

/**
 * Le second appareil de la gamme.
 *
 * Sorti de la section Offres pour deux raisons. Il s'y intercalait entre le
 * prix et la FAQ, interrompant le parcours d'achat par un produit qu'on ne
 * peut pas commander. Et surtout, placé **avant** le tarif, il fait son
 * travail : il pose une gamme, de sorte que 1 890 € se lise comme une entrée
 * dans une gamme plutôt que comme un achat isolé.
 *
 * Un teaser, pas une fiche : aucune caractéristique technique, aucune date,
 * aucune promesse d'efficacité. La littérature sur l'hyperbarie de faible
 * pression appliquée à la récupération sportive est bien plus mince que celle
 * de l'hypoxie — annoncer un bénéfice ici contredirait la ligne que tient le
 * reste du site. On annonce une direction, on ne vend rien.
 */
const PILLARS = [
  {
    label: "Hypoxie",
    detail:
      "Raréfier l'oxygène pour imposer la contrainte et déclencher l'adaptation. C'est ATMOS ONE.",
  },
  {
    label: "Hyperbarie",
    detail:
      "Augmenter la pression pour travailler l'autre versant du cycle, celui du retour au calme.",
  },
  {
    label: "Même exigence",
    detail:
      "Aucune recommandation qui ne s'appuie sur la littérature — y compris quand elle est moins généreuse que le discours ambiant.",
  },
];

export function NextProductSection() {
  return (
    <section
      id="gamme"
      aria-labelledby="gamme-titre"
      className="relative z-20 mx-auto w-full max-w-7xl scroll-mt-24 px-6 py-24 sm:py-28 lg:px-10"
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="relative overflow-hidden rounded-xl border border-line bg-gradient-to-b from-white/[0.05] to-white/[0.01] px-8 py-14 backdrop-blur-xl sm:px-12 sm:py-16 lg:px-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_at_50%_100%,rgb(255_233_199/0.1),transparent_70%)]"
        />

        <div className="relative">
          <motion.span
            variants={rise}
            className="font-mono inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1 text-[0.6rem] tracking-[0.24em] text-dim uppercase"
          >
            <Sparkles
              className="h-3 w-3 text-warm/80"
              strokeWidth={1.5}
            />
            La gamme
          </motion.span>

          <motion.h2
            variants={rise}
            id="gamme-titre"
            className="mt-7 max-w-3xl text-[1.85rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl"
          >
            <span className="text-ink">
              ATMOS ONE n&apos;est pas un appareil isolé.
            </span>{" "}
            <span className="text-accent">
              ATMOS Chamber suivra.
            </span>
          </motion.h2>

          <motion.p
            variants={rise}
            className="mt-7 max-w-2xl text-base leading-relaxed font-light text-dim text-pretty"
          >
            {
              "Le second appareil de la gamme sera un caisson hyperbare. L'altitude raréfie l'oxygène pour déclencher l'adaptation ; la pression fait le chemin inverse. Deux directions opposées, un même cycle d'entraînement."
            }
          </motion.p>

          <motion.dl
            variants={container}
            className="mt-12 grid max-w-4xl gap-8 border-t border-line pt-10 sm:grid-cols-3 sm:gap-10"
          >
            {PILLARS.map(({ label, detail }) => (
              <motion.div key={label} variants={rise}>
                <dt className="text-[0.62rem] font-medium tracking-[0.2em] text-dim uppercase">
                  {label}
                </dt>
                <dd className="mt-3 text-[0.88rem] leading-relaxed font-light text-dim text-pretty">
                  {detail}
                </dd>
              </motion.div>
            ))}
          </motion.dl>

          <motion.p
            variants={rise}
            className="mt-10 max-w-2xl text-[0.8rem] leading-relaxed font-light text-dimmer text-pretty"
          >
            {`Ni date, ni précommande pour l'instant. Les inscrits du ${DROP_NAME} seront prévenus les premiers.`}
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
