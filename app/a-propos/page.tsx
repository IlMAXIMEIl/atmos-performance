import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  Factory,
  FlaskConical,
  Gauge,
  Percent,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { WaitlistForm } from "@/components/waitlist-form";
import { ATMOS_PRICE, CAMP, formatNumber } from "@/lib/altitude";
import { BATCH_NAME, BATCH_UNITS, INCLUDED_ITEMS } from "@/lib/offering";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ORGANIZATION_ID, breadcrumbSchema } from "@/lib/structured-data";
import { TOOLS_PATH } from "@/lib/tools";

const PAGE_URL = `${SITE_URL}/a-propos`;

const TITLE = "Pourquoi ATMOS ONE coûte moins cher";
const DESCRIPTION =
  "Import direct, vente sans revendeur, marge assumée plus faible : l'écart de prix d'ATMOS ONE s'explique par la structure du circuit, pas par la machine.";

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

/**
 * La réponse à l'objection, en trois points.
 *
 * Placée avant tout le reste : sur du matériel technique, un prix plus bas
 * n'enchante pas, il inquiète. Tant que l'écart n'est pas expliqué, le
 * visiteur cherche le défaut — autant lui donner la raison tout de suite.
 */
const REASONS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Truck,
    title: "Nous importons nous-mêmes",
    body: "ATMOS ONE sort d'une usine spécialisée, comme la quasi-totalité du matériel hypoxique vendu en Europe. Ce qui change tient à la suite : nous prenons l'import à notre compte, au lieu de le confier à un importateur qui refacture son intervention.",
  },
  {
    icon: Ban,
    title: "Nous vendons sans revendeur",
    body: "Ni distributeur, ni boutique partenaire, ni commission de réseau. Ce site est le seul point de vente. La marge d'un maillon absent ne se répercute sur personne.",
  },
  {
    icon: Percent,
    title: "Nous prenons moins de marge",
    body: "C'est une décision, pas une astuce comptable. Nous préférons équiper beaucoup de sportifs avec une marge modeste que quelques-uns au prix fort. Le reste du marché arbitre dans l'autre sens.",
  },
];

type Step = { icon: LucideIcon; label: string; detail: string };

/**
 * Les deux circuits, côte à côte.
 *
 * Le point de départ est identique — c'est justement ce qui rend la
 * comparaison honnête. Aucun prix de concurrent n'est cité : le propos porte
 * sur le nombre de maillons, pas sur des chiffres que nous ne pratiquons pas.
 */
