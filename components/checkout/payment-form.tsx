"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Appearance, type StripeError } from "@stripe/stripe-js";
import { AlertCircle, Loader2, Lock } from "lucide-react";

import { formatNumber } from "@/lib/altitude";
import { PURCHASE_PRICE_EUR } from "@/lib/offering";

/**
 * Chargé une fois pour toute la page, hors du composant.
 *
 * `loadStripe` injecte un script distant : l'appeler dans le corps du
 * composant le relancerait à chaque rendu.
 */
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

/**
 * Habillage du Payment Element aux couleurs du site.
 *
 * Les champs de carte vivent dans une iframe servie par Stripe : aucune de nos
 * feuilles de style ne les atteint. Cette API est le seul moyen de les
 * accorder au reste de la page, et les valeurs sont donc les jetons de
 * `globals.css` recopiés en clair — un `var(--ink)` n'aurait aucun sens de
 * l'autre côté de la frontière.
 */
const APPEARANCE: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#3b9eff",
    colorBackground: "#0c1422",
    colorText: "#e9f1fb",
    colorTextSecondary: "#7e93ae",
    colorTextPlaceholder: "#4c5f78",
    colorDanger: "#ff6b6b",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontSizeBase: "15px",
    borderRadius: "8px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(233, 241, 251, 0.11)",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #3b9eff",
      boxShadow: "none",
    },
    ".Label": {
      fontSize: "0.7rem",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    },
    ".Tab, .Block": {
      border: "1px solid rgba(233, 241, 251, 0.11)",
      boxShadow: "none",
    },
    ".Tab--selected": {
      border: "1px solid #3b9eff",
      boxShadow: "none",
    },
  },
};

/**
 * Tunnel de paiement intégré : le visiteur ne quitte pas le site.
 *
 * **Nuance à connaître avant de promettre « aucune redirection ».** La carte
 * et Apple Pay se règlent entièrement dans la page. Klarna et PayPal, non :
 * l'un comme l'autre emmènent le client sur leur propre domaine pour
 * l'authentifier, puis le renvoient sur `return_url`. C'est leur
 * fonctionnement, aucune intégration ne le contourne. Le gain du Payment
 * Element reste entier — le choix du moyen, la saisie de la carte et l'échec
 * éventuel se jouent chez nous.
 */
export type PaymentContact = {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  options?: string[];
};

export function PaymentForm({
  quantity = 1,
  contact,
}: {
  quantity?: number;
  contact: PaymentContact;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        const response = await fetch("/api/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity, ...contact }),
        });

        const data = (await response.json()) as {
          clientSecret?: string;
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok || !data.clientSecret) {
          setSetupError(data.error ?? "Le paiement n'a pas pu être préparé.");
          return;
        }

        setClientSecret(data.clientSecret);
      } catch {
        if (!cancelled) {
          setSetupError("Connexion impossible. Vérifiez votre réseau.");
        }
      }
    }

    void prepare();
    // L'intention est créée pour un montant donné : si la quantité change,
    // il en faut une nouvelle. `cancelled` écarte la réponse d'une requête
    // devenue obsolète, qui écraserait sinon la plus récente.
    return () => {
      cancelled = true;
    };
    // `contact` est un objet : le comparer par référence relancerait la
    // requête à chaque rendu du parent. Seuls la quantité et l'adresse email
    // changent le montant ou le destinataire du reçu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, contact.email]);

  if (!stripePromise) {
    return (
      <Notice>
        {"Le paiement n'est pas encore configuré sur ce site."}
      </Notice>
    );
  }

  if (setupError) return <Notice>{setupError}</Notice>;

  if (!clientSecret) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-deep p-7 font-mono text-[0.72rem] tracking-[0.14em] text-dimmer uppercase">
        <Loader2 className="h-4 w-4 animate-spin text-accent" strokeWidth={1.8} />
        Préparation du paiement
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: APPEARANCE }}>
      <CheckoutFields quantity={quantity} />
    </Elements>
  );
}

