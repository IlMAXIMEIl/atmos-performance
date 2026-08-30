import { PURCHASE_PRICE_EUR } from "@/lib/offering";

/**
 * Le catalogue : ce qui se vend, et à quel prix.
 *
 * ## Pourquoi ce fichier existe
 *
 * Le tunnel ne savait vendre qu'une chose — le kit — et comptait les options
 * sans les facturer : `optionIdsMeta` les écrivait dans les métadonnées Stripe
 * et le montant restait `PURCHASE_PRICE_EUR * quantité`. Un client qui voulait
 * l'oxymètre ne pouvait pas le payer. Ce fichier répare exactement ça.
 *
 * ## Il est la seule autorité sur les prix
 *
 * Le navigateur affiche des montants, il n'en décide aucun. `/api/payment-intent`
 * relit ce catalogue pour chaque ligne reçue et recalcule la somme : un panier
 * bricolé dans la console ne peut rien obtenir d'autre que le tarif public.
 * C'est la même règle que `PURCHASE_PRICE_EUR` depuis le premier jour, étendue
 * à tout ce qui s'ajoute au kit.
 *
 * ## Le kit reste indexé sur `offering.ts`
 *
 * Le prix du générateur ne se retape pas ici : il vient de
 * `PURCHASE_PRICE_EUR`, qui pilote déjà la carte d'offre, le simulateur et les
 * données structurées. Une série qui change de tarif change une constante, et
 * le panier suit.
 *
 * ## Les tarifs des accessoires sont des cibles, pas des relevés
 *
 * Ils viennent du plan de gamme et n'ont pas encore été confrontés aux coûts
 * fournisseur réels. Les corriger, c'est éditer les lignes ci-dessous — rien
 * d'autre dans le code ne les connaît.
 */

export type SkuKind = "kit" | "option" | "accessoire";

export type Sku = {
  id: string;
  name: string;
  /** Ce que la ligne apporte, en une phrase. Affiché sous le nom. */
  blurb: string;
  priceEur: number;
  kind: SkuKind;
  /**
   * Une option n'a de sens qu'attachée à un kit : l'oxymètre pilote un
   * protocole, il ne se vend pas seul à quelqu'un qui n'a pas la machine.
   * Le volet le rappelle, et le serveur le refuse.
   */
  requiresKit: boolean;
  maxQuantity: number;
};

/** L'identifiant du kit, cité par le volet et par les routes de paiement. */
export const KIT_SKU = "kit";

export const CATALOG: Record<string, Sku> = {
  [KIT_SKU]: {
    id: KIT_SKU,
    name: "Kit ATMOS ONE",
    blurb: "Générateur, tente, masque, circuit et protocoles guidés.",
    priceEur: PURCHASE_PRICE_EUR,
    kind: "kit",
    requiresKit: false,
    maxQuantity: 5,
  },
  oxymetre: {
    id: "oxymetre",
    name: "Oxymètre de pouls",
    blurb: "L'arbitre du protocole : il mesure la SpO₂ séance après séance.",
    priceEur: 129,
    kind: "option",
    requiresKit: true,
    maxQuantity: 5,
  },
  monitoring: {
    id: "monitoring",
    name: "Système de monitoring",
    blurb: "Suivi continu des paliers et des relevés, séance par séance.",
    priceEur: 299,
    kind: "option",
    requiresKit: true,
    maxQuantity: 5,
  },
  tente: {
    id: "tente",
    name: "Tente d'altitude supplémentaire",
    blurb: "200 × 150 × 150 cm. Une seconde tente, ou le remplacement de la vôtre.",
    priceEur: 899,
    kind: "accessoire",
    requiresKit: false,
    maxQuantity: 3,
  },
  filtres: {
    id: "filtres",
    name: "Kit de filtres — 1 an",
    blurb: "Pièces d'usure. Le débit de 100 L/min tient à leur remplacement.",
    priceEur: 89,
    kind: "accessoire",
    requiresKit: false,
    maxQuantity: 5,
  },
};

/** Les identifiants du catalogue, dans l'ordre d'affichage du volet. */
export const CATALOG_ORDER = [
  KIT_SKU,
  "oxymetre",
  "monitoring",
  "tente",
  "filtres",
] as const;

export function getSku(id: string): Sku | null {
  return Object.hasOwn(CATALOG, id) ? CATALOG[id] : null;
}

/** Ce qui s'ajoute au kit, pour la section « Compléter » du volet. */
export function addOns(): Sku[] {
  return CATALOG_ORDER.map((id) => CATALOG[id]).filter(
    (sku) => sku.kind !== "kit",
  );
}
