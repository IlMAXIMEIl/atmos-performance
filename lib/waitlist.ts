import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Liste d'attente pour l'ouverture de la location.
 *
 * Même parti pris que `lib/orders.ts` : un fichier local, suffisant tant que
 * le volume est faible, à remplacer par un vrai stockage ou un envoi d'email
 * le jour où la location ouvre.
 */

const FILE = path.join(process.cwd(), ".data", "waitlist.jsonl");

export type WaitlistEntry = { email: string; createdAt: string };

async function readLines() {
  try {
    const content = await readFile(FILE, "utf8");
    return content.split("\n").filter((line) => line.trim().length > 0);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function addToWaitlist(
  email: string,
): Promise<"inscrit" | "deja-inscrit"> {
  const normalised = email.trim().toLowerCase();
  const lines = await readLines();

  const known = lines.some(
    (line) => (JSON.parse(line) as WaitlistEntry).email === normalised,
  );
  if (known) return "deja-inscrit";

  await mkdir(path.dirname(FILE), { recursive: true });
  const entry: WaitlistEntry = {
    email: normalised,
    createdAt: new Date().toISOString(),
  };
  await appendFile(FILE, `${JSON.stringify(entry)}\n`, "utf8");
  return "inscrit";
}