function CheckoutFields({ quantity }: { quantity: number }) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = PURCHASE_PRICE_EUR * quantity;

  async function onSubmit() {
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Klarna et PayPal repassent par ici après authentification, et
        // Stripe ajoute `payment_intent` et `payment_intent_client_secret` à
        // l'URL. `/reservation/confirmee` relit l'intention côté serveur avant
        // d'afficher quoi que ce soit : le `redirect_status` de l'URL n'est
        // jamais consulté, et un paiement refusé repart vers le tunnel au lieu
        // d'atterrir sur un remerciement.
        return_url: `${window.location.origin}/reservation/confirmee`,
      },
      // Le visiteur ne quitte la page que si le moyen choisi l'exige.
      redirect: "if_required",
    });

    if (error) {
      setMessage(readableError(error));
      setSubmitting(false);
      return;
    }

    /*
      Pas d'erreur et pas de redirection : le paiement est passé sur place.

      **Il faut reconstruire les paramètres que Stripe aurait ajoutés.** Sur le
      chemin avec redirection — Klarna, PayPal — Stripe renvoie sur
      `return_url` en y accrochant `payment_intent` et
      `payment_intent_client_secret`. Ici, personne ne le fait à notre place :
      sans eux, `/reservation/confirmee` n'a rien à vérifier auprès de Stripe
      et affiche « Nous n'avons pas retrouvé ce paiement » — alors même que la
      carte vient d'être débitée.

      Les deux chemins arrivent donc sur la même URL, avec les mêmes
      paramètres, et la page n'a pas à savoir d'où vient le visiteur.
    */
    const query = new URLSearchParams({
      payment_intent: paymentIntent.id,
      payment_intent_client_secret: paymentIntent.client_secret ?? "",
    });

    router.push(`/reservation/confirmee?${query}`);
  }

  return (
    /*
      Un `<div>`, pas un `<form>`.

      Ce bloc est destiné à vivre à l'intérieur du formulaire par étapes de la
      modale de réservation, et imbriquer deux `<form>` est du HTML invalide —
      le navigateur ferme le premier en rencontrant le second, et la moitié des
      champs se retrouve hors du formulaire. Le bouton porte donc
      `type="button"` et appelle la confirmation lui-même.
    */
    <div className="flex flex-col gap-6">
      <PaymentElement options={{ layout: "tabs" }} />

      {/*
        Le message d'erreur occupe sa place au-dessus du bouton, jamais dans
        une alerte flottante : le visiteur regarde le bouton au moment où il
        échoue, c'est là qu'il faut lui répondre.
      */}
      {message && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.07] px-4 py-3 text-[0.85rem] leading-relaxed text-[#ffb4b4]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.8} />
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!stripe || submitting}
        className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-7 py-4 text-sm font-semibold text-void shadow-[0_10px_40px_-12px_var(--accent)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_-12px_var(--accent)] disabled:pointer-events-none disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
            Paiement en cours
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" strokeWidth={1.8} />
            {`Payer ${formatNumber(total)} €`}
          </>
        )}
      </button>

      <p className="text-center font-mono text-[0.66rem] tracking-[0.14em] text-dimmer uppercase">
        Paiement chiffré · Aucune donnée bancaire ne transite par nos serveurs
      </p>
    </div>
  );
}

/**
 * Traduit une erreur Stripe en une phrase adressée au visiteur.
 *
 * Seules `card_error` et `validation_error` portent un message rédigé pour
 * être lu : Stripe les localise et elles décrivent une action à corriger.
 * Tout le reste — panne réseau, clé mal configurée, moyen indisponible —
 * expose des détails d'implémentation qui n'aident personne et renseignent un
 * attaquant. Le détail part dans les journaux, pas à l'écran.
 */
function readableError(error: StripeError): string {
  if (error.type === "card_error" || error.type === "validation_error") {
    return error.message ?? "Ce moyen de paiement a été refusé.";
  }

  // Le type et le code suffisent au diagnostic — « demandez-moi ce que dit la
  // console » reste possible. L'objet complet exposerait l'identifiant de
  // l'intention et le détail du refus dans une console que n'importe qui
  // regardant par-dessus l'épaule peut ouvrir.
  console.error(
    `Confirmation du paiement impossible (${error.type}${error.code ? ` / ${error.code}` : ""})`,
  );
  return "Le paiement n'a pas abouti. Aucun montant n'a été débité — vous pouvez réessayer.";
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-line bg-deep px-5 py-4 text-[0.9rem] leading-relaxed text-dim"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-[#ff6b6b]" strokeWidth={1.8} />
      {children}
    </p>
  );
}
