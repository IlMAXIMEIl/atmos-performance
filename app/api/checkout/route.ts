import Stripe from "stripe";

import {
  DROP_NAME,
  LEASING_MONTHLY_EUR,
  LEASING_OPEN,
  LEASING_SHIPPING_EUR,
  ORDERS_OPEN,
  PAID_OPTIONS,
  PURCHASE_PRICE_EUR,
  knownOptionIds,
  optionIdsMeta,
  optionLabelsMeta,
} from "@/lib/offering";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Barème, en centimes. **Jamais reçu du client** : un montant transmis par le
 * navigateur serait modifiable par l'utilisateur, et une console ouverte
 * suffirait à acheter l'appareil à un euro. Cette règle est intacte — dériver
 * d'une constante du serveur n'y change rien, `lib/offering.ts` n'est pas plus
 * accessible au visiteur que ce fichier.
 *
 * Ce qui change : les trois montants étaient écrits en clair ici *et* dans la
 * carte d'offre *et* dans le récapitulatif de la modale. Trois copies dont
 * celle-ci est la seule qui débite réellement une carte — une divergence y
 * serait passée inaperçue jusqu'au relevé bancaire du client.
 */
const PRICES = {
  /** Prix d'achat d'une unité, encaissé à la précommande. */
  purchaseUnit: PURCHASE_PRICE_EUR * 100,
  /** Loyer mensuel. */
  monthlyRent: LEASING_MONTHLY_EUR * 100,
  /** Expédition sécurisée, facturée une fois au départ de la location. */
  shipping: LEASING_SHIPPING_EUR * 100,
};

/** Durée verrouillée de la première période de location. */
const RENTAL_DAYS = 30;

const MAX_QUANTITY = 5;

/**
 * Quota de création de session : dix par heure et par IP.
 *
 * Chaque appel abouti crée un objet chez Stripe et consomme du quota d'API.
 * Un visiteur qui hésite entre les formules en ouvre trois ou quatre ; au-delà
 * c'est un script.
 */
const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

/** Longueur maximale acceptée par champ (les métadonnées Stripe plafonnent à 500). */
const MAX_FIELD_LENGTH = 300;

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

/**
 * Nommée d'après son unité : elle prend des **centimes**, quand
 * `formatEuros` de `lib/offering.ts` prend des euros. Deux fonctions de même
 * nom et d'unités différentes finissent toujours par être appelées l'une pour
 * l'autre — ici, avec un facteur cent sur le montant affiché au client.
 */
