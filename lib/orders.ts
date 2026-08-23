import mysql from "mysql2/promise";
import type Stripe from "stripe";

import { isOrderStatus, type OrderStatus } from "@/lib/order-status";

/**
 * Stockage des commandes, en base MySQL.
 *
 * ## Pourquoi MySQL, et pourquoi celle d'Hostinger
 *
 * L'application tourne sur ce serveur : la base est jointe par `localhost`,
 * sans traversée de réseau, sans démarrage à froid, sans quota d'appels et
 * sans fournisseur supplémentaire à surveiller. Elle est incluse dans
 * l'hébergement déjà payé.
 *
 * ## Deux chemins d'écriture, et pourquoi
 *
 * `recordOrder` est appelée **deux fois** pour une même commande, depuis deux
 * endroits qui ne dépendent pas l'un de l'autre :
 *
 * 1. le **webhook** Stripe, à la réception de `payment_intent.succeeded` ou
 *    `checkout.session.completed` ;
 * 2. la **page de confirmation**, qui relit l'intention côté serveur et
 *    enregistre ce qu'elle y trouve.
 *
 * Le webhook seul ne suffit pas : mal configuré — mauvais secret, mauvais
 * mode, endpoint absent — Stripe ne livre rien du tout. Pas de réessai, pas
 * de journal, pas de ligne. La commande est payée et n'existe nulle part.
 * C'est arrivé, et c'est précisément le trou que ce second chemin comble.
 *
 * L'inverse est vrai aussi : un client qui ferme son onglet avant le retour ne
 * verra jamais la page de confirmation, mais le webhook, lui, arrivera.
 *
 * ## L'idempotence porte sur le paiement, pas sur l'événement
 *
 * La clé unique est la **référence du paiement** — l'identifiant de
 * l'intention, ou celui de la session Checkout — et non l'identifiant de
 * l'événement Stripe. Deux raisons :
 *
 * - les deux chemins ci-dessus doivent converger sur la même ligne, or la
 *   page de confirmation ne voit aucun événement ;
 * - Stripe émet plusieurs événements distincts pour un même paiement, ce qui
 *   aurait créé autant de lignes.
 *
 * C'est la contrainte d'unicité de la base qui tranche, jamais une relecture
 * applicative : entre un `SELECT` et un `INSERT`, deux écritures simultanées
 * passeraient toutes les deux.
 *
 * ## Ce que cette base est, et ce qu'elle n'est pas
 *
 * **Stripe reste la source de vérité.** Chaque paiement y est conservé avec
 * ses métadonnées ; cette table en est une copie interrogeable. La perdre ne
 * perd aucune commande.
 */

/**
 * Statuts de traitement, réexportés depuis `lib/order-status.ts`.
 *
 * Ils y vivent à part pour rester importables par un composant client
 * sans entraîner `mysql2` dans le paquet du navigateur. Réexportés ici
 * pour que `lib/orders` reste le point d'entrée naturel côté serveur.
 */
export {
  isOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  PLAN_LABELS,
  type OrderStatus,
} from "@/lib/order-status";

export type Order = {
  /**
   * Référence du paiement : identifiant de l'intention (`pi_…`) ou de la
   * session Checkout (`cs_…`). **Clé d'idempotence.**
   */
  reference: string;
  /** Événement Stripe à l'origine de l'écriture, quand il y en a un. */
  eventId: string;
  receivedAt: string;
  plan: string;
  paymentStatus: string;
  amountTotal: number;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  options: string;
  /** Location uniquement. */
  startDate?: string;
  endDate?: string;
  /** Achat uniquement. */
  quantity?: string;
  balanceDue?: string;
};

/**
 * Une commande **relue** en base, traitement compris.
 *
 * Distincte d'`Order`, qui décrit ce que les deux chemins d'écriture savent
 * d'un paiement au moment où il arrive. Le statut, le suivi et la note
 * n'existent qu'après, et sont posés par l'administration : les faire entrer
 * dans `Order` obligerait le webhook à inventer une valeur pour des champs
 * qui ne le regardent pas.
 */
export type OrderRecord = Order & {
  /** Clé technique de la ligne. Sert de cible au journal `order_events`. */
  id: number;
  status: OrderStatus;
  trackingNumber: string;
  internalNote: string;
};