const CLASSIC_CHAIN: Step[] = [
  {
    icon: Factory,
    label: "Usine spécialisée",
    detail: "Conçoit et assemble le générateur.",
  },
  {
    icon: Truck,
    label: "Importateur",
    detail: "Achemine, dédouane, refacture son service.",
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
    icon: Factory,
    label: "Usine spécialisée",
    detail: "Le même point de départ. C'est la suite qui diffère.",
  },
  {
    icon: PackageCheck,
    label: "Nous, en import direct",
    detail: "Transport DDP : droits et taxes réglés au départ.",
  },
  {
    icon: ArrowRight,
    label: "Vous",
    detail: "Livraison à domicile, sans intermédiaire.",
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

        {/* ── L'objection, et sa réponse ───────────────────────────────── */}
        <section aria-labelledby="a-propos-titre">
          <span className="mt-10 block text-[0.68rem] font-medium tracking-[0.28em] text-cyan-300/70 uppercase">
            À propos
          </span>

          <h1
            id="a-propos-titre"
            className="mt-5 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-[3.15rem]"
          >
            <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
              Pourquoi notre prix est plus bas.
            </span>{" "}
            <span className="bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
              Et pourquoi ce n&apos;est pas suspect.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed font-light text-white/55 text-pretty sm:text-lg">
            {
              "C'est la première question que pose un acheteur devant un écart de prix sur du matériel technique — et c'est une bonne question. Voici la réponse, avant tout le reste : l'écart vient du chemin parcouru par la machine, pas de la machine elle-même."
            }
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
            {REASONS.map(({ icon: Icon, title, body }) => (
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

                  <h2 className="mt-6 text-[1.05rem] leading-snug font-medium tracking-[-0.02em] text-balance text-white">
                    {title}
                  </h2>

                  <p className="mt-3.5 text-[0.86rem] leading-relaxed font-light text-white/50 text-pretty">
                    {body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Les deux circuits ────────────────────────────────────────── */}
        <section aria-labelledby="circuits-titre" className="mt-24 sm:mt-28">
          <span className="block text-[0.66rem] font-medium tracking-[0.24em] text-white/45 uppercase">
            Le circuit, en clair
          </span>

          <h2
            id="circuits-titre"
            className="mt-5 text-[1.65rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-3xl lg:text-4xl"
          >
            <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
              Même point de départ, deux chemins.
            </span>
          </h2>

          <p className="mt-8 max-w-3xl text-[0.98rem] leading-relaxed font-light text-white/60 text-pretty">
            {
              "Le matériel hypoxique sort d'un petit nombre d'usines spécialisées, et les marques qui le vendent en Europe s'y approvisionnent. Nous ne prétendons pas le contraire. Ce qui sépare deux prix, sur ce marché, ce n'est presque jamais la machine : c'est le nombre d'acteurs qui la manipulent avant vous."
            }
          </p>

          <div className="mt-12 grid gap-5 lg:grid-cols-2 lg:gap-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-8">
              <div className="flex items-center gap-2.5 text-[0.66rem] font-medium tracking-[0.2em] text-white/40 uppercase">
                <Ban className="h-3.5 w-3.5" strokeWidth={1.6} />
                Le circuit habituel
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
                  "Trois marges empilées après l'usine. Le client final paie l'addition d'un acheminement, pas une machine plus performante."
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
                  <PackageCheck className="h-3.5 w-3.5" strokeWidth={1.6} />
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
                    {`Prix public d'ATMOS ONE, livraison comprise. Pour l'échelle : un stage de trois semaines en centre d'altitude revient à ${formatNumber(CAMP_TOTAL)} € d'hébergement et de trajet — une fois, sans rien vous laisser entre les mains.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Ce que le prix ne retire pas ─────────────────────────────── */}
        <section aria-labelledby="garanties-titre" className="mt-24 sm:mt-28">
          <span className="block text-[0.66rem] font-medium tracking-[0.24em] text-white/45 uppercase">
            Ce que l&apos;écart ne retire pas
          </span>

          <h2
            id="garanties-titre"
            className="mt-5 text-[1.65rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-3xl lg:text-4xl"
          >
            <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
              Moins cher ne veut pas dire allégé.
            </span>
          </h2>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-8">
              <div className="text-[0.64rem] font-medium tracking-[0.24em] text-white/40 uppercase">
                Livré avec l&apos;appareil
              </div>

              <ul className="mt-7 flex flex-col gap-4">
                {INCLUDED_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/80"
                      strokeWidth={2}
                    />
                    <span className="text-[0.92rem] leading-relaxed font-light text-white/70 text-pretty">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-8">
              <div className="flex items-center gap-2.5 text-[0.64rem] font-medium tracking-[0.24em] text-white/40 uppercase">
                <PackageCheck className="h-3.5 w-3.5" strokeWidth={1.6} />
                Transport DDP
              </div>

              <p className="mt-7 text-[0.92rem] leading-relaxed font-light text-white/60 text-pretty">
                {
                  "Droits de douane et taxes d'importation sont réglés au départ, par nous. Vous n'avez rien à avancer au transporteur, rien à déclarer, et aucune facture ne suit la livraison."
                }
              </p>

              <p className="mt-5 text-[0.85rem] leading-relaxed font-light text-white/40 text-pretty">
                {
                  "C'est précisément le poste qu'un acheteur qui importe seul découvre trop tard, et la raison pour laquelle nous l'avons pris en charge plutôt que de le laisser à votre porte."
                }
              </p>
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
