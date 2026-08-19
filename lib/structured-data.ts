/**
 * Constructeurs de graphes Schema.org.
 *
 * Tout le balisage du site passe par ici, pour deux raisons : les identifiants
 * de nœuds (`@id`) doivent rester cohérents d'une page à l'autre pour que
 * Google relie l'éditeur, la marque et le vendeur à une seule et même entité ;
 * et les valeurs (prix, description, comptes sociaux) doivent venir des mêmes
 * constantes que les pages, sous peine de diverger silencieusement.
 *
 * Règle absolue : ne jamais déclarer ici ce que la page n'affiche pas. Google
 * rejette — et peut sanctionner — un balisage qui promet un contenu absent.
 */

import { PURCHASE_PRICE_EUR } from "@/lib/offering";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_URLS,
} from "@/lib/site";

/**
 * Identifiants stables des entités globales. Les autres schémas y renvoient
 * au lieu de recopier l'organisation, ce qui évite à Google d'hésiter entre
 * plusieurs marques homonymes.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Fiche d'identité de la marque, posée une fois dans le layout racine. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: "ATMOS",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.svg`,
      caption: SITE_NAME,
    },
    sameAs: Object.values(SOCIAL_URLS),
  };
}

/**
 * Le site lui-même.
 *
 * Sans `potentialAction` : la `SearchAction` ne se déclare que si le site
 * expose une vraie recherche interne, ce qui n'est pas le cas ici. La déclarer
 * à vide reviendrait à annoncer une page qui répondrait 404.
 */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "fr-FR",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * Le générateur, avec son offre de pré-vente.
 *
 * Ni `aggregateRating` ni `review` : l'appareil n'est pas encore livré, donc
 * pas encore noté. Inventer des étoiles est le manquement que Google
 * sanctionne le plus durement.
 */
export function productSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/#product`,
    name: "ATMOS ONE",
    description:
      "Générateur d'hypoxie normobare pour l'entraînement en altitude, l'optimisation de la VO2 max et la régénération cellulaire.",
    image: `${SITE_URL}/generator.png`,
    category: "Sporting Goods > Training & Fitness",
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    manufacturer: { "@id": ORGANIZATION_ID },
    offers: {
      "@type": "Offer",
      // Deux décimales : le format attendu par Google pour un prix.
      price: PURCHASE_PRICE_EUR.toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: "2027-12-31",
      url: SITE_URL,
      seller: { "@id": ORGANIZATION_ID },
    },
  };
}

export type FaqEntry = { question: string; answer: string[] };

/**
 * Questions fréquentes.
 *
 * Prend le tableau qui alimente déjà l'accordéon : le balisage et l'affichage
 * ne peuvent donc pas diverger, ce qu'exige Google. Les paragraphes sont
 * recollés en un seul texte, `acceptedAnswer` n'en acceptant qu'un.
 */
export function faqPageSchema(entries: readonly FaqEntry[], pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    inLanguage: "fr-FR",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer.join(" "),
      },
    })),
  };
}

export type Crumb = { name: string; url?: string };

/**
 * Fil d'Ariane.
 *
 * L'`item` est facultatif : on l'omet pour le dernier maillon — la page
 * courante, que Google connaît déjà — comme pour un palier intermédiaire qui
 * n'a pas de page à lui. Mieux vaut un maillon sans URL qu'une URL en 404,
 * que Google écarterait avec le fil entier.
 */
export function breadcrumbSchema(trail: readonly Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.url ? { item: crumb.url } : {}),
    })),
  };
}