/**
 * Une ligne du journal d'une commande.
 *
 * `status` vaut `null` quand l'événement ne change pas d'état — l'ajout d'une
 * note ou d'un numéro de suivi, par exemple.
 */
export type OrderEvent = {
  id: number;
  status: OrderStatus | null;
  note: string;
  createdAt: string;
};

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS orders (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference      VARCHAR(255)    NOT NULL UNIQUE,
    event_id       VARCHAR(255)    NULL,
    received_at    DATETIME        NOT NULL,
    plan           VARCHAR(32)     NOT NULL,
    payment_status VARCHAR(32)     NOT NULL,
    amount_total   INT UNSIGNED    NOT NULL,
    currency       CHAR(3)         NOT NULL,
    email          VARCHAR(254)    NOT NULL,
    first_name     VARCHAR(255)    NOT NULL DEFAULT '',
    last_name      VARCHAR(255)    NOT NULL DEFAULT '',
    phone          VARCHAR(64)     NOT NULL DEFAULT '',
    address        TEXT,
    options        TEXT,
    start_date     VARCHAR(32)     NULL,
    end_date       VARCHAR(32)     NULL,
    quantity       VARCHAR(8)      NULL,
    balance_due    VARCHAR(32)     NULL,
    status         VARCHAR(32)     NOT NULL DEFAULT 'recue',
    tracking_number VARCHAR(128)   NOT NULL DEFAULT '',
    internal_note  TEXT,
    INDEX idx_email (email),
    INDEX idx_received_at (received_at),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

/**
 * Journal des commandes : qui a changé quoi, et quand.
 *
 * Sans lui, une erreur de manipulation est indétectable — une commande
 * repassée « reçue » par mégarde ne laisse aucune trace, et rien ne dit si
 * l'expédition a été saisie avant ou après le colis parti.
 *
 * `order_id` porte une clé étrangère en cascade : supprimer une commande
 * emporte son journal, plutôt que de laisser des lignes orphelines qui
 * mentiraient sur des commandes qui n'existent plus.
 */
const EVENTS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS order_events (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id   BIGINT UNSIGNED NOT NULL,
    status     VARCHAR(32)     NULL,
    note       TEXT,
    created_at DATETIME        NOT NULL,
    INDEX idx_order_id (order_id),
    CONSTRAINT fk_order_events_order
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

/**
 * Rattrapage pour une table créée avant que la clé ne passe de l'événement au
 * paiement. Chaque instruction est jouée puis ignorée si elle a déjà été
 * appliquée : MySQL ne connaît pas `ADD COLUMN IF NOT EXISTS`.
 */
const MIGRATIONS = [
  "ALTER TABLE orders ADD COLUMN reference VARCHAR(255) NOT NULL DEFAULT ''",
  "ALTER TABLE orders ADD UNIQUE INDEX uniq_reference (reference)",
  "ALTER TABLE orders MODIFY event_id VARCHAR(255) NULL",
  "ALTER TABLE orders DROP INDEX event_id",
  // Traitement des commandes : ces trois colonnes n'existaient pas tant que
  // l'espace d'administration n'existait pas.
  "ALTER TABLE orders ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'recue'",
  "ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(128) NOT NULL DEFAULT ''",
  "ALTER TABLE orders ADD COLUMN internal_note TEXT",
  "ALTER TABLE orders ADD INDEX idx_status (status)",
];

/** Erreurs signifiant « c'était déjà fait » : colonne, index ou clé absente. */
const ALREADY_APPLIED = new Set([
  "ER_DUP_FIELDNAME",
  "ER_DUP_KEYNAME",
  "ER_CANT_DROP_FIELD_OR_KEY",
]);

let pool: mysql.Pool | null = null;
let schemaReady: Promise<void> | null = null;

/**
 * Découpe une chaîne de connexion **sans passer par l'analyseur d'URL**.
 *
 * `new URL()` — qu'utilise l'option `uri` de mysql2 — rejette une chaîne dont
 * le mot de passe contient `#`, `?`, `/` ou `@`, caractères que les
 * générateurs d'hébergeurs produisent couramment. L'erreur qui remonte est un
 * laconique « Invalid URL » qui ne dit pas que le coupable est le mot de
 * passe, et un mot de passe robuste ne doit pas mettre l'application par
 * terre.
 *
 * Le découpage se fait donc à la main, dans l'ordre qui lève les ambiguïtés :
 * le **dernier** `@` sépare les identifiants de l'hôte — un `@` dans le mot
 * de passe reste donc du mot de passe —, puis le **premier** `:` sépare
 * l'utilisateur du mot de passe, et le premier `/` isole la base.
 */
function parseConnectionString(raw: string) {
  const withoutScheme = raw.replace(/^mysql(2)?:\/\//, "");

  const at = withoutScheme.lastIndexOf("@");
  if (at === -1) throw new Error("chaîne de connexion sans « @ »");

  const credentials = withoutScheme.slice(0, at);
  const rest = withoutScheme.slice(at + 1);

  const colon = credentials.indexOf(":");
  const user = colon === -1 ? credentials : credentials.slice(0, colon);
  const password = colon === -1 ? "" : credentials.slice(colon + 1);

  const slash = rest.indexOf("/");
  if (slash === -1) throw new Error("chaîne de connexion sans nom de base");

  const hostPort = rest.slice(0, slash);
  const database = rest.slice(slash + 1).split("?")[0];

  const portColon = hostPort.lastIndexOf(":");
  const host = portColon === -1 ? hostPort : hostPort.slice(0, portColon);
  const port =
    portColon === -1 ? 3306 : Number(hostPort.slice(portColon + 1)) || 3306;

  // Un mot de passe peut avoir été encodé par précaution : on le décode si
  // c'est le cas, sans casser celui qui contient un `%` littéral.
  const decode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  return {
    host,
    port,
    user: decode(user),
    password: decode(password),
    database: decode(database),
  };
}

/**
 * Configuration de la base, par variables discrètes ou chaîne de connexion.
 *
 * Les variables discrètes sont **préférées** : elles n'ont aucun caractère à
 * échapper, donc aucun mot de passe ne peut les casser. `DATABASE_URL` reste
 * acceptée pour ne rien changer à une installation qui marche.
 */
/**
 * `localhost` est résolu en IPv6 par Node depuis la version 17.
 *
 * MySQL accorde ses droits par hôte, et `::1` n'est pas `localhost` à ses
 * yeux : un utilisateur créé par l'hébergeur pour `'…'@'localhost'` se voit
 * refuser l'accès avec un « Access denied … @'::1' » qui ne dit pas un mot de
 * la résolution de nom. On force donc l'IPv4, qui correspond aux droits
 * réellement accordés.
 */
function forceIPv4(host: string): string {
  return host === "localhost" ? "127.0.0.1" : host;
}

/**
 * Origine de la configuration effectivement retenue.
 *
 * Exposée par le diagnostic : sans elle, impossible de savoir si une variable
 * `DB_*` oubliée fait retomber la connexion sur `DATABASE_URL` — et donc
 * pourquoi une correction posée dans le panneau semble sans effet.
 */
export function configSource(): "DB_*" | "DATABASE_URL" | "aucune" {
  const { DB_HOST, DB_USER, DB_NAME, DATABASE_URL } = process.env;
  if (DB_HOST && DB_USER && DB_NAME) return "DB_*";
  return DATABASE_URL ? "DATABASE_URL" : "aucune";
}

export function readConfig() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DATABASE_URL } =
    process.env;

  if (DB_HOST && DB_USER && DB_NAME) {
    return {
      host: forceIPv4(DB_HOST),
      port: Number(DB_PORT) || 3306,
      user: DB_USER,
      password: DB_PASSWORD ?? "",
      database: DB_NAME,
    };
  }

  if (!DATABASE_URL) {
    throw new Error(
      "Configuration de la base absente : renseigner DB_HOST, DB_USER, " +
        "DB_PASSWORD et DB_NAME, ou à défaut DATABASE_URL. Voir .env.example.",
    );
  }

  try {
    const parsed = parseConnectionString(DATABASE_URL);
    return { ...parsed, host: forceIPv4(parsed.host) };
  } catch (error) {
    throw new Error(
      `DATABASE_URL illisible (${error instanceof Error ? error.message : "format inattendu"}). ` +
        "Si le mot de passe contient #, ?, / ou @, préférer les variables " +
        "DB_HOST / DB_USER / DB_PASSWORD / DB_NAME, qui n'ont rien à échapper.",
    );
  }
}

/**
 * Réserve de connexions, ouverte à la première commande et pas à l'import.
 *
 * Se connecter au chargement du module ferait échouer le build : `next build`
 * exécute les modules pour tracer les dépendances, sans base à disposition.
 */
function getPool(): mysql.Pool {
  if (pool) return pool;

  pool = mysql.createPool({
    ...readConfig(),
    connectionLimit: 3,
    waitForConnections: true,
    // Mieux vaut échouer vite — et laisser Stripe réessayer — que retenir la
    // fonction jusqu'au délai d'exécution du serveur.
    connectTimeout: 8_000,
    timezone: "Z",
  });

  return pool;
}

function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const db = getPool();
    await db.query(SCHEMA);

    for (const statement of MIGRATIONS) {
      try {
        await db.query(statement);
      } catch (error) {
        if (!ALREADY_APPLIED.has((error as { code?: string }).code ?? "")) {
          throw error;
        }
      }
    }

    // Après les migrations, jamais avant : la clé étrangère vise `orders.id`,
    // dont la table doit être en place et à jour.
    await db.query(EVENTS_SCHEMA);
  })().catch((error) => {
    // Une préparation ratée ne doit pas rester mémorisée comme réussie : on
    // remet le drapeau à zéro pour que la commande suivante réessaie.
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}

/** `2026-08-22T08:10:29.000Z` → `2026-08-22 08:10:29`, ce que MySQL attend. */
function toMysqlDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 19).replace("T", " ");
}

