"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { BATCH_NAME, BATCH_SCARCITY, INSTALLMENTS_NOTE } from "@/lib/offering";
import { EASE, container, rise } from "@/lib/motion";
import type { FaqEntry } from "@/lib/structured-data";

/**
 * Structure modulaire : pour modifier la FAQ, il suffit d'éditer ce tableau.
 * Chaque réponse est un tableau de paragraphes, ce qui évite d'injecter du
 * balisage tout en autorisant des réponses longues.
 *
 * Exporté : `app/page.tsx` en dérive le balisage `FAQPage`. Les deux ne
 * peuvent donc pas diverger, ce que Google exige — un balisage qui annonce
 * une réponse absente de la page est un motif de sanction.
 */
export const FAQ: FaqEntry[] = [
  {
    question: "Faut-il un avis médical avant de commencer ?",
    answer: [
      "Oui en cas de pathologie cardiaque ou respiratoire, de grossesse, ou de traitement en cours. L'exposition à l'hypoxie est une contrainte physiologique réelle, et son intérêt suppose qu'elle soit adaptée à votre situation.",
      "Un bilan de ferritine est par ailleurs recommandé avant de démarrer : sans réserves de fer suffisantes, l'adaptation attendue ne se met pas en place.",
    ],
  },
  {
    question: "Au bout de combien de temps voit-on des effets ?",
    answer: [
      "Les premières adaptations mesurables demandent généralement trois semaines d'exposition régulière. La régularité compte davantage que l'altitude atteinte : quelques nuits isolées à un palier élevé produisent moins qu'une exposition quotidienne modérée.",
      "La réponse varie fortement d'une personne à l'autre. C'est pourquoi les paliers se règlent séance après séance plutôt qu'une fois pour toutes.",
    ],
  },
  {
    question: "Tente d'altitude ou masque : que choisir ?",
    answer: [
      "Les deux, mais pas pour la même chose. La tente sert l'exposition longue et modérée : 8 à 10 heures par nuit entre 2 000 et 3 500 mètres, pendant que vous dormez. C'est la voie de l'acclimatation, celle qui ne coûte aucun temps de journée.",
      "Le masque sert l'exposition courte et forte : 20 à 60 minutes entre 4 000 et 6 000 mètres, par cycles alternés, au repos ou sur home-trainer. C'est la voie du travail ventilatoire et de la VO2max.",
      "Le même générateur alimente les deux. La question n'est donc pas laquelle acheter, mais laquelle programmer selon la semaine.",
    ],
  },
  {
    question: "L'appareil est-il bruyant pour une utilisation nocturne ?",
    answer: [
      "Le niveau sonore est inférieur ou égal à 50 dB, l'ordre de grandeur d'un réfrigérateur. Pour les nuits sous tente, l'unité se place généralement hors de la chambre, reliée au circuit respiratoire.",
    ],
  },
  {
    question: "Quelle différence avec un caisson hyperbare ?",
    answer: [
      "Ce sont deux appareils opposés. ATMOS ONE raréfie l'oxygène pour simuler l'altitude et provoquer une adaptation à l'effort. Un caisson hyperbare fait l'inverse : il augmente la pression et l'apport d'oxygène.",
      "ATMOS ONE ne produit pas d'air enrichi et n'a aucune fonction hyperbare.",
    ],
  },
  {
    question: "Que comprend la livraison ?",
    answer: [
      "Le générateur ATMOS ONE, le masque et son circuit respiratoire, la station de contrôle, les protocoles guidés Live High et Train High, ainsi qu'un accompagnement au démarrage.",
      "L'oxymètre de pouls et le système de monitoring sont proposés en option.",
    ],
  },
  {
    question: "Comment se passe la précommande ?",
    answer: [
      `En quatre temps. Vous vous inscrivez d'abord sur la liste prioritaire, sans engagement et sans paiement. Vous recevez ensuite un accès exclusif à l'ouverture du ${BATCH_NAME}, dont les stocks sont très limités. Le paiement sécurisé — au comptant ou fractionné — n'intervient qu'à cette ouverture. La fabrication et l'expédition directe suivent.`,
      `L'édition de lancement est une série fermée : ${BATCH_SCARCITY.toLowerCase()}. Passé ce volume, les commandes basculent sur la série suivante.`,
      `${INSTALLMENTS_NOTE}. Le paiement est traité par Stripe : aucune coordonnée bancaire ne transite par ce site.`,
    ],
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-labelledby="faq-titre"
      className="relative z-20 mx-auto w-full max-w-4xl scroll-mt-24 px-6 py-24 sm:py-32 lg:px-10"
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="text-center"
      >
        <motion.span
          variants={rise}
          className="block text-[0.68rem] font-medium tracking-[0.28em] text-cyan-300/70 uppercase"
        >
          Questions fréquentes
        </motion.span>

        <motion.h2
          variants={rise}
          id="faq-titre"
          className="mt-5 text-[1.85rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl"
        >
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Ce qu&apos;on nous demande
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
            le plus souvent.
          </span>
        </motion.h2>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="mt-14 flex flex-col gap-3"
      >
        {FAQ.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <motion.div
              key={item.question}
              variants={rise}
              className={`overflow-hidden rounded-[1.5rem] border transition-colors duration-500 ${
                isOpen
                  ? "border-cyan-300/25 bg-white/[0.04]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <h3>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-reponse-${index}`}
                  id={`faq-question-${index}`}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:outline-none sm:px-7 sm:py-6"
                >
                  <span
                    className={`text-[0.98rem] font-medium tracking-tight text-pretty transition-colors duration-300 sm:text-[1.05rem] ${
                      isOpen ? "text-white" : "text-white/80"
                    }`}
                  >
                    {item.question}
                  </span>

                  <motion.span
                    aria-hidden
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                      isOpen
                        ? "border-cyan-300/40 text-cyan-200"
                        : "border-white/12 text-white/40"
                    }`}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.6} />
                  </motion.span>
                </button>
              </h3>

              {/*
                La réponse reste montée en permanence, repliée par sa hauteur,
                au lieu d'être démontée à la fermeture. Sans cela, une seule
                réponse figurerait dans le HTML servi et le balisage `FAQPage`
                annoncerait cinq réponses introuvables sur la page.

                `initial={false}` fait démarrer l'élément à son état replié
                sans l'animer : pas de dépliage parasite au chargement.
                `inert` le sort du parcours clavier et de l'arbre
                d'accessibilité tant qu'il est fermé, sans le retirer du HTML.
              */}
              <motion.div
                id={`faq-reponse-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                inert={!isOpen}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-4 px-6 pb-6 sm:px-7 sm:pb-7">
                  {item.answer.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="max-w-2xl text-[0.92rem] leading-relaxed font-light text-white/50 text-pretty"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