function formatEurosFromCents(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

/** Renvoie le premier message d'erreur rencontré, ou `null` si tout est valide. */
function validate(payload: Payload) {
  if (!isPlanId(payload.plan)) return "Formule inconnue.";

  // Tant que la société n'est pas immatriculée, rien n'est encaissé : les
  // boutons du site mènent à la liste prioritaire, et un appel direct à cette
  // route est refusé ici plutôt que de créer une session de paiement.
  if (!ORDERS_OPEN) {
    return "Les commandes ne sont pas encore ouvertes. Rejoignez la liste prioritaire.";
  }

  // La location est présentée sur le site mais son tunnel reste fermé au
  // lancement : refuser ici évite qu'un appel direct le contourne.
  if (payload.plan === "leasing" && !LEASING_OPEN) {
    return "La location n'est pas encore ouverte à la réservation.";
  }

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

  if (payload.options.some((option) => !PAID_OPTIONS[option])) {
    return "Option inconnue.";
  }

  return null;
}

export async function POST(request: Request) {
  const limited = rateLimit(`checkout:${clientKey(request)}`, RATE_LIMIT);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

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

  /*
    Deux écritures pour la même information, et c'est délibéré.

    `optionIds` est la forme stable — « oxymetre,monitoring » — sur laquelle
    le tableau de bord pose sa correspondance vers les références d'entrepôt.
    `options` est la forme lisible, celle qui s'affiche sur la fiche de la
    commande.

    Poser la correspondance sur le libellé, comme c'était le cas, revient à
    faire dépendre le stock d'un texte d'interface : le renommer casse le
    rattachement en silence, et les commandes suivantes s'expédient sans rien
    décrémenter. Voir la migration 0015 côté Nexus.
  */
  const chosenIds = knownOptionIds(payload.options);

  const metadata: Record<string, string> = {
    plan: payload.plan,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    address: payload.address,
    optionIds: optionIdsMeta(chosenIds),
    options: optionLabelsMeta(chosenIds),
  };

  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  let extra: Partial<Stripe.Checkout.SessionCreateParams> = {};

  if (payload.plan === "leasing") {
    metadata.startDate = payload.startDate;
    metadata.endDate = endDate;
    metadata.monthlyRent = formatEurosFromCents(PRICES.monthlyRent);

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

    /*
      Empreinte bancaire : la carte est conservée pour pouvoir prélever la
      caution de garantie hors session. Aucun montant n'est débité à ce titre
      au moment du paiement.

      **Conséquence sur les moyens de paiement proposés.** Dès que
      `setup_future_usage` est demandé, Stripe restreint la liste aux moyens
      capables d'une transaction ultérieure à l'initiative du marchand. PayPal
      en est écarté : la formule Location n'affichera donc que la carte, même
      une fois PayPal activé au tableau de bord. Ce n'est pas un oubli de
      configuration, c'est la contrepartie de l'empreinte.
    */
    extra = {
      customer_creation: "always",
      payment_intent_data: {
        setup_future_usage: "off_session",
        description: "Loyer du 1er mois ATMOS ONE + empreinte pour caution",
      },
    };
  } else {
    metadata.quantity = String(payload.quantity);
    metadata.drop = DROP_NAME;

    lineItems = [
      {
        quantity: payload.quantity,
        price_data: {
          currency: "eur",
          unit_amount: PRICES.purchaseUnit,
          product_data: {
            name: `ATMOS ONE — précommande ${DROP_NAME}`,
            description: `Précommande d'une unité de l'édition de lancement, à ${formatEurosFromCents(PRICES.purchaseUnit)}. Série limitée, fabrication et expédition directe.`,
          },
        },
      },
    ];
  }

  try {
    const stripe = new Stripe(secretKey);

    /*
      `payment_method_types` est volontairement absent.

      Sans cette clé, Stripe applique les **moyens de paiement dynamiques** :
      la session propose ce qui est activé dans le tableau de bord (Réglages >
      Moyens de paiement), filtré par le pays du compte, la devise et le
      montant. Ajouter PayPal, Klarna ou un virement se fait donc sans toucher
      à ce fichier.

      Ne pas la réintroduire pour « forcer la carte » : ce serait figer la
      liste ici et désactiver silencieusement tout ce qui aura été activé
      ailleurs.
    */
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // La page de paiement suit la langue du site plutôt que celle du
      // navigateur : un visiteur sur un navigateur anglophone reste en
      // français, comme le reste du parcours.
      locale: "fr",
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
    // Une clé refusée est une erreur de configuration, pas un incident de
    // paiement : on la distingue pour ne pas la faire passer pour une panne
    // passagère côté visiteur, et pour la rendre lisible dans les journaux.
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      console.error(
        "Stripe refuse la clé (401). Vérifier STRIPE_SECRET_KEY : elle doit " +
          "commencer par sk_test_ ou sk_live_ et ne comporter aucun autre " +
          "tiret bas. Tableau de bord > Développeurs > Clés API.",
      );
      return Response.json(
        { error: "Le paiement n'est pas encore configuré sur ce site." },
        { status: 503 },
      );
    }

    console.error("Création de la session Stripe impossible", error);
    return Response.json(
      { error: "La session de paiement n'a pas pu être créée." },
      { status: 502 },
    );
  }
}
