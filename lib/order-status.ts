/**
 * Statuts de traitement, isolés de l'accès à la base.
 *
 * Ces quatre valeurs sont lues des deux côtés de la frontière : le serveur
 * les écrit en base, l'interface les affiche et les propose dans ses filtres.
 * Elles vivaient d'abord dans `lib/orders.ts` — et le premier composant
 * client à importer `isOrderStatus` aurait tiré `mysql2`, donc `net` et
 * `tls`, dans le paquet du navigateur.
 *
 * `lib/orders.ts` les réexporte, si bien qu'aucun appelant existant n'a à
 * changer d'import — même arrangement que `lib/format.ts` et
 * `lib/altitude.ts`.
 */

/**
 * Où en est le traitement d'une commande.
 *
 * Volontairement distinct du statut de paiement, qui décrit ce que Stripe
 * sait du règlement. Une commande peut être payée et pas encore fabriquée, ou
 * annulée après remboursement : mélanger les deux axes rendrait l'un des deux
 * illisible.
 *
 * Quatre valeurs, pas une de plus. Chaque état supplémentaire est un état
 * qu'il faut apprendre, documenter, et tenir aligné entre la base,
 * l'interface et l'export.
 */
export const ORDER_STATUSES = [
  "recue",
  "en_fabrication",
  "expediee",
  "annulee",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Libellés affichés. Source unique : liste, fiche, journal, export CSV. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recue: "Reçue",
  en_fabrication: "En fabrication",
  expediee: "Expédiée",
  annulee: "Annulée",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (ORDER_STATUSES as readonly unknown[]).includes(value);
}

/**
 * Les deux formules du tunnel, telles qu'elles sont écrites en métadonnées
 * Stripe par `app/api/checkout/route.ts` et `app/api/payment-intent/route.ts`.
 */
export const PLAN_LABELS: Record<string, string> = {
  achat: "Achat",
  leasing: "Location",
};
