// Deux imports, et c'est délibéré. Ce module est lu par des composants
// clients : `isOrderStatus` doit venir de `lib/order-status`, qui ne connaît
// pas la base. Les types, eux, peuvent venir de `lib/orders` — un `import
// type` est effacé à la compilation et n'entraîne rien dans le paquet, alors
// qu'un import mixte garderait `mysql2` accroché.
import { isOrderStatus } from "@/lib/order-status";
import type { OrderQuery, OrderSort, SortDirection } from "@/lib/orders";

/**
 * Les filtres de la liste vivent dans l'URL, et nulle part ailleurs.
 *
 * Trois conséquences, toutes voulues : une recherche se partage par copier-
 * coller, le retour arrière du navigateur refait exactement la vue
 * précédente, et l'export CSV n'a rien à réimplémenter — il relit la même
 * chaîne de requête que la page et appelle la même fonction de filtrage.
 *
 * Les noms de paramètres sont en français, comme le reste de l'interface. Ils
 * sont lus par un humain dans la barre d'adresse plus souvent qu'ils ne sont
 * écrits par du code.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

/** Première valeur d'un paramètre, qu'il soit répété ou non. */
function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
}

/**
 * Jour civil `AAAA-MM-JJ`, ou `null`.
 *
 * Validé par motif et non par `new Date()` : `new Date("2026-13-45")` ne lève
 * pas, elle décale sur février de l'année suivante — et le filtre porterait
 * silencieusement sur une plage que personne n'a demandée.
 */
function day(value: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/** Longueur maximale de la recherche : au-delà, ce n'est plus une recherche. */
const MAX_SEARCH_LENGTH = 120;

export type AdminFilters = OrderQuery & {
  search: string;
  status: OrderQuery["status"];
  plan: string | null;
  from: string | null;
  to: string | null;
  sort: OrderSort;
  direction: SortDirection;
  page: number;
};

/**
 * Lit les filtres d'une chaîne de requête.
 *
 * Tout paramètre inconnu ou mal formé retombe sur sa valeur par défaut,
 * jamais sur une erreur : une URL tronquée par un client de messagerie doit
 * afficher la liste, pas une page cassée.
 */
export function readFilters(params: SearchParams): AdminFilters {
  const status = one(params.statut);
  const plan = one(params.plan);
  const sort = one(params.tri);
  const page = Number(one(params.page));

  return {
    search: one(params.q).slice(0, MAX_SEARCH_LENGTH),
    status: isOrderStatus(status) ? status : null,
    // Les deux seules formules du tunnel : voir `app/api/checkout/route.ts`.
    plan: plan === "achat" || plan === "leasing" ? plan : null,
    from: day(one(params.du)),
    to: day(one(params.au)),
    sort: sort === "montant" ? "montant" : "date",
    // Par défaut la plus récente en tête : c'est celle qu'on vient traiter.
    direction: one(params.sens) === "asc" ? "asc" : "desc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/**
 * Réécrit une chaîne de requête à partir des filtres, en omettant les valeurs
 * par défaut.
 *
 * L'URL reste lisible : `?q=dupont` plutôt que
 * `?q=dupont&statut=&plan=&du=&au=&tri=date&sens=desc&page=1`. Ce n'est pas
 * de la cosmétique — une URL courte se lit d'un coup d'œil et se partage.
 */
export function toQueryString(
  filters: Partial<AdminFilters>,
  overrides: Partial<AdminFilters> = {},
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.search) params.set("q", merged.search);
  if (merged.status) params.set("statut", merged.status);
  if (merged.plan) params.set("plan", merged.plan);
  if (merged.from) params.set("du", merged.from);
  if (merged.to) params.set("au", merged.to);
  if (merged.sort && merged.sort !== "date") params.set("tri", merged.sort);
  if (merged.direction === "asc") params.set("sens", "asc");
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));

  const query = params.toString();
  return query ? `?${query}` : "";
}

/** `true` si au moins un filtre est actif — sert le bouton « Tout effacer ». */
export function hasActiveFilters(filters: AdminFilters): boolean {
  return Boolean(
    filters.search || filters.status || filters.plan || filters.from || filters.to,
  );
}