function meta(source: { metadata?: Stripe.Metadata | null }, key: string) {
  return source.metadata?.[key] ?? "";
}

/**
 * Construit la commande à partir d'une intention de paiement.
 *
 * Partagée par le webhook et la page de confirmation : les deux chemins
 * doivent produire exactement la même ligne, sans quoi la seconde écriture
 * réécrirait la première avec d'autres valeurs — ou pire, divergerait sans
 * qu'on s'en aperçoive.
 */
export function orderFromIntent(
  intent: Stripe.PaymentIntent,
  eventId = "",
): Order {
  return {
    reference: intent.id,
    eventId,
    receivedAt: new Date().toISOString(),
    // Le tunnel intégré ne sert que l'achat ; la location garde le tunnel
    // hébergé, son empreinte bancaire exigeant une session Checkout.
    plan: meta(intent, "plan") || "achat",
    paymentStatus: "paid",
    amountTotal: intent.amount_received || intent.amount,
    currency: intent.currency,
    email: intent.receipt_email ?? meta(intent, "email"),
    firstName: meta(intent, "firstName"),
    lastName: meta(intent, "lastName"),
    phone: meta(intent, "phone"),
    address: meta(intent, "address"),
    options: meta(intent, "options"),
    quantity: meta(intent, "quantity"),
  };
}

