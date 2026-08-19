import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Stockage des commandes.
 *
 * Implémentation volontairement minimale : un fichier JSONL local. Elle rend le
 * tunnel complet et testable, mais **ne convient pas à une mise en production**
 * sur un hébergement sans disque persistant (Vercel, Netlify…), où le fichier
 * disparaît à chaque déploiement — voire refuse l'écriture. Le jour venu,
 * seules `recordOrder` et `listOrders` sont à réécrire vers une vraie base ou
 * un envoi d'email.
 *
 * ## Statut au lancement
 *
 * Rien de tout cela n'est exercé aujourd'hui : `ORDERS_OPEN` vaut `false`,
 * `/api/checkout` refuse de créer une session, et le webhook Stripe accuse
 * réception sans appeler `recordOrder`. Ce module ne peut donc ni faire échouer
 * le build — il n'ouvre aucun fichier à l'import — ni casser l'application en
 * production tant que la vente est fermée.
 *
 * En prévision de la réouverture, `recordOrder` journalise la commande
 * complète avant de propager une erreur d'écriture : une commande payée reste
 * ainsi récupérable dans les journaux si le disque se révèle inaccessible.
 */

const ORDERS_FILE = path.join(process.cwd(), ".data", "orders.jsonl");

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

async function readLines() {
  try {
    const content = await readFile(ORDERS_FILE, "utf8");
    return content.split("\n").filter((line) => line.trim().length > 0);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function listOrders(): Promise<Order[]> {
  const lines = await readLines();
  return lines.map((line) => JSON.parse(line) as Order);
}

/**
 * Enregistre une commande, en ignorant les rejeux : Stripe peut livrer le même
 * événement plusieurs fois, et le fait notamment en cas de timeout.
 */
export async function recordOrder(
  order: Order,
): Promise<"enregistree" | "deja-traitee"> {
  const existing = await readLines();
  const seen = existing.some(
    (line) => (JSON.parse(line) as Order).eventId === order.eventId,
  );
  if (seen) return "deja-traitee";

  const line = JSON.stringify(order);

  try {
    await mkdir(path.dirname(ORDERS_FILE), { recursive: true });
    await appendFile(ORDERS_FILE, `${line}\n`, "utf8");
  } catch (error) {
    // Disque en lecture seule, quota atteint, chemin absent : la commande est
    // payée, elle ne doit pas disparaître avec l'erreur. On l'écrit en entier
    // dans les journaux avant de propager — l'appelant renvoie alors un 500,
    // que Stripe réessaiera.
    console.error(
      `Écriture impossible dans ${ORDERS_FILE} — commande payée à reprendre à la main :`,
      line,
    );
    throw error;
  }

  return "enregistree";
}
