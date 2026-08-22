import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FlaskConical,
  Gauge,
  PackageCheck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WaitlistForm } from "@/components/waitlist-form";
import { DROP_NAME, DROP_UNITS, INCLUDED_ITEMS } from "@/lib/offering";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ORGANIZATION_ID, breadcrumbSchema } from "@/lib/structured-data";
import { TOOLS_PATH } from "@/lib/tools";

const PAGE_URL = `${SITE_URL}/a-propos`;

const TITLE = "À propos d'ATMOS PERFORMANCE";
const DESCRIPTION =
  "Reproduire l'altitude chez soi et doser l'exposition selon les consensus publiés en physiologie de l'effort : la méthode et les standards d'ATMOS PERFORMANCE.";

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

/**
 * Les trois garanties de méthode.
 *
 * Elles portent la page : ce sont les seuls arguments que personne ne peut
 * reprendre sans refaire le travail. La page ne discute pas de prix — le fait
 * s'énonce en une ligne près du prix, dans la section Offres, il ne se plaide
 * pas ici.
 */
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
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      <JsonLd data={jsonLd} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"
      />

      <SiteHeader maxWidth="max-w-5xl" />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24 lg:px-10">
        <Link
          href="/"
          className="group mt-4 inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-dim transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour à l&apos;accueil
        </Link>

        {/* ── La mission ───────────────────────────────────────────────── */}
        <section aria-labelledby="a-propos-titre">
          <span className="font-mono mt-10 block text-[0.68rem] tracking-[0.28em] text-accent uppercase">
            À propos
          </span>

          <h1
            id="a-propos-titre"
            className="mt-5 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl lg:text-[3.15rem]"
          >
            <span className="text-ink">
              Reproduire l&apos;altitude chez vous.
            </span>{" "}
            <span className="text-accent">
              Doser l&apos;exposition comme en laboratoire.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed font-light text-dim text-pretty sm:text-lg">
            {
              "ATMOS PERFORMANCE conçoit ATMOS ONE et les protocoles qui l'accompagnent. Notre exigence tient en une phrase : ne jamais recommander un palier que la littérature ne soutient pas."
            }
          </p>

          <div className="mt-8 flex max-w-3xl flex-col gap-5 text-[0.98rem] leading-relaxed font-light text-dim text-pretty">
            <p>
              {
                "L'hypoxie contrôlée est l'un des leviers d'entraînement les mieux documentés de la littérature en physiologie de l'effort. Elle est longtemps restée l'affaire des fédérations et des centres nationaux — non par difficulté technique, mais faute d'un appareil et d'une méthode conçus pour être utilisés seul, chez soi, sans encadrement permanent."
              }
            </p>
            <p>
              {
                "C'est ce que nous construisons : une machine qui tient un palier au mètre près, et des protocoles qui disent quoi en faire. L'un ne vaut rien sans l'autre. Un générateur sans méthode se règle au hasard ; une méthode sans appareil fiable ne se vérifie jamais."
              }
            </p>
          </div>
        </section>

        {/* ── L'exigence scientifique ──────────────────────────────────── */}
        <section aria-labelledby="rigueur-titre" className="mt-24 sm:mt-28">
          <span className="font-mono block text-[0.66rem] tracking-[0.24em] text-dim uppercase">
            L&apos;exigence scientifique
          </span>

          <h2
            id="rigueur-titre"
            className="mt-5 text-[1.65rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-3xl lg:text-4xl"
          >
            <span className="text-ink">
              Nos recommandations ne sont pas des estimations.
            </span>
          </h2>

          <p className="mt-8 max-w-3xl text-[0.98rem] leading-relaxed font-light text-dim text-pretty">
            {
              "Notre simulateur de protocole applique les consensus publiés en physiologie de l'effort — les travaux de Levine et Stray-Gundersen sur le Live High – Train Low, ceux de Grégoire Millet sur l'entraînement intermittent en hypoxie — et refuse toute recommandation qui en sortirait."
            }
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
            {RIGOUR.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group relative overflow-hidden rounded-xl border border-line bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-8 backdrop-blur-xl transition-colors duration-500 hover:border-accent/40"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.14),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                <div className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/[0.03]">
                    <Icon className="h-4 w-4 text-accent" strokeWidth={1.6} />
                  </span>

                  <h3 className="mt-6 text-[1.05rem] leading-snug font-medium tracking-[-0.02em] text-balance text-ink">
                    {title}
                  </h3>

                  <p className="mt-3.5 text-[0.86rem] leading-relaxed font-light text-dim text-pretty">
                    {body}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-line bg-white/[0.02] p-8 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <p className="text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
              {
                "Le meilleur moyen de nous juger n'est pas de nous lire, mais d'ouvrir l'outil et de regarder ce qu'il vous répond."
              }
            </p>

            <Link
              href={`${TOOLS_PATH}/simulateur-altitude`}
              className="group mt-6 inline-flex shrink-0 items-center gap-2.5 rounded-full border border-line-strong bg-white/[0.04] px-6 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-ink backdrop-blur-md transition-all duration-300 hover:border-accent/40 hover:bg-white/[0.08] hover:text-ink sm:mt-0"
            >
              Ouvrir le simulateur
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.6}
              />
            </Link>
          </div>
        </section>

        {/* ── Après la livraison ───────────────────────────────────────── */}
        <section aria-labelledby="garanties-titre" className="mt-24 sm:mt-28">
          <span className="font-mono block text-[0.66rem] tracking-[0.24em] text-dim uppercase">
            Après la livraison
          </span>

          <h2
            id="garanties-titre"
            className="mt-5 text-[1.65rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-3xl lg:text-4xl"
          >
            <span className="text-ink">
              Ce sur quoi vous pouvez compter.
            </span>
          </h2>

          <div className="mt-10 grid gap-5 lg:grid-cols-3 lg:gap-6">
            <div className="rounded-xl border border-line bg-white/[0.02] p-8">
              <div className="font-mono text-[0.64rem] tracking-[0.24em] text-dimmer uppercase">
                Livré avec l&apos;appareil
              </div>

              <ul className="mt-7 flex flex-col gap-4">
                {INCLUDED_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      strokeWidth={2}
                    />
                    <span className="text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-white/[0.02] p-8">
              <div className="font-mono flex items-center gap-2.5 text-[0.64rem] tracking-[0.24em] text-dimmer uppercase">
                <PackageCheck className="h-3.5 w-3.5" strokeWidth={1.6} />
                Transport DDP
              </div>

              <p className="mt-7 text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
                {
                  "Droits de douane et taxes d'importation sont réglés au départ. Vous n'avez rien à avancer au transporteur, rien à déclarer, et aucune facture ne suit la livraison."
                }
              </p>
            </div>

            <div className="rounded-xl border border-line bg-white/[0.02] p-8">
              <div className="font-mono flex items-center gap-2.5 text-[0.64rem] tracking-[0.24em] text-dimmer uppercase">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.6} />
                Garantie et SAV
              </div>

              <p className="mt-7 text-[0.92rem] leading-relaxed font-light text-dim text-pretty">
                {
                  "Deux ans de garantie légale sur les défauts de fabrication, pièces et main-d'œuvre. Assistance et diagnostic depuis la France, pièces expédiées de notre stock."
                }
              </p>

              <p className="mt-5 text-[0.85rem] leading-relaxed font-light text-dimmer text-pretty">
                Le détail figure dans nos{" "}
                <Link
                  href="/cgv"
                  className="text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
                >
                  conditions générales de vente
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ── Rejoindre la liste d'attente ─────────────────────────────── */}
        <section
          aria-labelledby="attente-titre"
          className="relative mt-24 overflow-hidden rounded-xl border border-accent/40 bg-gradient-to-b from-accent/[0.06] to-white/[0.015] p-8 backdrop-blur-xl sm:mt-28 sm:p-12 lg:p-16"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.18),transparent_70%)]"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <span className="font-mono block text-[0.66rem] tracking-[0.24em] text-accent uppercase">
              {`${DROP_NAME} · ${DROP_UNITS} unités`}
            </span>

            <h2
              id="attente-titre"
              className="mt-5 text-[1.6rem] leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-3xl"
            >
              <span className="text-ink">
                Soyez prévenu à l&apos;ouverture.
              </span>
            </h2>

            <p className="mt-5 text-[0.95rem] leading-relaxed font-light text-dim text-pretty">
              {
                "La première série est limitée et part en priorité aux inscrits. Une adresse email suffit : nous écrivons pour annoncer l'ouverture, pas pour meubler une boîte de réception."
              }
            </p>

            <WaitlistForm source="drop-1" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
