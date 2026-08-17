import Stripe from "stripe";

import { recordOrder, type Order } from "@/lib/orders";

/**
 * Réception des événements Stripe.
 *
 * La signature est vérifiée sur le **corps brut** : sans cela, n'importe qui
 * connaissant l'URL pourrait poster une fausse commande payée. C'est la raison
 * pour laquelle on lit `request.text()` et non `request.json()` — reparser puis
 * ré-sérialiser le corps invaliderait la signature.
 */

const HANDLED_EVENTS = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
]);

function readMeta(session: Stripe.Checkout.Session, key: string) {
  return session.metadata?.[key] ?? "";
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

  const session = event.data.object as Stripe.Checkout.Session;

  const order: Order = {
    eventId: event.id,
    sessionId: session.id,
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

  try {
    const result = await recordOrder(order);
    console.log(
      `Commande ${result} — ${order.plan} — ${(order.amountTotal / 100).toFixed(2)} ${order.currency.toUpperCase()} — ${order.email}`,
    );
    return Response.json({ received: true, result });
  } catch (error) {
    // Un 500 fait réessayer Stripe : c'est le comportement voulu si
    // l'enregistrement a échoué de notre côté.
    console.error("Enregistrement de la commande impossible", error);
    return Response.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
}