function toOrderRecord(row: mysql.RowDataPacket): OrderRecord {
  return {
    id: Number(row.id),
    reference: row.reference,
    eventId: row.event_id ?? "",
    receivedAt: new Date(row.received_at).toISOString(),
    plan: row.plan,
    paymentStatus: row.payment_status,
    amountTotal: Number(row.amount_total),
    currency: row.currency,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    address: row.address ?? "",
    options: row.options ?? "",
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    quantity: row.quantity ?? undefined,
    balanceDue: row.balance_due ?? undefined,
    // Une ligne écrite avant la migration n'a pas de statut : elle vient
    // d'arriver et n'a pas été traitée, donc « reçue ».
    status: isOrderStatus(row.status) ? row.status : "recue",
    trackingNumber: row.tracking_number ?? "",
    internalNote: row.internal_note ?? "",
  };
}

/* ══════════════════════════════════════════════════════════════════════
   Lecture pour l'espace d'administration

   Pensée pour des milliers de lignes, pas pour vingt-cinq. Aucune fonction
   ci-dessous ne rapatrie la table entière : la pagination est faite par la
   base, qui sait le faire, et les filtres descendent dans le `WHERE` plutôt
   que d'être appliqués en mémoire sur un tableau déjà chargé.
   ══════════════════════════════════════════════════════════════════════ */

