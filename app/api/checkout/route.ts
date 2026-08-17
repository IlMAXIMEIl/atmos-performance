import Stripe from "stripe";

/**
 * Montant de la caution, en centimes. Défini ici et jamais reçu du client :
 * un montant transmis par le navigateur serait modifiable par l'utilisateur.
 */
const DEPOSIT_AMOUNT = 50_000;

/**
 * Seule la location passe par ce parcours ; l'achat se traite par contact
 * direct. Toute autre valeur est refusée.
 */
const ACCEPTED_PLAN = "leasing";

/** Longueur maximale acceptée par champ (les métadonnées Stripe plafonnent à 500). */
const MAX_FIELD_LENGTH = 300;

type Payload = {
  plan: string;
  startDate: string;
  endDate: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Renvoie le premier message d'erreur rencontré, ou `null` si tout est valide. */
function validate(payload: Payload) {
  if (payload.plan !== ACCEPTED_PLAN) {
    return "Cette formule ne se réserve pas en ligne.";
  }

  for (const [field, value] of Object.entries(payload)) {
    if (!value) return "Tous les champs sont requis.";
    if (value.length > MAX_FIELD_LENGTH) {
      return `Le champ « ${field} » dépasse ${MAX_FIELD_LENGTH} caractères.`;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
    return "Adresse email invalide.";
  }

  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return "Dates invalides.";
  }
  if (end <= start) {
    return "La date de fin doit suivre la date de début.";
  }

  return null;
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY absent : voir .env.example");
    return Response.json(
      { error: "Le paiement n'est pas encore configuré sur ce site." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const payload: Payload = {
    plan: readString(raw.plan),
    startDate: readString(raw.startDate),
    endDate: readString(raw.endDate),
    name: readString(raw.name),
    email: readString(raw.email),
    phone: readString(raw.phone),
    address: readString(raw.address),
  };

  const invalid = validate(payload);
  if (invalid) {
    return Response.json({ error: invalid }, { status: 400 });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: payload.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: DEPOSIT_AMOUNT,
            product_data: {
              name: "ATMOS ONE — caution de location",
              description: `Location du ${payload.startDate} au ${payload.endDate}. Caution intégralement remboursable en fin de location.`,
            },
          },
        },
      ],
      metadata: {
        plan: payload.plan,
        startDate: payload.startDate,
        endDate: payload.endDate,
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
      },
      success_url: `${origin}/reservation/confirmee?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#offres`,
    });

    if (!session.url) {
      throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
    }

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Création de la session Stripe impossible", error);
    return Response.json(
      { error: "La session de paiement n'a pas pu être créée." },
      { status: 502 },
    );
  }
}
