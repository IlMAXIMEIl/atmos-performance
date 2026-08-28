import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

import { AltitudeSimulator } from "@/components/altitude-simulator";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrackerInvitation } from "@/components/tracker-invitation";
import {
  MAX_ALTITUDE,
  fio2AtAltitude,
  formatDecimal,
  formatNumber,
  landmarkFor,
} from "@/lib/altitude";
import { getPost } from "@/lib/posts";
import {
  ORGANIZATION_ID,
  breadcrumbSchema,
  faqPageSchema,
} from "@/lib/structured-data";
import { TOOLS_PATH } from "@/lib/tools";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = `${TOOLS_PATH}/simulateur-altitude`;
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;

const TITLE = "Simulateur d'altitude et calculateur d'hypoxie";
/** 154 caractères : au-delà de ~160, Google tronque l'extrait affiché. */
const DESCRIPTION =
  "Simulateur et calculateur d'entraînement en altitude et hypoxie : protocole personnalisé en 2 questions, conversion FiO₂ ↔ altitude et comparatif de coût.";

export const metadata: Metadata = {
  title: `${TITLE} — ATMOS`,
  description: DESCRIPTION,
  keywords: [
    "simulateur altitude",
    "calculateur hypoxie",
    "conversion FiO2 altitude",
    "protocole hypoxie intermittente",
    "entraînement en altitude",
    "altitude simulée",
    "générateur d'hypoxie",
    "SpO2 hypoxie",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: `${TITLE} — ATMOS`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} — ATMOS`,
    description: DESCRIPTION,
  },
};

/** Paliers repris dans la table de correspondance. */
const TABLE_ALTITUDES = [
  0, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500,
];

/** Reprises telles quelles dans le JSON-LD `FAQPage`. */
const FAQ = [
  {
    question: "Comment convertir une FiO₂ en altitude simulée ?",
    answer:
      "Un générateur d'hypoxie normobare ne modifie pas la pression atmosphérique : il abaisse la fraction d'oxygène de l'air inspiré. L'équivalence se calcule en comparant la pression partielle d'oxygène obtenue à celle qui règne en altitude réelle, selon l'atmosphère standard. Sur cette base, 16,4 % d'oxygène équivalent à 2 000 mètres, 14,5 % à 3 000 mètres et 12,7 % à 4 000 mètres. Le convertisseur de cette page applique exactement ce modèle, dans les deux sens.",
  },
  {
    question: "Quelle altitude simulée choisir pour débuter ?",
    answer:
      "Entre 2 000 et 3 000 mètres pour les premières séances à l'effort, soit 16,4 % à 14,5 % d'oxygène ; entre 3 200 et 3 800 mètres si la séance se fait au repos complet, l'organisme y étant beaucoup moins sollicité. L'objectif des deux premières semaines n'est pas la performance mais l'observation : on vérifie la tolérance, la vitesse à laquelle la saturation descend et le temps qu'elle met à remonter. Le palier de croisière ne se fixe qu'ensuite, à l'oxymètre.",
  },
  {
    question:
      "Quelle saturation en oxygène viser pendant une séance d'hypoxie ?",
    answer:
      "La cible dépend de ce que vous faites pendant l'exposition, pas de votre niveau. En conditionnement modéré à l'effort, on vise 91 à 94 %. En entraînement hypoxique (IHT), marche ou home-trainer, 84 à 88 %. En exposition passive au repos (IHE), la cible descend à 78 à 82 % — mais uniquement immobile, jamais en marchant ni en parlant. Sous tente la nuit, la moyenne nocturne doit rester entre 88 et 92 %. Le seuil d'arrêt suit la même logique : 80 % à l'effort, 75 % au repos strict, et 85 % de moyenne nocturne imposent de redescendre le palier de sommeil. C'est la saturation mesurée qui commande le réglage de l'appareil, jamais l'inverse : deux personnes au même palier n'auront pas la même SpO₂.",
  },
  {
    question: "Combien de séances par semaine pour progresser ?",
    answer:
      "Trois à cinq séances hebdomadaires sur un cycle de trois à huit semaines, selon l'objectif. En dessous de trois séances, la stimulation est trop diluée pour déclencher une adaptation ; au-delà de cinq, la fatigue accumulée prend le pas sur le bénéfice. Un bloc se termine toujours par deux à trois semaines sans exposition avant d'en relancer un autre.",
  },
  {
    question: "L'hypoxie simulée remplace-t-elle un stage en altitude ?",
    answer:
      "Elle ne le remplace pas à l'identique : un séjour en montagne cumule l'exposition permanente, l'environnement et le contexte de stage. Elle en reproduit en revanche le levier principal — la baisse de la pression partielle d'oxygène — sans les déplacements, et permet de doser précisément le palier séance après séance. Pour beaucoup de pratiquants, c'est la seule manière d'accéder à une exposition régulière tout au long de l'année.",
  },
  {
    question: "Les résultats de ce simulateur sont-ils un avis médical ?",
    answer:
      "Non. Les paramètres proposés sont des points de départ construits sur des repères de littérature, pas une prescription individuelle. Ils doivent être ajustés séance après séance au vu des mesures d'un oxymètre de pouls. Une grossesse, une pathologie cardiaque ou respiratoire, une anémie ou une hypertension non contrôlée imposent un avis médical avant toute exposition à l'hypoxie.",
  },
];

/** Maillage interne : les articles qui prolongent chacun un bloc de l'outil. */
const RELATED_SLUGS = [
  "qu-est-ce-que-l-entrainement-en-hypoxie-guide-complet",
  "securite-saturation-spo2-bonnes-pratiques-hypoxie",
  "stage-altitude-vs-generateur-hypoxie-comparatif",
  "hypoxie-vo2-max-endurance-performance",
];

export default async function SimulateurAltitudePage() {
  // Les articles absents sont simplement ignorés : renommer un slug ne doit pas
  // faire tomber la page de l'outil.
  const related = (
    await Promise.all(RELATED_SLUGS.map((slug) => getPost(slug)))
  ).filter((post) => post !== undefined);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Simulateur d'altitude et calculateur d'hypoxie ATMOS",
      url: PAGE_URL,
      applicationCategory: "HealthApplication",
      operatingSystem: "Tout navigateur web",
      browserRequirements: "JavaScript requis",
      inLanguage: "fr-FR",
      description: DESCRIPTION,
      isAccessibleForFree: true,
      featureList: [
        "Génération d'un protocole d'hypoxie personnalisé en deux questions",
        "Calcul de l'altitude simulée optimale et de la FiO₂ correspondante",
        "Structure de séance : format de cycle, durée, fréquence et durée du bloc",
        "Plage de SpO₂ cible et consignes de sécurité associées",
        "Convertisseur bidirectionnel FiO₂ ↔ altitude simulée",
        "Comparatif de coût entre un stage en altitude et un générateur ATMOS ONE",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
      },
      publisher: { "@id": ORGANIZATION_ID },
    },
    // Les réponses sont dépliables mais toujours présentes dans le HTML servi
    // (`<details>` natifs) : le balisage annonce bien ce que la page contient.
    faqPageSchema(
      FAQ.map((item) => ({ question: item.question, answer: [item.answer] })),
      PAGE_URL,
    ),
    breadcrumbSchema([
      { name: "Accueil", url: SITE_URL },
      { name: "Outils", url: `${SITE_URL}${TOOLS_PATH}` },
      { name: TITLE, url: PAGE_URL },
    ]),
  ];

  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      <JsonLd data={jsonLd} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.13),transparent_70%)]"
      />

      {/* ── En-tête ──────────────────────────────────────────────────── */}
      <SiteHeader maxWidth="max-w-6xl" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 lg:px-10">
        {/* ── Chapeau ────────────────────────────────────────────────── */}
        <div className="pt-10 sm:pt-16">
          <Link
            href={TOOLS_PATH}
            className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-dim transition-colors hover:text-ink"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
              strokeWidth={1.5}
            />
            Tous les outils
          </Link>

          <span className="font-mono mt-10 block text-[0.68rem] tracking-[0.28em] text-accent uppercase">
            Outil gratuit
          </span>

          <h1 className="mt-5 max-w-4xl text-[2rem] leading-[1.08] font-medium tracking-[-0.035em] text-balance sm:text-5xl lg:text-[3.4rem]">
            <span className="text-ink">
              Simulateur d&apos;altitude
            </span>{" "}
            <span className="text-accent">
              et calculateur d&apos;hypoxie.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed font-light text-dim text-pretty sm:text-lg">
            {
              "Deux questions — l'utilisation de l'appareil, votre niveau — suffisent à poser un protocole d'entraînement en hypoxie : le palier d'altitude simulée, la FiO₂ correspondante, la structure des cycles et la plage de saturation à tenir. Le convertisseur et le comparatif de coût suivent."
            }
          </p>
        </div>

        {/* Le pont depuis le QR gravé sur le générateur : n'apparaît que
            pour les visiteurs venus de l'appareil, et côté navigateur
            uniquement — la page reste prérendue. */}
        <div className="mt-10">
          <TrackerInvitation />
        </div>

        {/* ── L'outil ────────────────────────────────────────────────── */}
        <div className="mt-14 sm:mt-16">
          <AltitudeSimulator />
        </div>

        {/* ── Avertissement ──────────────────────────────────────────── */}
        <aside className="mt-8 rounded-xl border border-line bg-white/[0.02] p-6 sm:p-8">
          <h2 className="font-mono text-[0.66rem] tracking-[0.24em] text-dim uppercase">
            Ce que cet outil n&apos;est pas
          </h2>
          <p className="mt-4 text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
            {
              "Les paramètres affichés sont indicatifs. Ils constituent un point de départ raisonnable, construit sur des repères de littérature et sur les plages d'usage de l'ATMOS ONE — en aucun cas une prescription individuelle, et en aucun cas un avis médical."
            }
          </p>
          <p className="mt-4 text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
            {
              "La réponse à l'hypoxie varie fortement d'une personne à l'autre, et chez la même personne d'un jour à l'autre. Un protocole ne se conduit qu'avec un oxymètre de pouls au doigt : c'est la saturation mesurée qui décide du palier, du nombre de cycles et de l'arrêt de la séance. En cas de grossesse, de pathologie cardiaque ou respiratoire, d'anémie ou d'hypertension non contrôlée, un avis médical est requis avant toute exposition."
            }
          </p>
          <Link
            href="/blog/securite-saturation-spo2-bonnes-pratiques-hypoxie"
            className="group mt-6 inline-flex items-center gap-2 text-[0.85rem] font-medium text-accent transition-colors hover:text-accent"
          >
            Sécurité et SpO₂ : les bonnes pratiques en détail
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </aside>

        {/* ── Table de correspondance ────────────────────────────────── */}
        <section
          aria-labelledby="table-titre"
          className="mt-20 scroll-mt-24 sm:mt-24"
        >
          <span className="font-mono block text-[0.68rem] tracking-[0.28em] text-accent uppercase">
            La table
          </span>

          <h2
            id="table-titre"
            className="mt-5 text-[1.6rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-4xl"
          >
            <span className="text-ink">
              Correspondance altitude simulée
            </span>{" "}
            <span className="text-accent">
              et fraction d&apos;oxygène.
            </span>
          </h2>

          <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed font-light text-dim text-pretty">
            {
              "Les valeurs de référence, du niveau de la mer au plafond de l'ATMOS ONE. Elles suivent l'atmosphère standard : c'est la pression partielle d'oxygène qui est mise en correspondance, pas la pression totale."
            }
          </p>

          {/*
            Repliée par défaut.

            Le simulateur au-dessus répond déjà à la question « quelle FiO₂ à
            telle altitude ? », un palier à la fois : dépliée, la table coûtait
            un écran entier de défilement entre le réglage et les questions
            fréquentes, pour une information que le curseur donne mieux.

            Repliée plutôt que supprimée : « correspondance altitude / FiO₂ »
            est une requête en soi, et `<details>` garde le tableau dans le
            HTML servi — donc indexable — sans le faire payer à qui ne le
            cherche pas.
          */}
          <details className="group mt-10">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg border border-line px-6 py-4 transition-colors hover:border-line-strong [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3 font-mono text-[0.72rem] tracking-[0.2em] text-accent uppercase">
                <span className="h-px w-6 flex-none bg-accent" />
                Voir la table complète
              </span>

              <span className="flex shrink-0 items-center gap-2.5 font-mono text-[0.68rem] tracking-[0.14em] text-dimmer uppercase transition-colors group-hover:text-accent">
                <span className="group-open:hidden">Déplier</span>
                <span className="hidden group-open:inline">Replier</span>
                <span className="inline-flex transition-transform duration-300 group-open:rotate-180">
                  <ChevronDown className="h-4 w-4" strokeWidth={1.6} />
                </span>
              </span>
            </summary>

            <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-white/[0.02]">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <caption className="sr-only">
                Équivalence entre l&apos;altitude simulée en mètres et la
                fraction d&apos;oxygène inspiré en pourcentage
              </caption>
              <thead>
                <tr className="border-b border-line">
                  <th
                    scope="col"
                    className="px-6 py-4 text-[0.64rem] font-medium tracking-[0.2em] text-dim uppercase"
                  >
                    Altitude simulée
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-[0.64rem] font-medium tracking-[0.2em] text-dim uppercase"
                  >
                    FiO₂
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-[0.64rem] font-medium tracking-[0.2em] text-dim uppercase"
                  >
                    Repère
                  </th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ALTITUDES.map((metres) => (
                  <tr
                    key={metres}
                    className="border-t border-line transition-colors duration-300 hover:bg-white/[0.03]"
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 text-[0.92rem] font-medium tracking-tight whitespace-nowrap text-ink tabular-nums"
                    >
                      {formatNumber(metres)} m
                    </th>
                    <td className="px-6 py-4 text-[0.92rem] font-light whitespace-nowrap text-accent tabular-nums">
                      {formatDecimal(fio2AtAltitude(metres))} %
                    </td>
                    <td className="px-6 py-4 text-[0.86rem] font-light text-dim text-pretty">
                      {landmarkFor(metres)}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </details>

          <p className="mt-5 text-[0.78rem] leading-relaxed font-light text-dimmer text-pretty">
            {`L'ATMOS ONE couvre l'intégralité de cette plage, de 20,9 % à 9 % d'oxygène, soit 0 à ${formatNumber(MAX_ALTITUDE)} mètres simulés, réglables au palier près.`}
          </p>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="faq-titre"
          className="mt-20 scroll-mt-24 sm:mt-24"
        >
          <span className="font-mono block text-[0.68rem] tracking-[0.28em] text-accent uppercase">
            Les questions
          </span>

          <h2
            id="faq-titre"
            className="mt-5 text-[1.6rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-4xl"
          >
            <span className="text-ink">
              Ce qu&apos;il faut savoir
            </span>{" "}
            <span className="text-accent">
              avant de régler l&apos;appareil.
            </span>
          </h2>

          <div className="mt-10 flex flex-col gap-3">
            {FAQ.map((item) => (
              // <details> natif : la réponse reste dans le HTML servi, donc
              // indexable et lisible même sans JavaScript.
              <details
                key={item.question}
                className="group rounded-[1.5rem] border border-line bg-white/[0.02] px-6 py-5 transition-colors duration-300 open:border-accent/40 hover:border-line-strong sm:px-8 sm:py-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[0.98rem] font-medium tracking-tight text-balance text-ink [&::-webkit-details-marker]:hidden">
                  <h3>{item.question}</h3>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-accent group-open:hidden"
                    strokeWidth={1.6}
                  />
                  <ChevronUp
                    className="hidden h-4 w-4 shrink-0 text-accent group-open:block"
                    strokeWidth={1.6}
                  />
                </summary>
                <p className="mt-4 text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Maillage interne ───────────────────────────────────────── */}
        {related.length > 0 && (
          <section aria-labelledby="lectures-titre" className="mt-20 sm:mt-24">
            <h2
              id="lectures-titre"
              className="font-mono text-[0.64rem] tracking-[0.24em] text-dimmer uppercase"
            >
              Pour aller plus loin
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {related.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex items-start justify-between gap-5 rounded-2xl border border-line px-5 py-5 transition-colors duration-300 hover:border-accent/40"
                >
                  <span className="text-[0.9rem] leading-relaxed font-light text-dim text-pretty group-hover:text-ink">
                    {post.title}
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
