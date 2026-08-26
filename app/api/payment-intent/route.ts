import Stripe from "stripe";

import {
  DROP_NAME,
  ORDERS_OPEN,
  PURCHASE_PRICE_EUR,
  knownOptionIds,
  optionIdsMeta,
  optionLabelsMeta,
} from "@/lib/offering";
import { lireAttribution } from "@/lib/attribution";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Barème, en centimes. Défini ici et jamais reçu du client.
 *
 * C'est **la** règle de ce fichier : le navigateur envoie une quantité, jamais
 * un montant. Un prix transmis par le client serait modifiable par le client,
 * et une console ouverte suffirait à acheter l'appareil à un euro.
 */
const PRICES = {
  /** Prix d'achat d'une unité, encaissé en totalité à la précommande. */
  purchaseUnit: PURCHASE_PRICE_EUR * 100,
};

const MAX_QUANTITY = 5;
const MAX_EMAIL_LENGTH = 254;
/** Stripe plafonne chaque valeur de métadonnée à 500 caractères. */
const MAX_META_LENGTH = 300;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Quota : dix intentions par heure et par IP.
 *
 * Chaque appel abouti crée un `PaymentIntent` chez Stripe. Un visiteur qui
 * hésite en ouvre trois ou quatre ; au-delà, c'est un script.
 */
const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

/**
 * Création de l'intention de paiement pour le tunnel intégré.
 *
 * Le Payment Element du navigateur a besoin d'un `client_secret` et de rien
 * d'autre. Ce secret n'autorise que la confirmation de **cette** intention,
 * pour **ce** montant : il peut circuler jusqu'au navigateur sans risque, à
 * la différence de la clé secrète qui, elle, ne quitte jamais le serveur.
 */
export async function POST(request: Request) {
  // Même verrou que le tunnel hébergé : tant que la société n'est pas
  // immatriculée, rien n'est encaissé. Un seul interrupteur pour les deux
  // routes, sinon l'une des deux finira par l'oublier.
  if (!ORDERS_OPEN) {
    return Response.json(
      { error: "Les commandes ne sont pas encore ouvertes." },
      { status: 503 },
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY absent : voir .env.example");
    return Response.json(
      { error: "Le paiement n'est pas encore configuré sur ce site." },
      { status: 503 },
    );
  }

  const limited = rateLimit(`payment-intent:${clientKey(request)}`, RATE_LIMIT);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  const quantity = Number(raw.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return Response.json({ error: "Quantité invalide." }, { status: 400 });
  }

  /**
   * Coordonnées reprises telles quelles dans les métadonnées.
   *
   * Elles ne conditionnent pas le paiement — Stripe encaisse sans elles — mais
   * sans elles le webhook enregistre une commande sans nom ni adresse, donc
   * inexploitable. On les tronque plutôt que de les refuser : un paiement ne
   * doit pas échouer parce qu'une adresse est verbeuse.
   */
  const meta = (key: string) =>
    typeof raw[key] === "string"
      ? (raw[key] as string).trim().slice(0, MAX_META_LENGTH)
      : "";

  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return Response.json(
      { error: "Cette adresse email semble incomplète." },
      { status: 400 },
    );
  }

  const chosenIds = knownOptionIds(raw.options);

  try {
    const stripe = new Stripe(secretKey);

    const intent = await stripe.paymentIntents.create({
      amount: PRICES.purchaseUnit * quantity,
      currency: "eur",

      /*
        `automatic_payment_methods` plutôt qu'une liste figée.

        Stripe propose alors ce qui est activé dans le tableau de bord
        (Réglages > Moyens de paiement), filtré par le pays du compte, la
        devise et le montant. Activer Klarna ou PayPal ne demande donc aucun
        déploiement.

        Deux choses à savoir si l'on est tenté d'écrire la liste à la main :

        - **Apple Pay n'est pas un moyen de paiement Stripe.** C'est un
          portefeuille adossé à `card` : on l'obtient en activant la carte, et
          en déclarant le domaine dans le tableau de bord (Réglages > Moyens
          de paiement > Apple Pay). Le lister explicitement est impossible.
        - Une liste figée ici désactiverait silencieusement tout ce qui aura
          été activé ailleurs.
      */
      automatic_payment_methods: { enabled: true },

      receipt_email: email,

      // Reprises par le webhook pour enregistrer la commande. Le montant n'y
      // figure pas : il est déjà porté par l'intention elle-même, et le
      // dupliquer ouvrirait la porte à deux vérités.
      metadata: {
        plan: "achat",
        drop: DROP_NAME,
        quantity: String(quantity),
        email,
        firstName: meta("firstName"),
        lastName: meta("lastName"),
        phone: meta("phone"),
        address: meta("address"),
        /*
          Les deux formes, comme dans le tunnel hébergé.

          Cette route écrivait jusqu'ici les identifiants bruts dans `options`
          pendant que `checkout/route.ts` y écrivait les libellés : deux
          commandes équivalentes produisaient deux métadonnées différentes
          selon la formule choisie. C'est le même défaut que
          `_shared/order.ts` corrige côté Nexus — deux chemins d'écriture
          doivent produire exactement la même ligne — et il se corrige ici
          par la même méthode : une seule table d'options, dans `lib/offering`.

          `knownOptionIds` filtre au passage ce qui n'existe pas au catalogue,
          ce que cette route ne faisait pas du tout.
        */
        optionIds: optionIdsMeta(chosenIds).slice(0, MAX_META_LENGTH),
        options: optionLabelsMeta(chosenIds).slice(0, MAX_META_LENGTH),
        /*
          L'origine du visiteur, si une arrivée tracée l'a posée en
          cookie — même écriture que le tunnel hébergé, pour que le
          webhook lise la même chose quel que soit le chemin.
        */
        ...lireAttribution(request.headers.get("cookie")),
      },

      description: `ATMOS ONE — précommande ${DROP_NAME} (${quantity} unité${quantity > 1 ? "s" : ""})`,
    });

    if (!intent.client_secret) {
      throw new Error("Stripe n'a pas renvoyé de client_secret.");
    }

    return Response.json({
      clientSecret: intent.client_secret,
      amount: intent.amount,
    });
  } catch (error) {
    // Une clé refusée est une erreur de configuration, pas un incident de
    // paiement : on la distingue pour ne pas la faire passer pour une panne
    // passagère côté visiteur.
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

    console.error("Création du PaymentIntent impossible", error);
    return Response.json(
      { error: "Le paiement n'a pas pu être préparé." },
      { status: 502 },
    );
  }
}
