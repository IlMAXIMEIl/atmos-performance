import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Stockage des commandes.
 *
 * Implémentation volontairement minimale : un fichier JSONL local. Elle rend le
 * tunnel complet et testable, mais **ne convient pas à une mise en production**
 * sur un hébergement sans disque persistant (Vercel, Netlify…), où le fichier
 * disparaît à chaque déploiement. Le jour venu, seules `recordOrder` et
 * `listOrders` sont à réécrire vers une vraie base ou un envoi d'email.
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

  await mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  await appendFile(ORDERS_FILE, `${JSON.stringify(order)}\n`, "utf8");
  return "enregistree";
}
