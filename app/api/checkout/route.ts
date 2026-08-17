import Stripe from "stripe";

/**
 * Montants en centimes, définis ici et jamais reçus du client : un montant
 * transmis par le navigateur serait modifiable par l'utilisateur.
 *
 * - Location : caution remboursable en fin de location.
 * - Achat : acompte de réservation, déduit du prix ; le solde est réglé avant
 *   ou à la livraison, hors de ce parcours.
 */
const PURCHASE_PRICE = 189_000;
const PLANS = {
  leasing: {
    amount: 50_000,
    productName: "ATMOS ONE — caution de location",
    /** La période de location est obligatoire pour cette formule. */
    requiresDates: true,
  },
  achat: {
    amount: 30_000,
    productName: "ATMOS ONE — acompte de réservation",
    requiresDates: false,
  },
} as const;

type PlanId = keyof typeof PLANS;

function isPlanId(value: string): value is PlanId {
  return Object.hasOwn(PLANS, value);
}

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

/** Champs exigés quelle que soit la formule. */
const REQUIRED_FIELDS = ["name", "email", "phone", "address"] as const;

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Renvoie le premier message d'erreur rencontré, ou `null` si tout est valide. */
function validate(payload: Payload) {
  if (!isPlanId(payload.plan)) {
    return "Formule inconnue.";
  }

  for (const field of REQUIRED_FIELDS) {
    if (!payload[field]) return "Tous les champs sont requis.";
  }

  for (const [field, value] of Object.entries(payload)) {
    if (value.length > MAX_FIELD_LENGTH) {
      return `Le champ « ${field} » dépasse ${MAX_FIELD_LENGTH} caractères.`;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
    return "Adresse email invalide.";
  }

  if (PLANS[payload.plan].requiresDates) {
    if (!payload.startDate || !payload.endDate) {
      return "La période de location est requise.";
    }

    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      return "Dates invalides.";
    }
    if (end <= start) {
      return "La date de fin doit suivre la date de début.";
    }
  }

  return null;
}

function formatEuros(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
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

  // `validate` a déjà écarté toute formule inconnue.
  const plan = PLANS[payload.plan as PlanId];
  const description =
    payload.plan === "leasing"
      ? `Location du ${payload.startDate} au ${payload.endDate}. Caution intégralement remboursable en fin de location.`
      : `Acompte déduit du prix de ${formatEuros(PURCHASE_PRICE)}. Solde de ${formatEuros(
          PURCHASE_PRICE - plan.amount,
        )} réglé avant ou à la livraison.`;

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
            unit_amount: plan.amount,
            product_data: {
              name: plan.productName,
              description,
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
