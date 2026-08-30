import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { addToWaitlist, type WaitlistSource } from "@/lib/waitlist";
import { lireAttribution } from "@/lib/attribution";

const MAX_EMAIL_LENGTH = 200;
const MAX_NAME_LENGTH = 100;

/**
 * Plafond du corps de requête.
 *
 * Deux champs courts ne pèsent jamais plus de quelques centaines d'octets :
 * tout ce qui dépasse est au mieux une erreur, au pire une tentative
 * d'engorgement. On refuse avant de parser, pas après.
 */
const MAX_BODY_BYTES = 2_000;

/**
 * Quota d'inscription : cinq tentatives par quart d'heure et par IP.
 *
 * Large pour un visiteur — qui s'inscrit une fois, deux s'il se trompe de
 * frappe — et étroit pour un script. Voir `lib/rate-limit` pour ce que cette
 * limite garantit réellement en serverless.
 */
const RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

const SOURCES: readonly WaitlistSource[] = ["drop-1", "location"];

/**
 * Anciennes valeurs d'origine, encore acceptées.
 *
 * Le « Batch n°1 » s'appelle désormais « Drop n°1 ». Le temps qu'un
 * déploiement se propage, une page servie depuis un cache continue de poster
 * l'ancien libellé : la refuser reviendrait à perdre des inscriptions pour
 * une question de vocabulaire.
 */
const LEGACY_SOURCES: Record<string, WaitlistSource> = { "batch-1": "drop-1" };

function normaliseSource(value: string): WaitlistSource | null {
  const canonical = LEGACY_SOURCES[value] ?? value;
  return (SOURCES as readonly string[]).includes(canonical)
    ? (canonical as WaitlistSource)
    : null;
}

/**
 * Adresse email, validée sans prétendre couvrir la RFC 5322.
 *
 * Une partie locale et un domaine sans espace ni arobase, des étiquettes de
 * domaine alphanumériques séparées par des points, une extension d'au moins
 * deux lettres. Refuse au passage les points en tête, en queue ou doublés, que
 * l'ancien motif laissait passer.
 */
const EMAIL_PATTERN =
  /^[^\s@,;<>"'\\]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

/**
 * Nettoie une valeur texte avant transmission à Brevo.
 *
 * Les caractères de contrôle sont retirés — retours à la ligne compris, de
 * quoi sont faites les injections d'en-tête si la valeur ressort un jour dans
 * un email — ainsi que les marques de direction Unicode, dont le seul usage
 * réaliste ici serait de maquiller une chaîne à l'affichage. Rien n'est
 * échappé au-delà : la valeur part dans un corps JSON, que `JSON.stringify`
 * échappe déjà. Un échappement HTML posé ici ferait apparaître des `&amp;`
 * dans les vrais prénoms, jusque dans les campagnes Brevo.
 */
function sanitiseText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(
      /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028\u2029\u202a-\u202e\ufeff]/g,
      "",
    )
    .trim();
}

export async function POST(request: Request) {
  const limited = rateLimit(`waitlist:${clientKey(request)}`, RATE_LIMIT);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  // Un POST JSON depuis un formulaire de la page annonce toujours son type.
  // L'exiger écarte les envois de formulaire inter-origines, que le navigateur
  // dispense de vérification préalable CORS.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Requête illisible." }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return Response.json(
      { error: "Requête trop volumineuse." },
      { status: 413 },
    );
  }

  // Le corps est relu en texte : `content-length` peut mentir, la taille
  // réellement reçue non.
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return Response.json(
      { error: "Requête trop volumineuse." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  // Un corps JSON valide peut être un tableau, une chaîne ou `null` : seul un
  // objet a des champs à lire.
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const email = sanitiseText(raw.email);
  const firstName = sanitiseText(raw.firstName);
  // Les inscriptions antérieures à la liste du Drop n°1 n'envoyaient pas
  // d'origine : la location reste la valeur par défaut.
  const rawSource = typeof raw.source === "string" ? raw.source : "location";
  const source = normaliseSource(rawSource);

  if (!email) {
    return Response.json({ error: "Indiquez votre email." }, { status: 400 });
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return Response.json({ error: "Adresse trop longue." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return Response.json(
      { error: "Cette adresse email semble incomplète." },
      { status: 400 },
    );
  }
  if (firstName.length > MAX_NAME_LENGTH) {
    return Response.json({ error: "Prénom trop long." }, { status: 400 });
  }
  if (!source) {
    return Response.json({ error: "Origine inconnue." }, { status: 400 });
  }

  try {
    const result = await addToWaitlist(email, {
      firstName: firstName || undefined,
      source,
      // L'origine publicitaire du visiteur, si le cookie de consentement l'a
      // laissée se poser. Même lecture que les tunnels de paiement : le
      // serveur lit l'en-tête, jamais une valeur envoyée par le formulaire.
      attribution: lireAttribution(request.headers.get("cookie")),
    });

    // Réponse volontairement identique que l'adresse ait été créée ou qu'elle
    // fût déjà connue. Distinguer les deux transformerait le formulaire en
    // oracle : un curieux y testerait si telle adresse est inscrite. Le
    // détail reste dans les journaux, où il n'apprend rien à personne.
    if (result === "deja-inscrit") {
      console.info(`Liste d'attente : adresse déjà connue (${source})`);
    }
    return Response.json({ ok: true });
  } catch (error) {
    // Le détail part dans les journaux du serveur, jamais dans la réponse :
    // un chemin de fichier ou une trace d'appels renseignerait un attaquant
    // sur l'hébergement.
    console.error("Inscription à la liste d'attente impossible", error);
    return Response.json(
      { error: "Inscription impossible pour le moment." },
      { status: 500 },
    );
  }
}
