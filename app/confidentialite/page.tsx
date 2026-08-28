import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { GererCookies } from "@/components/gerer-cookies";
import { SiteFooter } from "@/components/site-footer";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/confidentialite`;
const DESCRIPTION =
  "Politique de confidentialité d'ATMOS PERFORMANCE : données collectées, finalités, durées de conservation, cookies, droits RGPD et suppression des données.";

export const metadata: Metadata = {
  title: "Politique de confidentialité — ATMOS PERFORMANCE",
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: "Politique de confidentialité — ATMOS PERFORMANCE",
    description: DESCRIPTION,
  },
};

/** Figée volontairement, comme la date des CGV : à mettre à jour à chaque
 * modification de fond du dispositif décrit ici. */
const VERSION_DATE = "28 août 2026";

type Section = {
  /** Ancre stable : `#cookies` et `#suppression` sont cités ailleurs —
   * notamment dans la configuration de plateformes tierces (Meta). */
  id: string;
  title: string;
  paragraphs: string[];
  list?: string[];
};

/**
 * La politique dit ce que le site fait — rien de plus.
 *
 * Chaque traitement décrit ici correspond à un dispositif réel du code :
 * le tunnel de commande (Stripe), l'espace client (Supabase), la liste
 * d'attente, le cookie d'attribution (`lib/attribution.ts`) et son
 * consentement (`lib/consentement.ts`). Ajouter un traitement au site
 * sans l'ajouter ici rendrait la page mensongère — c'est le contrat.
 */
