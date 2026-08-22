import mysql from "mysql2/promise";

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
 * Les offres gratuites d'ailleurs ont toutes le même défaut pour cet usage :
 * elles mettent le projet en veille après quelques jours sans trafic. Un
 * webhook de paiement est précisément ce qui se déclenche rarement et doit
 * répondre à coup sûr — c'est le mauvais endroit pour un réveil à froid.
 *
 * ## Ce que cette base est, et ce qu'elle n'est pas
 *
 * **Stripe reste la source de vérité.** Chaque paiement y est conservé avec
 * ses métadonnées ; cette table en est une copie interrogeable — pour trier,
 * exporter, recouper — pas l'unique exemplaire. Perdre cette base ne perd
 * aucune commande.
 *
 * ## Filet de sécurité
 *
 * `recordOrder` journalise la commande entière avant de propager une erreur
 * d'écriture. La commande est déjà payée à cet instant : si la base est
 * injoignable, elle reste récupérable dans les journaux, et le 500 renvoyé
 * fait réessayer Stripe.
 */

export type Order = {
  /** Identifiant de l'événement Stripe : sert de clé d'idempotence. */
  eventId: string;
  sessionId: string;
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
 * Le schéma, appliqué une fois par processus.
 *
 * `CREATE TABLE IF NOT EXISTS` plutôt qu'un outil de migration : il y a une
 * table, et l'hébergement ne propose pas d'étape de déploiement où faire
 * tourner des migrations. La contrainte d'unicité sur `event_id` **est** le
 * mécanisme d'idempotence — Stripe relivre le même événement en cas de
 * délai dépassé, et c'est la base qui refuse le doublon, pas une relecture
 * applicative sujette aux courses.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS orders (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id       VARCHAR(255)    NOT NULL UNIQUE,
    session_id     VARCHAR(255)    NOT NULL,
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
    INDEX idx_email (email),
    INDEX idx_received_at (received_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

let pool: mysql.Pool | null = null;
let schemaReady: Promise<void> | null = null;

/**
 * Réserve de connexions, ouverte à la première commande et pas à l'import.
 *
 * Se connecter au chargement du module ferait échouer le build : `next build`
 * exécute les modules pour tracer les dépendances, sans base à disposition.
 */
function getPool(): mysql.Pool {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL absente : voir .env.example. Format attendu : " +
        "mysql://utilisateur:motdepasse@localhost:3306/nom_de_base",
    );
  }

  pool = mysql.createPool({
    uri: url,
    // Une commande à la fois, quelques secondes par requête : trois
    // connexions suffisent largement et restent sous le quota d'un
    // hébergement mutualisé.
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
  schemaReady ??= getPool()
    .query(SCHEMA)
    .then(() => undefined)
    .catch((error) => {
      // Une création ratée ne doit pas rester mémorisée comme réussie : on
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

export async function listOrders(): Promise<Order[]> {
  await ensureSchema();

  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM orders ORDER BY received_at DESC",
  );

  return rows.map((row) => ({
    eventId: row.event_id,
    sessionId: row.session_id,
    receivedAt: new Date(row.received_at).toISOString(),
    plan: row.plan,
    paymentStatus: row.payment_status,
    amountTotal: row.amount_total,
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
  }));
}

/**
 * Enregistre une commande, en ignorant les rejeux.
 *
 * Le doublon est détecté par la contrainte d'unicité et non par une lecture
 * préalable : entre un `SELECT` et un `INSERT`, deux livraisons simultanées du
 * même événement passeraient toutes les deux. La base, elle, tranche.
 */
export async function recordOrder(
  order: Order,
): Promise<"enregistree" | "deja-traitee"> {
  try {
    await ensureSchema();

    await getPool().execute(
      `INSERT INTO orders (
         event_id, session_id, received_at, plan, payment_status,
         amount_total, currency, email, first_name, last_name,
         phone, address, options, start_date, end_date, quantity, balance_due
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.eventId,
        order.sessionId,
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
    // les journaux avant de propager — l'appelant renvoie alors un 500, que
    // Stripe réessaiera pendant trois jours.
    console.error(
      "Écriture en base impossible — commande payée à reprendre à la main :",
      JSON.stringify(order),
    );
    throw error;
  }
}
