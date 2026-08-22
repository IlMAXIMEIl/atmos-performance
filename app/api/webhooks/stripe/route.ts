import Stripe from "stripe";

import { ORDERS_OPEN } from "@/lib/offering";
import { orderFromIntent, recordOrder, type Order } from "@/lib/orders";

/**
 * Réception des événements Stripe.
 *
 * La signature est vérifiée sur le **corps brut** : sans cela, n'importe qui
 * connaissant l'URL pourrait poster une fausse commande payée. C'est la raison
 * pour laquelle on lit `request.text()` et non `request.json()` — reparser puis
 * ré-sérialiser le corps invaliderait la signature.
 */

/**
 * Les deux tunnels n'émettent pas le même événement.
 *
 * - `checkout.session.completed` : tunnel hébergé (`/api/checkout`), le
 *   visiteur part chez Stripe et revient.
 * - `payment_intent.succeeded` : tunnel intégré (`/api/payment-intent`), le
 *   Payment Element confirme depuis la page.
 *
 * Oublier le second reviendrait à encaisser sans jamais enregistrer la
 * commande — la panne la plus coûteuse et la plus silencieuse qui soit.
 */
const HANDLED_EVENTS = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "payment_intent.succeeded",
]);

function readMeta(
  source: Stripe.Checkout.Session | Stripe.PaymentIntent,
  key: string,
) {
  return source.metadata?.[key] ?? "";
}

/**
 * Ramène les deux formes d'événement à la même commande.
 *
 * L'intention passe par `orderFromIntent`, partagée avec la page de
 * confirmation : les deux chemins d'écriture doivent produire exactement la
 * même ligne, sinon la seconde écriture divergerait de la première sans que
 * personne ne s'en aperçoive.
 *
 * Une session porte `amount_total` et `customer_email` ; une intention porte
 * `amount` et `receipt_email`, et son état vaut « paid » par construction —
 * `payment_intent.succeeded` ne se déclenche pas autrement.
 */
function toOrder(event: Stripe.Event): Order {
  if (event.type === "payment_intent.succeeded") {
    return orderFromIntent(event.data.object as Stripe.PaymentIntent, event.id);
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const order: Order = {
    // La référence est celle du paiement, jamais celle de l'événement :
    // Stripe en émet plusieurs pour une même commande.
    reference: session.id,
    eventId: event.id,
    receivedAt: new Date().toISOString(),
    plan: readMeta(session, "plan"),
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total ?? 0,
    currency: session.currency ?? "eur",
    email: session.customer_email ?? session.customer_details?.email ?? "",
    firstName: readMeta(session, "firstName"),
    lastName: readMeta(session, "lastName"),
    phone: readMeta(session, "phone"),
    address: readMeta(session, "address"),
    options: readMeta(session, "options"),
  };

  if (order.plan === "leasing") {
    order.startDate = readMeta(session, "startDate");
    order.endDate = readMeta(session, "endDate");
  } else {
    order.quantity = readMeta(session, "quantity");
    order.balanceDue = readMeta(session, "balanceDue");
  }

  return order;
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    console.error(
      "STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET absent : voir .env.example",
    );
    return Response.json({ error: "Webhook non configuré." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Signature absente." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error(
      "Signature de webhook invalide",
      error instanceof Error ? error.message : error,
    );
    return Response.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    // Accusé de réception quand même : un 4xx pousserait Stripe à réessayer
    // indéfiniment un événement dont nous n'avons simplement pas l'usage.
    return Response.json({ received: true, handled: false });
  }

  const order = toOrder(event);

  // Phase de teasing : les commandes sont fermées, `/api/checkout` refuse de
  // créer la moindre session, et aucun paiement légitime ne peut donc aboutir.
  // Un événement reçu ici est soit un test depuis le tableau de bord, soit un
  // reliquat — rien qui justifie d'écrire sur un disque que l'hébergement peut
  // très bien servir en lecture seule. On accuse réception et on trace : un
  // 4xx/5xx ferait réessayer Stripe en boucle pour un événement sans objet.
  if (!ORDERS_OPEN) {
    // Seuls les identifiants et le montant sont tracés. La commande complète
    // porte nom, téléphone et adresse : les déverser dans les journaux à
    // chaque événement en ferait une base de données personnelles parallèle,
    // conservée sans durée ni contrôle d'accès.
    console.warn(
      `Événement Stripe reçu alors que les commandes sont fermées — non enregistré : ${event.type} ${event.id} (${order.reference}, ${order.amountTotal / 100} ${order.currency})`,
    );
    return Response.json({ received: true, handled: false });
  }

  try {
    const result = await recordOrder(order);
    // L'adresse email reste, elle : c'est la clé qui permet de retrouver une
    // commande dans le tableau de bord Stripe en cas de réclamation. Le reste
    // des coordonnées n'a rien à faire ici.
    console.log(
      `Commande ${result} — ${order.plan} — ${(order.amountTotal / 100).toFixed(2)} ${order.currency.toUpperCase()} — ${order.email}`,
    );
    return Response.json({ received: true, result });
  } catch (error) {
    // Un 500 fait réessayer Stripe : c'est le comportement voulu si
    // l'enregistrement a échoué de notre côté.
    console.error("Enregistrement de la commande impossible", error);
    return Response.json(
      { error: "Enregistrement impossible." },
      { status: 500 },
    );
  }
}
