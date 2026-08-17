import Stripe from "stripe";

/**
 * Barème, en centimes. Défini ici et jamais reçu du client : un montant
 * transmis par le navigateur serait modifiable par l'utilisateur.
 */
const PRICES = {
  /** Prix d'achat d'une unité. */
  purchaseUnit: 189_000,
  /** Acompte encaissé par unité réservée ; le solde est réglé avant expédition. */
  purchaseDeposit: 30_000,
  /** Loyer mensuel. */
  monthlyRent: 35_000,
  /** Expédition sécurisée, facturée une fois au départ de la location. */
  shipping: 3_900,
};

/** Durée verrouillée de la première période de location. */
const RENTAL_DAYS = 30;

const MAX_QUANTITY = 5;

/** Longueur maximale acceptée par champ (les métadonnées Stripe plafonnent à 500). */
const MAX_FIELD_LENGTH = 300;

/** Options d'équipement : enregistrées à la commande, chiffrées ensuite. */
const OPTION_LABELS: Record<string, string> = {
  oxymetre: "Oxymètre de pouls",
  monitoring: "Système de monitoring",
};

const PLAN_IDS = ["achat", "leasing"] as const;
type PlanId = (typeof PLAN_IDS)[number];

type Payload = {
  plan: string;
  startDate: string;
  quantity: number;
  options: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
};

/** Champs exigés quelle que soit la formule. */
const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
] as const;

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function formatEuros(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

/** Renvoie le premier message d'erreur rencontré, ou `null` si tout est valide. */
function validate(payload: Payload) {
  if (!isPlanId(payload.plan)) return "Formule inconnue.";

  for (const field of REQUIRED_FIELDS) {
    if (!payload[field]) return "Tous les champs sont requis.";
    if (payload[field].length > MAX_FIELD_LENGTH) {
      return `Le champ « ${field} » dépasse ${MAX_FIELD_LENGTH} caractères.`;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
    return "Adresse email invalide.";
  }

  if (payload.plan === "leasing") {
    if (!payload.startDate) return "La date de début est requise.";
    if (Number.isNaN(new Date(payload.startDate).valueOf())) {
      return "Date de début invalide.";
    }
  } else {
    if (
      !Number.isInteger(payload.quantity) ||
      payload.quantity < 1 ||
      payload.quantity > MAX_QUANTITY
    ) {
      return `La quantité doit être comprise entre 1 et ${MAX_QUANTITY}.`;
    }
  }

  if (payload.options.some((option) => !OPTION_LABELS[option])) {
    return "Option inconnue.";
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
    quantity: Number(raw.quantity ?? 1),
    options: Array.isArray(raw.options) ? raw.options.map(readString) : [],
    firstName: readString(raw.firstName),
    lastName: readString(raw.lastName),
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

  // La date de fin est recalculée ici : la durée est verrouillée à 30 jours et
  // ne doit pas dépendre de ce que le navigateur a envoyé.
  const endDate =
    payload.plan === "leasing" ? addDays(payload.startDate, RENTAL_DAYS) : "";

  const chosenOptions = payload.options
    .map((option) => OPTION_LABELS[option])
    .join(", ");

  const metadata: Record<string, string> = {
    plan: payload.plan,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    address: payload.address,
    options: chosenOptions || "aucune",
  };

  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  let extra: Partial<Stripe.Checkout.SessionCreateParams> = {};

  if (payload.plan === "leasing") {
    metadata.startDate = payload.startDate;
    metadata.endDate = endDate;
    metadata.monthlyRent = formatEuros(PRICES.monthlyRent);

    lineItems = [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: PRICES.monthlyRent,
          product_data: {
            name: "ATMOS ONE — loyer du 1er mois",
            description: `Location du ${formatDate(payload.startDate)} au ${formatDate(endDate)} (${RENTAL_DAYS} jours). 100 % des loyers versés sont déduits en cas d'achat.`,
          },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: PRICES.shipping,
          product_data: {
            name: "Expédition sécurisée",
            description: "Emballage renforcé et transport assuré, aller.",
          },
        },
      },
    ];

    // Empreinte bancaire : la carte est conservée pour pouvoir prélever la
    // caution de garantie hors session. Aucun montant n'est débité à ce titre
    // au moment du paiement.
    extra = {
      customer_creation: "always",
      payment_intent_data: {
        setup_future_usage: "off_session",
        description: "Loyer du 1er mois ATMOS ONE + empreinte pour caution",
      },
    };
  } else {
    const balance =
      (PRICES.purchaseUnit - PRICES.purchaseDeposit) * payload.quantity;

    metadata.quantity = String(payload.quantity);
    metadata.balanceDue = formatEuros(balance);

    lineItems = [
      {
        quantity: payload.quantity,
        price_data: {
          currency: "eur",
          unit_amount: PRICES.purchaseDeposit,
          product_data: {
            name: "ATMOS ONE — acompte de réservation",
            description: `Acompte par unité, déduit du prix de ${formatEuros(PRICES.purchaseUnit)}. Solde de ${formatEuros(balance)} réglé avant expédition.`,
          },
        },
      },
    ];
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: payload.email,
      line_items: lineItems,
      metadata,
      success_url: `${origin}/reservation/confirmee?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#offres`,
      ...extra,
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
