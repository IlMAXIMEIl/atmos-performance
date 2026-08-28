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
 * Identité renseignée depuis l'extrait RNE du 20/08/2026 (INPI). En cas de
 * changement de forme juridique, d'adresse ou d'hébergeur, cette table est
 * le seul endroit à mettre à jour.
 */
const SECTIONS = [
  {
    title: "Éditeur du site",
    lines: [
      "Éditeur : Maxime Roussel, entrepreneur individuel, exerçant sous le nom commercial Atmos-performance",
      "Siège : 17 rue Joseph Lebas, Appt 19, 76140 Le Petit-Quevilly, France",
      "SIREN : 981 974 470 (RNE) — SIRET : 981 974 470 00024",
      "TVA non applicable, article 293 B du CGI",
      "Directeur de la publication : Maxime Roussel",
      "Contact : contact@atmos-performance.com — 06 16 96 81 80",
    ],
  },
  {
    title: "Hébergeur",
    lines: [
      "Dénomination : HOSTINGER INTERNATIONAL LTD",
      "Adresse : 61 Lordou Vironos Street, 6023 Larnaca, Chypre",
      "Contact : https://www.hostinger.fr/contact — +357 24 030 750",
    ],
  },
  {
    title: "Propriété intellectuelle",
    lines: [
      "L'ensemble des contenus présents sur ce site (textes, visuels, marques, éléments graphiques et logiciels) est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable est interdite.",
    ],
  },
  {
    title: "Données personnelles et cookies",
    lines: [
      "Le responsable du traitement des données collectées sur ce site est Maxime Roussel, entrepreneur individuel (Atmos-performance).",
      "Les données transmises via les formulaires du site sont utilisées dans le seul cadre du traitement de votre demande. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition, à exercer à l'adresse contact@atmos-performance.com.",
      "Le détail des traitements, des durées de conservation, des cookies et de la procédure de suppression figure dans la politique de confidentialité, accessible depuis chaque page du site.",
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
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
      {/* Halo discret, dans la continuité de la page d'accueil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,158,255,0.12),transparent_70%)]"
      />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-6 py-20 sm:py-28 lg:px-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-[0.8rem] font-light tracking-[0.06em] text-dim transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour à l&apos;accueil
        </Link>

        <h1 className="mt-10 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
          <span className="text-ink">
            Mentions légales
          </span>
        </h1>

        <div className="mt-14 flex flex-col gap-12">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="font-mono text-[0.68rem] tracking-[0.24em] text-accent uppercase">
                {section.title}
              </h2>
              <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
                {section.lines.map((line) => (
                  <p
                    key={line}
                    className="text-[0.92rem] leading-relaxed font-light text-dim text-pretty"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 border-t border-line pt-8 text-[0.82rem] leading-relaxed font-light text-dimmer text-pretty">
          Voir également nos{" "}
          <Link
            href="/cgv"
            className="text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
          >
            conditions générales de vente
          </Link>{" "}
          et notre{" "}
          <Link
            href="/confidentialite"
            className="text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