export type OrderSort = "date" | "montant";
export type SortDirection = "asc" | "desc";

export type OrderQuery = {
  /** Cherche dans l'email, la référence de paiement, le nom et le prénom. */
  search?: string;
  status?: OrderStatus | null;
  /** `achat` ou `leasing` — les deux formules du tunnel. */
  plan?: string | null;
  /** Jours civils inclusifs, au format `AAAA-MM-JJ`. */
  from?: string | null;
  to?: string | null;
  sort?: OrderSort;
  direction?: SortDirection;
  page?: number;
  perPage?: number;
};

/** Taille de page. Cinquante lignes tiennent à l'écran sans scroll infini. */
export const ORDERS_PER_PAGE = 50;

/**
 * Plafond de l'export CSV.
 *
 * L'export n'est pas paginé — c'est tout l'intérêt — mais il n'a pas non plus
 * à pouvoir vider la table dans la mémoire du serveur sur un filtre trop
 * large. Dix mille lignes couvrent très largement le besoin réel et bornent
 * la casse.
 */
export const EXPORT_LIMIT = 10_000;

/**
 * Construit la clause `WHERE` commune à la liste, au compte et à l'export.
 *
 * Les trois **doivent** filtrer identiquement : un export qui ne rendrait pas
 * exactement les lignes affichées serait pire qu'une absence d'export.
 * D'où cette fonction unique, et les paramètres liés — jamais de valeur
 * concaténée dans le SQL.
 */
function buildFilters(query: OrderQuery): { sql: string; values: unknown[] } {
  const clauses: string[] = [];
  const values: unknown[] = [];

  const search = query.search?.trim();
  if (search) {
    // `LIKE` avec joker des deux côtés : la recherche sert à retrouver « le
    // Dupont de mardi » à partir d'un fragment, pas à faire de l'analyse.
    // Les caractères propres à `LIKE` sont échappés, sans quoi un `%` saisi
    // par erreur rapporterait toute la table.
    const pattern = `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    clauses.push(
      "(email LIKE ? OR reference LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name, ' ', last_name) LIKE ?)",
    );
    values.push(pattern, pattern, pattern, pattern, pattern);
  }

  if (query.status) {
    clauses.push("status = ?");
    values.push(query.status);
  }

  if (query.plan) {
    clauses.push("plan = ?");
    values.push(query.plan);
  }

  if (query.from) {
    clauses.push("received_at >= ?");
    values.push(`${query.from} 00:00:00`);
  }

  if (query.to) {
    // Borne haute **inclusive** : `<= '2026-08-22'` exclurait toute la
    // journée du 22, ce qui est exactement l'inverse de ce qu'on attend d'un
    // filtre « jusqu'au 22 ».
    clauses.push("received_at <= ?");
    values.push(`${query.to} 23:59:59`);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

/** Colonnes de tri autorisées, par nom public. */
const SORT_COLUMNS: Record<OrderSort, string> = {
  date: "received_at",
  montant: "amount_total",
};

export type OrdersPage = {
  orders: OrderRecord[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

/**
 * Une page de commandes, et le total correspondant aux filtres.
 *
 * Le total vient d'un `COUNT(*)` séparé, pas de la longueur du tableau :
 * c'est lui qui donne le nombre de pages et le libellé « 128 commandes »,
 * qu'aucune page de cinquante lignes ne peut connaître.
 */
export async function searchOrders(query: OrderQuery): Promise<OrdersPage> {
  await ensureSchema();

  const perPage = Math.min(Math.max(query.perPage ?? ORDERS_PER_PAGE, 1), 200);
  const requestedPage = Math.max(query.page ?? 1, 1);

  const { sql: where, values } = buildFilters(query);
  const db = getPool();

  const [countRows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM orders ${where}`,
    values,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const pageCount = Math.max(Math.ceil(total / perPage), 1);

  // Un filtre resserré depuis la page 7 ramènerait sur une page vide : on
  // ramène la demande dans les bornes plutôt que d'afficher un tableau vide
  // sous un compteur qui annonce des résultats.
  const page = Math.min(requestedPage, pageCount);

  const column = SORT_COLUMNS[query.sort ?? "date"] ?? SORT_COLUMNS.date;
  const direction = query.direction === "asc" ? "ASC" : "DESC";

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    // `column` et `direction` viennent d'une table de correspondance fermée,
    // jamais de l'URL : MySQL n'accepte pas de paramètre lié à cet endroit.
    // Le tri secondaire sur `id` rend l'ordre total — sans lui, deux
    // commandes du même instant peuvent changer de place d'une page à
    // l'autre et l'une des deux disparaît de la pagination.
    `SELECT * FROM orders ${where} ORDER BY ${column} ${direction}, id DESC LIMIT ? OFFSET ?`,
    [...values, perPage, (page - 1) * perPage],
  );

  return {
    orders: rows.map(toOrderRecord),
    total,
    page,
    perPage,
    pageCount,
  };
}

