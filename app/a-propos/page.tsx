import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  FlaskConical,
  Gauge,
  Mountain,
  ShieldCheck,
  Store,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { WaitlistForm } from "@/components/waitlist-form";
import { CAMP, ATMOS_PRICE, formatNumber } from "@/lib/altitude";
import { BATCH_NAME, BATCH_UNITS } from "@/lib/offering";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ORGANIZATION_ID, breadcrumbSchema } from "@/lib/structured-data";
import { TOOLS_PATH } from "@/lib/tools";

const PAGE_URL = `${SITE_URL}/a-propos`;

const TITLE = "À propos d'ATMOS PERFORMANCE";
const DESCRIPTION =
  "Pourquoi nous vendons ATMOS ONE en direct, sans distributeur : notre parti pris sur le prix, et l'exigence scientifique qui ne bouge pas pour autant.";

export const metadata: Metadata = {
  title: `${TITLE} — ATMOS`,
  description: DESCRIPTION,
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

/** Coût d'un stage de trois semaines en centre d'altitude, pour l'échelle. */
const CAMP_TOTAL = CAMP.nights * CAMP.nightlyRate + CAMP.travel;

type Step = { icon: LucideIcon; label: string; detail: string };

/**
 * Les deux circuits, présentés côte à côte.
 *
 * Le propos tient à la structure du circuit, pas à un chiffre de concurrent :
 * nous ne citons aucun prix que nous ne pratiquons pas nous-mêmes.
 */
const CLASSIC_CHAIN: Step[] = [
  {
    icon: Wrench,
    label: "Fabricant",
    detail: "Conçoit et assemble la machine.",
  },
  {
    icon: Truck,
    label: "Importateur",
    detail: "Prend en charge le passage en douane.",
  },
  {
    icon: Store,
    label: "Distributeur",
    detail: "Constitue le stock, applique sa marge.",
  },
  {
    icon: Store,
    label: "Revendeur",
    detail: "Vend au client final, applique la sienne.",
  },
];

const DIRECT_CHAIN: Step[] = [
  {
    icon: Wrench,
    label: "Notre atelier",
    detail: "Conception, assemblage, contrôle.",
  },
  {
    icon: ArrowRight,
    label: "Vous",
    detail: "Livraison directe, sans intermédiaire.",
  },
];

/** Les trois garanties de méthode qui justifient la confiance demandée. */
const RIGOUR: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: FlaskConical,
    title: "Des protocoles, pas des réglages",
    body: "Chaque recommandation part d'un protocole identifié — sommeil LHTL, entraînement IHT, exposition passive IHE — et reste dans la plage d'altitude que la littérature lui assigne. C'est la modalité qui fixe le palier, jamais l'objectif commercial.",
  },
  {
    icon: ShieldCheck,
    title: "Un plafond que nous refusons de franchir",
    body: "Le simulateur ne recommandera jamais de dormir au-delà de 2 600 mètres, même à un athlète confirmé qui le demande. Au-dessus, le sommeil se dégrade plus vite que le bénéfice ne progresse. Un plafond figé dans le code, pas une consigne qu'on assouplit.",
  },
  {
    icon: Gauge,
    title: "Vérifiable avant tout achat",
    body: "Nos calculateurs sont en accès libre, sans compte et sans adresse email. Vous pouvez éprouver la cohérence de notre méthode entièrement gratuitement, et décider ensuite.",
  },
];

