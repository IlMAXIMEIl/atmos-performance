import mysql from "mysql2/promise";
import type Stripe from "stripe";

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
    INDEX idx_email (email),
    INDEX idx_received_at (received_at)
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
function readConfig() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DATABASE_URL } =
    process.env;

  if (DB_HOST && DB_USER && DB_NAME) {
    return {
      host: DB_HOST,
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
    return parseConnectionString(DATABASE_URL);
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

export async function listOrders(): Promise<Order[]> {
  await ensureSchema();

  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM orders ORDER BY received_at DESC",
  );

  return rows.map((row) => ({
    reference: row.reference,
    eventId: row.event_id ?? "",
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