/** Toutes les lignes correspondant aux filtres, pour l'export CSV. */
export async function listOrdersForExport(
  query: OrderQuery,
): Promise<OrderRecord[]> {
  await ensureSchema();

  const { sql: where, values } = buildFilters(query);
  const column = SORT_COLUMNS[query.sort ?? "date"] ?? SORT_COLUMNS.date;
  const direction = query.direction === "asc" ? "ASC" : "DESC";

  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    `SELECT * FROM orders ${where} ORDER BY ${column} ${direction}, id DESC LIMIT ?`,
    [...values, EXPORT_LIMIT],
  );

  return rows.map(toOrderRecord);
}

/** Une commande, par sa référence de paiement. `null` si elle n'existe pas. */
export async function getOrder(reference: string): Promise<OrderRecord | null> {
  await ensureSchema();

  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM orders WHERE reference = ? LIMIT 1",
    [reference],
  );

  return rows[0] ? toOrderRecord(rows[0]) : null;
}

/** Le journal d'une commande, du plus récent au plus ancien. */
export async function listOrderEvents(
  orderId: number,
): Promise<OrderEvent[]> {
  await ensureSchema();

  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT id, status, note, created_at FROM order_events WHERE order_id = ? ORDER BY created_at DESC, id DESC",
    [orderId],
  );

  return rows.map((row) => ({
    id: Number(row.id),
    status: isOrderStatus(row.status) ? row.status : null,
    note: row.note ?? "",
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

/* ══════════════════════════════════════════════════════════════════════
   Écriture depuis l'administration

   Chaque modification laisse une ligne dans `order_events`. C'est la seule
   façon de répondre à « pourquoi cette commande est-elle repassée en
   fabrication ? » trois semaines plus tard.
   ══════════════════════════════════════════════════════════════════════ */

/** Journalise, en réutilisant la connexion de l'appelant s'il en tient une. */
async function logEvent(
  runner: mysql.Pool | mysql.PoolConnection,
  orderId: number,
  status: OrderStatus | null,
  note: string,
) {
  await runner.execute(
    "INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP())",
    [orderId, status, note],
  );
}

/**
 * Change le statut d'une ou plusieurs commandes, et journalise chacune.
 *
 * Le lot passe par **une transaction** : une série entière qui part en
 * fabrication doit basculer en entier ou pas du tout. Un lot à moitié
 * appliqué, avec un journal à moitié écrit, est le pire des trois états
 * possibles — on ne saurait plus ce qui a été fait.
 *
 * Renvoie le nombre de commandes réellement modifiées : les références
 * inconnues sont ignorées en silence, et une commande déjà dans le statut
 * demandé ne compte pas.
 */
export async function updateOrderStatus(
  references: string[],
  status: OrderStatus,
  note = "",
): Promise<number> {
  if (references.length === 0) return 0;

  await ensureSchema();

  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();

    const placeholders = references.map(() => "?").join(", ");
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT id, status FROM orders WHERE reference IN (${placeholders})`,
      references,
    );

    // Seules les commandes qui changent réellement d'état sont touchées :
    // repasser « expédiée » à « expédiée » n'est pas un événement, et
    // polluerait le journal d'une ligne sans information.
    const changing = rows.filter((row) => row.status !== status);
    if (changing.length === 0) {
      await connection.commit();
      return 0;
    }

    const ids = changing.map((row) => Number(row.id));
    const idPlaceholders = ids.map(() => "?").join(", ");
    await connection.execute(
      `UPDATE orders SET status = ? WHERE id IN (${idPlaceholders})`,
      [status, ...ids],
    );

    for (const id of ids) {
      await logEvent(connection, id, status, note);
    }

    await connection.commit();
    return ids.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    // Toujours rendue, y compris en erreur : la réserve n'ouvre que trois
    // connexions, en retenir une suffit à figer l'application entière.
    connection.release();
  }
}

/**
 * Numéro de suivi et note interne, les deux champs libres de la fiche.
 *
 * Ils sont écrits ensemble parce qu'ils sont saisis ensemble, dans le même
 * formulaire : deux actions distinctes produiraient deux lignes de journal
 * pour un seul geste de l'utilisateur.
 */
export async function updateOrderDetails(
  reference: string,
  { trackingNumber, internalNote }: { trackingNumber: string; internalNote: string },
): Promise<boolean> {
  await ensureSchema();

  const db = getPool();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    "SELECT id, tracking_number, internal_note FROM orders WHERE reference = ? LIMIT 1",
    [reference],
  );

  const row = rows[0];
  if (!row) return false;

  await db.execute(
    "UPDATE orders SET tracking_number = ?, internal_note = ? WHERE id = ?",
    [trackingNumber, internalNote, row.id],
  );

  const changes: string[] = [];
  if ((row.tracking_number ?? "") !== trackingNumber) {
    changes.push(
      trackingNumber ? `suivi : ${trackingNumber}` : "suivi effacé",
    );
  }
  if ((row.internal_note ?? "") !== internalNote) {
    changes.push(internalNote ? "note interne modifiée" : "note interne effacée");
  }

  // Pas de ligne de journal quand rien n'a bougé : un formulaire renvoyé
  // sans modification n'est pas un événement.
  if (changes.length > 0) {
    await logEvent(db, Number(row.id), null, changes.join(" · "));
  }

  return true;
}

/** Répartition par statut, pour les compteurs en tête de liste. */
export async function countOrdersByStatus(): Promise<
  Record<OrderStatus, number>
> {
  await ensureSchema();

  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT status, COUNT(*) AS total FROM orders GROUP BY status",
  );

  const counts: Record<OrderStatus, number> = {
    recue: 0,
    en_fabrication: 0,
    expediee: 0,
    annulee: 0,
  };

  for (const row of rows) {
    if (isOrderStatus(row.status)) counts[row.status] = Number(row.total);
  }

  return counts;
}

/**
 * Enregistre une commande, en ignorant les doublons.
 *
 * Appelée par le webhook **et** par la page de confirmation, éventuellement en
 * même temps. C'est la contrainte d'unicité sur `reference` qui départage :
 * la seconde écriture repart avec « deja-traitee » sans rien écraser.
 */
export async function recordOrder(
  order: Order,
): Promise<"enregistree" | "deja-traitee"> {
  try {
    await ensureSchema();

    await getPool().execute(
      `INSERT INTO orders (
         reference, event_id, received_at, plan, payment_status,
         amount_total, currency, email, first_name, last_name,
         phone, address, options, start_date, end_date, quantity, balance_due
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.reference,
        order.eventId || null,
        toMysqlDate(order.receivedAt),
        order.plan,
        order.paymentStatus,
        order.amountTotal,
        order.currency,
        order.email,
        order.firstName,
        order.lastName,
        order.phone,
        order.address,
        order.options,
        order.startDate ?? null,
        order.endDate ?? null,
        order.quantity ?? null,
        order.balanceDue ?? null,
      ],
    );

    return "enregistree";
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return "deja-traitee";
    }

    // Base injoignable, quota atteint, schéma refusé : la commande est payée,
    // elle ne doit pas disparaître avec l'erreur. On l'écrit en entier dans
    // les journaux avant de propager — l'appelant décide alors quoi faire.
    console.error(
      "Écriture en base impossible — commande payée à reprendre à la main :",
      JSON.stringify(order),
    );
    throw error;
  }
}

/**
 * Nombre de commandes enregistrées, et rien d'autre.
 *
 * Sert au diagnostic : vérifier que `DATABASE_URL` est bonne, que le schéma
 * est en place et que les écritures arrivent, sans jamais exposer une
 * coordonnée client.
 */
export async function countOrders(): Promise<number> {
  await ensureSchema();

  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM orders",
  );

  return Number(rows[0]?.total ?? 0);
}