const SECTIONS: Section[] = [
  {
    id: "responsable",
    title: "Responsable du traitement",
    paragraphs: [
      "Le responsable du traitement des données collectées sur le site atmos-performance.com est Maxime Roussel, entrepreneur individuel exerçant sous le nom commercial Atmos-performance, dont le siège est situé 17 rue Joseph Lebas, Appt 19, 76140 Le Petit-Quevilly, France — SIREN 981 974 470.",
      `Pour toute question relative à vos données : ${CONTACT_EMAIL} ou 06 16 96 81 80.`,
    ],
  },
  {
    id: "donnees",
    title: "Les données collectées, et pourquoi",
    paragraphs: [
      "Commandes et facturation — identité, adresse de livraison et de facturation, adresse électronique, téléphone, historique d'achat. Base légale : l'exécution du contrat de vente et les obligations comptables. Conservation : le temps de la relation commerciale, puis dix ans pour les pièces comptables (obligation légale) et trois ans après le dernier contact pour la gestion de la relation client.",
      "Espace client — adresse électronique, prénom, et les mesures que vous choisissez d'y consigner pour votre suivi (nuits d'utilisation, SpO₂, fréquence cardiaque, ressenti). Ces mesures ne sont enregistrées que sur votre initiative, pour votre seul usage ; elles ne sont ni analysées à d'autres fins, ni partagées. Base légale : votre consentement explicite, retirable à tout moment en supprimant les données ou le compte. Conservation : jusqu'à la suppression du compte.",
      "Liste d'attente et communications — adresse électronique, recueillie avec votre consentement au moment de l'inscription. Conservation : jusqu'à votre désinscription, possible depuis chaque message.",
      "Mesure publicitaire — le cookie d'attribution décrit à la section Cookies, posé uniquement avec votre accord.",
      "Paiement — le paiement est traité par Stripe ; aucune donnée de carte bancaire ne transite par nos serveurs ni n'y est conservée.",
    ],
  },
  {
    id: "destinataires",
    title: "Destinataires et sous-traitants",
    paragraphs: [
      "Vos données ne sont ni vendues, ni louées, ni cédées à des fins commerciales. Elles ne sont transmises qu'aux prestataires strictement nécessaires au fonctionnement du service, agissant comme sous-traitants au sens du RGPD :",
    ],
    list: [
      "Stripe — traitement des paiements ;",
      "Supabase — hébergement de la base de données et authentification de l'espace client ;",
      "Hostinger — hébergement du site ;",
      "Brevo — envoi des communications par courriel.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    paragraphs: [
      "Le site distingue deux familles de cookies. Les cookies strictement nécessaires fonctionnent sans consentement, conformément à l'article 82 de la loi Informatique et Libertés : le cookie de session de l'espace client (authentification, déposé par Supabase), les cookies anti-fraude du prestataire de paiement Stripe (présents uniquement dans le tunnel de paiement), et le cookie « atmos_consentement » qui mémorise votre choix pendant six mois.",
      "Un seul cookie est soumis à votre consentement : « atmos_origine » (90 jours). Posé uniquement si vous acceptez, il note les paramètres de la campagne publicitaire par laquelle vous êtes arrivé (utm, gclid, fbclid) afin de rattacher une éventuelle commande à son origine et de mesurer l'efficacité de nos publicités. Il ne contient aucune donnée d'identité, ne suit pas votre navigation et n'est partagé avec aucune régie publicitaire.",
      "Vous pouvez retirer ou donner votre consentement à tout moment :",
    ],
  },
  {
    id: "droits",
    title: "Vos droits",
    paragraphs: [
      "Conformément au règlement général sur la protection des données, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données, ainsi que du droit de retirer à tout moment un consentement donné.",
      `Ces droits s'exercent par courriel à ${CONTACT_EMAIL}, ou par courrier à l'adresse du responsable du traitement. Une réponse vous est apportée dans un délai d'un mois.`,
      "Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la Commission nationale de l'informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — www.cnil.fr.",
    ],
  },
  {
    id: "suppression",
    title: "Suppression de vos données",
    paragraphs: [
      `Pour obtenir la suppression de l'ensemble des données vous concernant — compte de l'espace client, données de suivi, inscription à la liste d'attente —, adressez un courriel à ${CONTACT_EMAIL} avec pour objet « Suppression de mes données », depuis l'adresse électronique concernée.`,
      "La suppression est effectuée dans un délai maximal de trente jours, et confirmée par retour de courriel. Seules sont conservées au-delà les données dont la loi impose la conservation — les factures, pendant dix ans — qui cessent alors d'être utilisées à toute autre fin.",
      "Cette procédure vaut également pour les données éventuellement associées à des services tiers connectés au site : la demande de suppression leur est répercutée.",
      "Elle est détaillée pas à pas sur la page dédiée : atmos-performance.com/suppression-donnees.",
    ],
  },
  {
    id: "version",
    title: "Mise à jour",
    paragraphs: [
      `La présente politique est en vigueur depuis le ${VERSION_DATE}. Toute évolution du dispositif de collecte sera reflétée ici avant sa mise en service.`,
    ],
  },
];

export default function ConfidentialitePage() {
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
          <span className="text-ink">Politique de confidentialité</span>
        </h1>

        <p className="mt-6 text-[0.9rem] leading-relaxed font-light text-dim text-pretty">
          Ce que le site collecte, pourquoi, combien de temps — et comment
          tout retirer. Rien d&apos;autre que ce qui est écrit ici n&apos;est
          collecté.
        </p>

        <div className="mt-14 flex flex-col gap-12">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-mono text-[0.68rem] tracking-[0.24em] text-accent uppercase">
                {section.title}
              </h2>
              <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-[0.92rem] leading-relaxed font-light text-dim text-pretty"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.list && (
                  <ul className="flex flex-col gap-2.5">
                    {section.list.map((line) => (
                      <li
                        key={line}
                        className="text-[0.92rem] leading-relaxed font-light text-dim text-pretty"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Le geste de retrait, au pied de la section Cookies. */}
                {section.id === "cookies" && <GererCookies />}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 border-t border-line pt-8 text-[0.82rem] leading-relaxed font-light text-dimmer text-pretty">
          Voir également nos{" "}
          <Link
            href="/mentions-legales"
            className="text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
          >
            mentions légales
          </Link>{" "}
          et nos{" "}
          <Link
            href="/cgv"
            className="text-dim underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink"
          >
            conditions générales de vente
          </Link>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
