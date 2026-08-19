import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/mentions-legales`;
const DESCRIPTION =
  "Mentions légales du site ATMOS PERFORMANCE : éditeur, hébergeur et conditions d'utilisation.";

export const metadata: Metadata = {
  title: "Mentions légales — ATMOS PERFORMANCE",
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: "Mentions légales — ATMOS PERFORMANCE",
    description: DESCRIPTION,
  },
};

/**
 * Squelette de page légale : les champs entre crochets doivent être renseignés
 * avant toute mise en ligne. Aucune information d'identité n'est inventée ici.
 */
const SECTIONS = [
  {
    title: "Éditeur du site",
    lines: [
      "Raison sociale : [À COMPLÉTER]",
      "Forme juridique et capital social : [À COMPLÉTER]",
      "Siège social : [À COMPLÉTER]",
      "SIRET / RCS : [À COMPLÉTER]",
      "Numéro de TVA intracommunautaire : [À COMPLÉTER]",
      "Directeur de la publication : [À COMPLÉTER]",
      "Contact : contact@atmos-performance.com",
    ],
  },
  {
    title: "Hébergeur",
    lines: [
      "Dénomination : [À COMPLÉTER]",
      "Adresse : [À COMPLÉTER]",
      "Téléphone : [À COMPLÉTER]",
    ],
  },
  {
    title: "Propriété intellectuelle",
    lines: [
      "L'ensemble des contenus présents sur ce site (textes, visuels, marques, éléments graphiques et logiciels) est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable est interdite.",
    ],
  },
  {
    title: "Données personnelles",
    lines: [
      "Les informations transmises via le formulaire de contact ou de pré-réservation sont utilisées dans le seul cadre du traitement de votre demande.",
      "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition sur vos données. Ces droits s'exercent à l'adresse contact@atmos-performance.com.",
      "Responsable de traitement et durée de conservation : [À COMPLÉTER]",
    ],
  },
  {
    title: "Avertissement",
    lines: [
      "Les informations physiologiques présentées sur ce site le sont à titre indicatif et ne constituent pas un avis médical. L'usage d'un générateur de simulation d'altitude requiert un avis médical préalable en cas de pathologie cardiaque ou respiratoire.",
    ],
  },
];

export default function MentionsLegalesPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#0B0C10] font-[family-name:var(--font-geist-sans)] text-white selection:bg-cyan-400/25">
      {/* Halo discret, dans la continuité de la page d'accueil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"
      />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-6 py-20 sm:py-28 lg:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour à l&apos;accueil
        </Link>

        <h1 className="mt-10 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Mentions légales
          </span>
        </h1>

        <div className="mt-14 flex flex-col gap-12">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-[0.68rem] font-medium tracking-[0.24em] text-cyan-300/70 uppercase">
                {section.title}
              </h2>
              <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.07] pt-5">
                {section.lines.map((line) => (
                  <p
                    key={line}
                    className="text-[0.92rem] leading-relaxed font-light text-white/55 text-pretty"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