export default function AProposPage() {
  const jsonLd = [
    breadcrumbSchema([
      { name: "Accueil", url: SITE_URL },
      { name: "À propos" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "@id": PAGE_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "fr-FR",
      about: { "@id": ORGANIZATION_ID },
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#0B0C10] font-[family-name:var(--font-geist-sans)] text-white selection:bg-cyan-400/25">
      <JsonLd data={jsonLd} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"
      />

      <PageHeader maxWidth="max-w-5xl" />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24 lg:px-10">
        <Link
          href="/"
          className="group mt-4 inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour à l&apos;accueil
        </Link>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="a-propos-titre">
          <span className="mt-10 block text-[0.68rem] font-medium tracking-[0.28em] text-cyan-300/70 uppercase">
            À propos
          </span>

          <h1
            id="a-propos-titre"
            className="mt-5 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-[3.25rem]"
          >
            <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
              La science de la haute altitude.
            </span>{" "}
            <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
              Sans compromis, sans intermédiaires.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty sm:text-lg">
            {
              "ATMOS PERFORMANCE conçoit et vend ATMOS ONE en direct. Pas de réseau de distribution, pas de marges empilées entre l'atelier et votre salon. Le prix affiché est celui de la machine, pas celui de la chaîne qui l'aurait acheminée."
            }
          </p>
        </section>

        {/* ── Notre ADN ────────────────────────────────────────────────── */}
        <section aria-labelledby="adn-titre" className="mt-24 sm:mt-28">
          <span className="block text-[0.66rem] font-medium tracking-[0.24em] text-white/45 uppercase">
            Notre ADN
          </span>

          <h2
            id="adn-titre"
            className="mt-5 text-[1.65rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-3xl lg:text-4xl"
          >
            <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
              Une technologie d&apos;élite, retenue prisonnière de son circuit.
            </span>
          </h2>

          <div className="mt-8 flex flex-col gap-5 text-[0.98rem] leading-relaxed font-light text-white/60 text-pretty">
            <p>
              {
                "Nous venons de la performance et de la physiologie. Pendant des années, nous avons regardé la même chose se répéter : l'hypoxie contrôlée est l'un des leviers d'entraînement les mieux documentés de la littérature, et pourtant l'équipement reste l'apanage des fédérations, des centres nationaux et de quelques équipes professionnelles."
              }
            </p>
            <p>
              {
                "Ce n'est pas un problème de technologie. Un générateur d'hypoxie normobare sépare l'azote de l'oxygène — le principe est stable depuis des décennies, et il n'a rien d'ésotérique. Le verrou est ailleurs : dans un circuit de distribution taillé pour le matériel médical, où chaque maillon prend sa part avant que la machine n'arrive chez quelqu'un."
              }
            </p>
            <p>
              {
                "Notre parti pris est simple, et c'est le seul que nous ayons trouvé pour faire tomber le prix sans toucher à la machine : supprimer les maillons. Nous concevons, nous assemblons, nous vendons. Personne entre nous et vous."
              }
            </p>
          </div>

          {/* Les deux circuits, côte à côte */}
          <div className="mt-12 grid gap-5 lg:grid-cols-2 lg:gap-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-8">
              <div className="flex items-center gap-2.5 text-[0.66rem] font-medium tracking-[0.2em] text-white/40 uppercase">
                <Ban className="h-3.5 w-3.5" strokeWidth={1.6} />
                Le circuit classique
              </div>

              <ol className="mt-7 flex flex-col gap-5">
                {CLASSIC_CHAIN.map(({ icon: Icon, label, detail }) => (
                  <li key={label} className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02]">
                      <Icon
                        className="h-3.5 w-3.5 text-white/40"
                        strokeWidth={1.6}
                      />
                    </span>
                    <div>
                      <div className="text-sm font-medium tracking-tight text-white/70">
                        {label}
                      </div>
                      <div className="mt-1 text-[0.85rem] leading-relaxed font-light text-white/40 text-pretty">
                        {detail}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-8 border-t border-white/[0.07] pt-6 text-[0.85rem] leading-relaxed font-light text-white/40 text-pretty">
                {
                  "Quatre acteurs, quatre marges. Le client final paie l'addition d'un acheminement, pas une machine plus performante."
                }
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-gradient-to-b from-cyan-400/[0.06] to-white/[0.015] p-8 backdrop-blur-xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.18),transparent_70%)]"
              />

              <div className="relative">
                <div className="flex items-center gap-2.5 text-[0.66rem] font-medium tracking-[0.2em] text-cyan-300/70 uppercase">
                  <Mountain className="h-3.5 w-3.5" strokeWidth={1.6} />
                  Le nôtre
                </div>

                <ol className="mt-7 flex flex-col gap-5">
                  {DIRECT_CHAIN.map(({ icon: Icon, label, detail }) => (
                    <li key={label} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/[0.07]">
                        <Icon
                          className="h-3.5 w-3.5 text-cyan-300"
                          strokeWidth={1.6}
                        />
                      </span>
                      <div>
                        <div className="text-sm font-medium tracking-tight text-white/90">
                          {label}
                        </div>
                        <div className="mt-1 text-[0.85rem] leading-relaxed font-light text-white/50 text-pretty">
                          {detail}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-8 border-t border-white/[0.07] pt-6">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[2.6rem] leading-none font-medium tracking-[-0.04em] text-white tabular-nums">
                      {formatNumber(ATMOS_PRICE)}
                    </span>
                    <span className="text-xl font-light text-white/50">€</span>
                  </div>
                  <p className="mt-4 text-[0.85rem] leading-relaxed font-light text-white/50 text-pretty">
                    {`Prix public d'ATMOS ONE. Pour l'échelle : un stage de trois semaines en centre d'altitude revient à ${formatNumber(CAMP_TOTAL)} € d'hébergement et de trajet — une fois, sans rien vous laisser entre les mains.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── L'exigence scientifique ──────────────────────────────────── */}
        <section aria-labelledby="rigueur-titre" className="mt-24 sm:mt-28">
          <span className="block text-[0.66rem] font-medium tracking-[0.24em] text-white/45 uppercase">
            L&apos;exigence scientifique
          </span>

          <h2
            id="rigueur-titre"
            className="mt-5 text-[1.65rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-3xl lg:text-4xl"
          >
            <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
              Le prix baisse.
            </span>{" "}
            <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
              La rigueur, non.
            </span>
          </h2>

          <p className="mt-8 max-w-3xl text-[0.98rem] leading-relaxed font-light text-white/60 text-pretty">
            {
              "Vendre moins cher n'autorise à rien promettre. Notre simulateur de protocole ne compose pas des chiffres qui flattent : il applique les consensus publiés en physiologie de l'effort — les travaux de Levine et Stray-Gundersen sur le Live High – Train Low, ceux de Grégoire Millet sur l'entraînement intermittent en hypoxie — et il refuse toute recommandation qui en sortirait."
            }
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
            {RIGOUR.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-8 backdrop-blur-xl transition-colors duration-500 hover:border-cyan-300/25"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.14),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                <div className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <Icon className="h-4 w-4 text-cyan-300" strokeWidth={1.6} />
                  </span>

                  <h3 className="mt-6 text-[1.05rem] leading-snug font-medium tracking-[-0.02em] text-balance text-white">
                    {title}
                  </h3>

                  <p className="mt-3.5 text-[0.86rem] leading-relaxed font-light text-white/50 text-pretty">
                    {body}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <p className="text-[0.92rem] leading-relaxed font-light text-white/55 text-pretty">
              {
                "Le meilleur moyen de nous juger n'est pas de nous lire, mais d'ouvrir l'outil et de regarder ce qu'il vous répond."
              }
            </p>

            <Link
              href={`${TOOLS_PATH}/simulateur-altitude`}
              className="group mt-6 inline-flex shrink-0 items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white/90 backdrop-blur-md transition-all duration-300 hover:border-cyan-300/40 hover:bg-white/[0.08] hover:text-white sm:mt-0"
            >
              Ouvrir le simulateur
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.6}
              />
            </Link>
          </div>
        </section>

        {/* ── Rejoindre la liste d'attente ─────────────────────────────── */}
        <section
          aria-labelledby="attente-titre"
          className="relative mt-24 overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-b from-cyan-400/[0.06] to-white/[0.015] p-8 backdrop-blur-xl sm:mt-28 sm:p-12 lg:p-16"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.18),transparent_70%)]"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <span className="block text-[0.66rem] font-medium tracking-[0.24em] text-cyan-300/70 uppercase">
              {`${BATCH_NAME} · ${BATCH_UNITS} unités`}
            </span>

            <h2
              id="attente-titre"
              className="mt-5 text-[1.6rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-3xl"
            >
              <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
                Soyez prévenu à l&apos;ouverture.
              </span>
            </h2>

            <p className="mt-5 text-[0.95rem] leading-relaxed font-light text-white/55 text-pretty">
              {
                "La première série est limitée et part en priorité aux inscrits. Une adresse email suffit : nous écrivons pour annoncer l'ouverture, pas pour meubler une boîte de réception."
              }
            </p>

            <WaitlistForm source="batch-1" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
