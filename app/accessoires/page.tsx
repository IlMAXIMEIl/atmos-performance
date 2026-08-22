import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ACCESSORIES, ACCESSORIES_PATH } from "@/lib/accessories";
import { WAITLIST_CTA } from "@/lib/offering";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { breadcrumbSchema } from "@/lib/structured-data";

const PAGE_URL = `${SITE_URL}${ACCESSORIES_PATH}`;

const TITLE = "Accessoires ATMOS : masque, filtre, tente et oxymètre";
const DESCRIPTION =
  "Les quatre pièces de l'écosystème ATMOS ONE : le masque pour les séances, la tente pour les nuits, le filtre pour la longévité de l'appareil et l'oxymètre pour piloter la progression.";

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

export default function AccessoiresPage() {
  const jsonLd = [
    breadcrumbSchema([
      { name: "Accueil", url: SITE_URL },
      { name: "Accessoires" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": PAGE_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "fr-FR",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: ACCESSORIES.length,
        itemListElement: ACCESSORIES.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          description: item.tagline,
        })),
      },
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-void text-ink">
      <JsonLd data={jsonLd} />

      <SiteHeader maxWidth="max-w-5xl" />

      <main className="relative z-20 mx-auto w-full max-w-5xl px-6 pb-24 lg:px-10">
        <Link
          href="/#produit"
          className="group inline-flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.14em] text-dimmer uppercase transition-colors hover:text-accent"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
            strokeWidth={1.6}
          />
          Le générateur
        </Link>

        <div className="mt-10">
          <Eyebrow>{"L'écosystème"}</Eyebrow>

          <h1 className="mt-6 text-[clamp(2.1rem,5vw,3.6rem)] leading-[1.03] font-semibold tracking-[-0.035em] text-balance">
            <span className="text-ink">Le générateur n&apos;est</span>{" "}
            <span className="text-accent">qu&apos;un point de départ.</span>
          </h1>

          <p className="mt-7 max-w-2xl leading-[1.7] text-dim text-pretty">
            {
              "Il fabrique l'air. Ce qui suit décide de ce qu'il en advient : par où il passe, combien de temps vous y restez, et ce que votre corps en fait. Quatre pièces, chacune avec un rôle précis."
            }
          </p>
        </div>

        {/*
          Ni prix ni disponibilité sur cette page.

          Rien n'est arrêté à ce jour. Annoncer un tarif qui bougera coûte plus
          cher que ne rien annoncer : la page décrit ce que chaque pièce fait,
          et renvoie vers la liste prioritaire pour le reste.
        */}
        <ul className="mt-16 flex flex-col gap-6">
          {ACCESSORIES.map((item, index) => (
            <li
              key={item.slug}
              id={item.slug}
              className="scroll-mt-24 rounded-xl border border-line bg-white/[0.02] p-7 sm:p-9"
            >
              <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-12">
                {/*
                  Emplacement de la photographie, en attendant les prises de
                  vue. Le cadre occupe déjà sa place et son format : le jour où
                  l'image arrive, elle se substitue sans que la page bouge.
                */}
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-deep lg:aspect-square">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--accent-soft),transparent_70%)]"
                  />
                  <span className="relative font-mono text-[0.62rem] tracking-[0.2em] text-dimmer uppercase">
                    Visuel à venir
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  <span className="font-mono text-[0.66rem] tracking-[0.2em] text-dimmer uppercase">
                    {`0${index + 1} — ${item.tagline}`}
                  </span>

                  <h2 className="text-[clamp(1.4rem,2.4vw,2rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink">
                    {item.name}
                  </h2>

                  <p className="max-w-[42em] leading-[1.7] text-dim text-pretty">
                    {item.description}
                  </p>

                  <ul className="mt-2 flex flex-col gap-2.5 border-t border-line pt-5">
                    {item.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-3 text-[0.9rem] leading-relaxed text-dim"
                      >
                        <span
                          aria-hidden
                          className="mt-[0.55em] h-1 w-1 flex-none rounded-full bg-accent"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="mt-16 rounded-xl border border-accent/40 bg-accent/[0.06] p-8 sm:p-10">
          <Eyebrow as="h2">Disponibilité</Eyebrow>

          <p className="mt-5 max-w-2xl text-[1.05rem] leading-[1.6] text-ink text-pretty">
            Les accessoires ouvriront avec le générateur.
          </p>

          <p className="mt-4 max-w-2xl leading-[1.7] text-dim text-pretty">
            {
              "Tarifs et conditionnements ne sont pas arrêtés : les annoncer aujourd'hui reviendrait à les corriger demain. Les inscrits de la liste prioritaire seront prévenus en même temps que pour l'appareil."
            }
          </p>

          <Link
            href="/#offres"
            className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            {WAITLIST_CTA}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={1.8}
            />
          </Link>
        </aside>
      </main>

      <SiteFooter />
    </div>
  );
}
