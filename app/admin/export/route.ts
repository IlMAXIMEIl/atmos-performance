import { hasAdminSession } from "@/lib/admin-session";
import { readFilters } from "@/lib/admin-filters";
import { formatDay, formatParisDateTime } from "@/lib/format";
import {
  EXPORT_LIMIT,
  listOrdersForExport,
  ORDER_STATUS_LABELS,
  PLAN_LABELS,
  type OrderRecord,
} from "@/lib/orders";

/**
 * Export CSV de la sélection courante.
 *
 * Une lecture, donc un GET — la règle « aucun changement d'état par GET » ne
 * concerne que les écritures. La route relit la **même** chaîne de requête que
 * la liste et appelle la même fonction de filtrage : le fichier contient
 * exactement les lignes affichées, filtres et tri compris. Un export qui
 * divergerait de l'écran serait pire que pas d'export du tout.
 */

/**
 * Séparateur `;` et marque d'ordre des octets.
 *
 * Excel en français lit le CSV avec le séparateur de liste du système, qui
 * est le point-virgule : une virgule y colle toute la ligne dans la première
 * colonne. Et sans BOM, il devine l'encodage — mal — ce qui transforme chaque
 * accent en `Ã©` jusque dans les adresses de livraison. Les deux ensemble
 * font un fichier qui s'ouvre correctement au double-clic, sans assistant
 * d'importation.
 */
const SEPARATOR = ";";
const BOM = "\uFEFF";

const COLUMNS = [
  "Date",
  "Référence",
  "Statut",
  "Formule",
  "Quantité",
  "Montant",
  "Devise",
  "Prénom",
  "Nom",
  "Email",
  "Téléphone",
  "Adresse",
  "Options",
  "Début location",
  "Fin location",
  "Solde dû",
  "Paiement",
  "Numéro de suivi",
  "Note interne",
] as const;

/**
 * Neutralise une cellule que le tableur exécuterait.
 *
 * Excel et LibreOffice interprètent comme formule toute cellule commençant
 * par `=`, `+`, `-` ou `@`. Or nom, adresse et options viennent des
 * métadonnées Stripe, c'est-à-dire de ce que le client a saisi : un champ
 * `=HYPERLINK("http://…"&A1)` s'exécuterait à l'ouverture du fichier, sur le
 * poste de l'opérateur, avec le contenu de la commande. L'apostrophe en tête
 * est la parade reconnue — elle force le mode texte et n'apparaît pas dans la
 * cellule affichée.
 */
function neutralise(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/**
 * Échappe une cellule.
 *
 * Guillemets doublés et cellule encadrée dès qu'elle contient un séparateur,
 * un guillemet ou un retour à la ligne — une note interne multiligne, par
 * exemple, qui casserait sinon le fichier en deux au milieu d'une ligne.
 */
function cell(value: string | number | undefined | null): string {
  const raw = neutralise(String(value ?? ""));
  return /[";\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

/** Les montants de l'export sont en euros décimaux, virgule française. */
function amount(cents: number): string {
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}

function toRow(order: OrderRecord): string {
  return [
    formatParisDateTime(order.receivedAt),
    order.reference,
    ORDER_STATUS_LABELS[order.status],
    PLAN_LABELS[order.plan] ?? order.plan,
    order.quantity ?? "",
    amount(order.amountTotal),
    order.currency.toUpperCase(),
    order.firstName,
    order.lastName,
    order.email,
    order.phone,
    order.address,
    order.options,
    order.startDate ? formatDay(order.startDate) : "",
    order.endDate ? formatDay(order.endDate) : "",
    order.balanceDue ?? "",
    order.paymentStatus,
    order.trackingNumber,
    order.internalNote,
  ]
    .map(cell)
    .join(SEPARATOR);
}

export async function GET(request: Request) {
  /*
    Pas de `requireAdmin()` ici.

    Il redirige, et une redirection vers une page HTML au bout d'un
    téléchargement donne un fichier `.csv` qui contient le formulaire de
    connexion. Une route d'API répond par un code, pas par une page.
  */
  if (!(await hasAdminSession())) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const url = new URL(request.url);
  const filters = readFilters(Object.fromEntries(url.searchParams));

  try {
    const orders = await listOrdersForExport(filters);

    const lines = [
      COLUMNS.join(SEPARATOR),
      ...orders.map(toRow),
      // Le plafond est atteint : le dire dans le fichier, sinon l'opérateur
      // travaille sur un export tronqué en croyant l'avoir en entier.
      ...(orders.length === EXPORT_LIMIT
        ? [
            cell(
              `Export limité à ${EXPORT_LIMIT} lignes — resserrez les filtres pour le reste.`,
            ),
          ]
        : []),
    ];

    // Nom de fichier daté : trois exports dans la même journée ne doivent pas
    // s'écraser dans le dossier de téléchargements.
    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(BOM + lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="commandes-${stamp}.csv"`,
        // Un export est un instantané : il ne doit jamais être resservi
        // depuis un cache, ni par le navigateur ni par le CDN.
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export CSV impossible", error);
    return new Response("Export impossible : la base n'a pas répondu.", {
      status: 503,
    });
  }
}
