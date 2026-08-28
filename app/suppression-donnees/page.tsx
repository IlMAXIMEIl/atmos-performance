import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/suppression-donnees`;
const DESCRIPTION =
  "Comment demander la suppression de vos données personnelles chez ATMOS PERFORMANCE : procédure, délai de traitement et données conservées par obligation légale.";

export const metadata: Metadata = {
  title: "Suppression de vos données — ATMOS PERFORMANCE",
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: "Suppression de vos données — ATMOS PERFORMANCE",
    description: DESCRIPTION,
  },
};

/**
 * La procédure de suppression, sur sa propre URL.
 *
 * ## Pourquoi cette page existe séparément de `/confidentialite`
 *
 * Les plateformes tierces — Meta en tête — exigent une « URL d'instructions
 * pour la suppression des données » et **refusent une URL portant un
 * fragment** : `/confidentialite#suppression` est rejeté à la saisie
 * (« should represent a valid URL »). Il faut donc une adresse propre,
 * qui se suffise à elle-même sans faire défiler une page plus longue.
 *
 * Le texte reprend celui de la section « Suppression de vos données » de la
 * politique de confidentialité. Les deux disent la même chose et doivent le
 * rester : toute modification de la procédure se répercute des deux côtés.
 */
type Etape = {
  titre: string;
  paragraphes: string[];
};

const ETAPES: Etape[] = [
  {
    titre: "La demande",
    paragraphes: [
      `Adressez un courriel à ${CONTACT_EMAIL} avec pour objet « Suppression de mes données », depuis l'adresse électronique concernée par la demande — c'est ce qui nous permet de vérifier qu'elle émane bien de vous, sans avoir à réclamer une pièce d'identité.`,
      "Aucune justification n'est à fournir. Si vous préférez le courrier postal : Maxime Roussel (Atmos-performance), 17 rue Joseph Lebas, Appt 19, 76140 Le Petit-Quevilly, France.",
    ],
  },
  {
    titre: "Ce qui est supprimé",
    paragraphes: [
      "L'ensemble des données vous concernant : votre compte de l'espace client et les mesures de suivi qu'il contient (nuits d'utilisation, SpO₂, fréquence cardiaque, ressenti), votre inscription à la liste d'attente et aux communications, ainsi que les données associées aux services tiers connectés au site, auxquels la demande est répercutée.",
    ],
  },
  {
    titre: "Le délai",
    paragraphes: [
      "La suppression est effectuée dans un délai maximal de trente jours à compter de la réception de la demande, et vous est confirmée par retour de courriel.",
    ],
  },
  {
    titre: "Ce que la loi nous oblige à conserver",
    paragraphes: [
      "Si vous avez passé commande, les factures correspondantes sont conservées dix ans, comme l'impose le code de commerce. Elles cessent alors d'être utilisées à toute autre fin que cette obligation comptable : ni relation client, ni communication, ni mesure.",
    ],
  },
  {
    titre: "Si votre demande reste sans réponse",
    paragraphes: [
      "Vous pouvez adresser une réclamation à la Commission nationale de l'informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — www.cnil.fr.",
    ],
  },
];

export default function SuppressionDonneesPage() {
  return (
    <div className="relative min-h-screen w-full bg-void font-[family-name:var(--font-geist-sans)] text-ink selection:bg-accent/25">
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
          <span className="text-ink">Suppression de vos données</span>
        </h1>

        <p className="mt-6 text-[0.9rem] leading-relaxed font-light text-dim text-pretty">
          Un courriel suffit, sans justification à fournir. Voici la procédure,
          ce qu&apos;elle efface et ce que la loi nous oblige à garder.
        </p>

        <div className="mt-14 flex flex-col gap-12">
          {ETAPES.map((etape) => (
            <section key={etape.titre}>
              <h2 className="font-mono text-[0.68rem] tracking-[0.24em] text-accent uppercase">
                {etape.titre}
              </h2>
              <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
                {etape.paragraphes.map((paragraphe) => (
                  <p
                    key={paragraphe}
                    className="text-[0.92rem] leading-relaxed font-light text-dim text-pretty"
                  >
                    {paragraphe}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 border-t border-line pt-8 text-[0.82rem] leading-relaxed font-light text-dimmer text-pretty">
          Le détail des traitements, des durées de conservation et des cookies
          figure dans notre{" "}
          <Link
            href="/confidentialite"
            className="text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
