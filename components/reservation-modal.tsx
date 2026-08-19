"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  LoaderCircle,
  Lock,
  Minus,
  Plus,
  SlidersHorizontal,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import { BATCH_NAME, INSTALLMENTS_NOTE } from "@/lib/offering";
import { EASE } from "@/lib/motion";

export type PlanId = "achat" | "leasing";

type Props = {
  open: boolean;
  onClose: () => void;
  plan: PlanId;
};

type StepId = "dates" | "config" | "contact" | "paiement";

const STEP_META: Record<StepId, { label: string; icon: LucideIcon }> = {
  dates: { label: "Dates", icon: CalendarDays },
  config: { label: "Configuration", icon: SlidersHorizontal },
  contact: { label: "Coordonnées", icon: User },
  paiement: { label: "Paiement", icon: Lock },
};

/** Durée verrouillée de la première période ; le serveur recalcule la fin. */
const RENTAL_DAYS = 30;
const MAX_QUANTITY = 5;

/** Chiffrées séparément : elles ne modifient pas le montant encaissé ici. */
const OPTIONS = [
  { id: "oxymetre", label: "Oxymètre de pouls" },
  { id: "monitoring", label: "Système de monitoring" },
];

/**
 * Montants affichés, en euros. Le serveur reste seul maître des sommes
 * réellement débitées : ces valeurs ne servent qu'au récapitulatif.
 */
const PRICES = {
  purchaseUnit: 1890,
  monthlyRent: 350,
  shipping: 39,
};

const PLAN_CONFIG: Record<
  PlanId,
  { eyebrow: string; title: string; steps: StepId[]; submitLabel: string }
> = {
  leasing: {
    eyebrow: `Location · ${BATCH_NAME}`,
    title: "Louer ATMOS ONE",
    steps: ["dates", "contact", "paiement"],
    submitLabel: "Régler le 1er mois",
  },
  achat: {
    eyebrow: `Édition de lancement · ${BATCH_NAME}`,
    title: "Précommander ATMOS ONE",
    steps: ["config", "contact", "paiement"],
    submitLabel: "Payer ma précommande",
  },
};

const EMPTY_FORM = {
  startDate: "",
  quantity: 1,
  options: [] as string[],
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
};

type FormState = typeof EMPTY_FORM;
type FieldErrors = Partial<Record<keyof FormState, string>>;

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[0.95rem] font-light text-white placeholder:text-white/25 transition-colors duration-300 [color-scheme:dark] focus:border-cyan-300/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-cyan-300/20";

function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function euros(amount: number) {
  return `${amount.toLocaleString("fr-FR")} €`;
}

function validateStart(form: FormState, minDate: string): FieldErrors {
  if (!form.startDate) return { startDate: "Choisissez une date de début." };
  if (minDate && form.startDate < minDate) {
    return { startDate: "La date de début ne peut pas être passée." };
  }
  return {};
}

function validateContact(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.firstName.trim()) errors.firstName = "Indiquez votre prénom.";
  if (!form.lastName.trim()) errors.lastName = "Indiquez votre nom.";
  if (!form.email.trim()) {
    errors.email = "Indiquez votre email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
    errors.email = "Cette adresse email semble incomplète.";
  }
  if (!form.phone.trim()) errors.phone = "Indiquez un téléphone.";
  if (!form.address.trim())
    errors.address = "Indiquez une adresse de livraison.";

  return errors;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[0.68rem] font-medium tracking-[0.16em] text-white/45 uppercase"
      >
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error && (
        <p
          id={`${id}-erreur`}
          role="alert"
          className="mt-2 text-[0.78rem] font-light text-rose-300/90"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Ligne du récapitulatif chiffré. */
function Amount({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span
        className={`text-[0.85rem] font-light ${muted ? "text-white/35" : "text-white/60"}`}
      >
        {label}
      </span>
      <span
        className={`text-[0.9rem] ${muted ? "font-light text-white/35" : "font-medium text-white/85"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function ReservationModal({ open, onClose, plan }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const config = PLAN_CONFIG[plan];
  const steps = config.steps;

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Le contenu n'est monté que lorsque la modale est ouverte, donc jamais
  // présent dans le HTML rendu côté serveur : `new Date()` ne peut pas
  // provoquer d'écart d'hydratation ici.
  const minDate = open ? todayISO() : "";
  const currentStep = steps[step];

  const rentalTotal = PRICES.monthlyRent + PRICES.shipping;
  const purchaseTotal = PRICES.purchaseUnit * form.quantity;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleCancel(event: Event) {
      event.preventDefault();
      onClose();
    }

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = panelRef.current?.querySelector<HTMLElement>(
      "input, [data-autofocus]",
    );
    target?.focus();
  }, [open, step]);

  const update = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    },
    [],
  );

  function toggleOption(id: string) {
    setForm((current) => ({
      ...current,
      options: current.options.includes(id)
        ? current.options.filter((option) => option !== id)
        : [...current.options, id],
    }));
  }

  function goBack() {
    setDirection(-1);
    setErrors({});
    setStep((current) => Math.max(0, current - 1));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (currentStep !== "paiement") {
      const found =
        currentStep === "dates"
          ? validateStart(form, minDate)
          : currentStep === "contact"
            ? validateContact(form)
            : {};
      if (Object.keys(found).length > 0) return setErrors(found);
      setErrors({});
      setDirection(1);
      return setStep(step + 1);
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, ...form }),
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setServerError(data.error ?? "La redirection a échoué.");
        setSubmitting(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setServerError("Connexion impossible. Vérifiez votre réseau.");
      setSubmitting(false);
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  const slide = {
    initial: { opacity: 0, x: direction * 28 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction * -28 },
    transition: { duration: 0.35, ease: EASE },
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby="reservation-titre"
      className="m-auto w-[min(34rem,calc(100vw-2rem))] bg-transparent p-0 text-white backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence
        onExitComplete={() => {
          dialogRef.current?.close();
          setStep(0);
          setDirection(1);
          setForm(EMPTY_FORM);
          setErrors({});
          setServerError(null);
          setSubmitting(false);
        }}
      >
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain rounded-[2rem] border border-white/10 bg-[#0B0C10] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.18),transparent_70%)]"
            />

            <div className="relative p-7 sm:p-9">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <span className="text-[0.62rem] font-medium tracking-[0.24em] text-cyan-300/70 uppercase">
                    {config.eyebrow}
                  </span>
                  <h2
                    id="reservation-titre"
                    className="mt-2.5 text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl"
                  >
                    {config.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="-mt-1 rounded-full border border-white/10 p-2 text-white/50 transition-colors hover:border-white/25 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progression */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  {steps.map((stepId, index) => {
                    const Icon = STEP_META[stepId].icon;
                    const done = index < step;
                    const current = index === step;

                    return (
                      <div key={stepId} className="flex items-center gap-2.5">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-500 ${
                            done
                              ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-200"
                              : current
                                ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-200"
                                : "border-white/10 text-white/30"
                          }`}
                        >
                          {done ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                          ) : (
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
                          )}
                        </span>
                        <span
                          className={`hidden text-[0.7rem] font-light tracking-[0.12em] uppercase transition-colors duration-500 sm:block ${
                            current ? "text-white/85" : "text-white/35"
                          }`}
                        >
                          {STEP_META[stepId].label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 h-px w-full bg-white/[0.08]">
                  <motion.div
                    initial={false}
                    animate={{ scaleX: (step + 1) / steps.length }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="h-px w-full origin-left bg-gradient-to-r from-cyan-300 to-blue-500"
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate className="mt-8">
                <div ref={panelRef} className="min-h-[18rem]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={step} {...slide}>
                      {/* ── Étape Dates (location) ──────────────────── */}
                      {currentStep === "dates" && (
                        <div className="flex flex-col gap-5">
                          <p className="text-[0.88rem] leading-relaxed font-light text-white/50">
                            La location démarre à la date de votre choix, pour
                            une première période de {RENTAL_DAYS} jours. Elle se
                            prolonge ensuite mois par mois.
                          </p>

                          <Field
                            id="startDate"
                            label="Date de début"
                            error={errors.startDate}
                          >
                            <input
                              id="startDate"
                              type="date"
                              value={form.startDate}
                              min={minDate}
                              onChange={(event) =>
                                update("startDate", event.target.value)
                              }
                              aria-invalid={Boolean(errors.startDate)}
                              aria-describedby={
                                errors.startDate
                                  ? "startDate-erreur"
                                  : undefined
                              }
                              className={FIELD_CLASS}
                            />
                          </Field>

                          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
                            <div className="text-[0.68rem] font-medium tracking-[0.16em] text-white/40 uppercase">
                              Fin de la première période
                            </div>
                            <div className="mt-1.5 text-[0.95rem] font-light text-white/80">
                              {form.startDate
                                ? formatDate(
                                    addDays(form.startDate, RENTAL_DAYS),
                                  )
                                : `${RENTAL_DAYS} jours après la date de début`}
                            </div>
                            <div className="mt-1 text-[0.78rem] font-light text-white/35">
                              Durée minimale d&apos;un mois, non modifiable.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Étape Configuration (achat) ─────────────── */}
                      {currentStep === "config" && (
                        <div className="flex flex-col gap-6">
                          <div>
                            <span className="block text-[0.68rem] font-medium tracking-[0.16em] text-white/45 uppercase">
                              Quantité
                            </span>
                            <div className="mt-3 flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() =>
                                  update(
                                    "quantity",
                                    Math.max(1, form.quantity - 1),
                                  )
                                }
                                disabled={form.quantity <= 1}
                                aria-label="Retirer une unité"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:outline-none disabled:opacity-30"
                              >
                                <Minus className="h-4 w-4" />
                              </button>

                              <span
                                aria-live="polite"
                                className="min-w-[3ch] text-center text-2xl font-medium tracking-tight text-white"
                              >
                                {form.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  update(
                                    "quantity",
                                    Math.min(MAX_QUANTITY, form.quantity + 1),
                                  )
                                }
                                disabled={form.quantity >= MAX_QUANTITY}
                                aria-label="Ajouter une unité"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:outline-none disabled:opacity-30"
                              >
                                <Plus className="h-4 w-4" />
                              </button>

                              <span className="ml-1 text-[0.85rem] font-light text-white/40">
                                × {euros(PRICES.purchaseUnit)}
                              </span>
                            </div>
                          </div>

                          <fieldset>
                            <legend className="text-[0.68rem] font-medium tracking-[0.16em] text-white/45 uppercase">
                              Options
                            </legend>
                            <div className="mt-3 flex flex-col gap-2.5">
                              {OPTIONS.map((option) => {
                                const checked = form.options.includes(
                                  option.id,
                                );
                                return (
                                  <label
                                    key={option.id}
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-300 ${
                                      checked
                                        ? "border-cyan-300/40 bg-cyan-400/[0.07]"
                                        : "border-white/10 bg-white/[0.02] hover:border-white/25"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleOption(option.id)}
                                      className="h-4 w-4 accent-cyan-400"
                                    />
                                    <span className="text-[0.9rem] font-light text-white/80">
                                      {option.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                            <p className="mt-3 text-[0.78rem] font-light text-white/35">
                              Les options sont enregistrées avec votre commande
                              et chiffrées séparément : elles ne modifient pas
                              le montant réglé aujourd&apos;hui.
                            </p>
                          </fieldset>
                        </div>
                      )}

                      {/* ── Étape Coordonnées ───────────────────────── */}
                      {currentStep === "contact" && (
                        <div className="flex flex-col gap-5">
                          <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                              id="firstName"
                              label="Prénom"
                              error={errors.firstName}
                            >
                              <input
                                id="firstName"
                                type="text"
                                autoComplete="given-name"
                                placeholder="Camille"
                                value={form.firstName}
                                onChange={(event) =>
                                  update("firstName", event.target.value)
                                }
                                aria-invalid={Boolean(errors.firstName)}
                                aria-describedby={
                                  errors.firstName
                                    ? "firstName-erreur"
                                    : undefined
                                }
                                className={FIELD_CLASS}
                              />
                            </Field>

                            <Field
                              id="lastName"
                              label="Nom"
                              error={errors.lastName}
                            >
                              <input
                                id="lastName"
                                type="text"
                                autoComplete="family-name"
                                placeholder="Renaud"
                                value={form.lastName}
                                onChange={(event) =>
                                  update("lastName", event.target.value)
                                }
                                aria-invalid={Boolean(errors.lastName)}
                                aria-describedby={
                                  errors.lastName
                                    ? "lastName-erreur"
                                    : undefined
                                }
                                className={FIELD_CLASS}
                              />
                            </Field>
                          </div>

                          <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                              id="email"
                              label="Email"
                              error={errors.email}
                            >
                              <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="vous@exemple.com"
                                value={form.email}
                                onChange={(event) =>
                                  update("email", event.target.value)
                                }
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={
                                  errors.email ? "email-erreur" : undefined
                                }
                                className={FIELD_CLASS}
                              />
                            </Field>

                            <Field
                              id="phone"
                              label="Téléphone"
                              error={errors.phone}
                            >
                              <input
                                id="phone"
                                type="tel"
                                autoComplete="tel"
                                placeholder="06 12 34 56 78"
                                value={form.phone}
                                onChange={(event) =>
                                  update("phone", event.target.value)
                                }
                                aria-invalid={Boolean(errors.phone)}
                                aria-describedby={
                                  errors.phone ? "phone-erreur" : undefined
                                }
                                className={FIELD_CLASS}
                              />
                            </Field>
                          </div>

                          <Field
                            id="address"
                            label="Adresse de livraison"
                            error={errors.address}
                          >
                            <input
                              id="address"
                              type="text"
                              autoComplete="street-address"
                              placeholder="12 rue des Alpes, 38000 Grenoble"
                              value={form.address}
                              onChange={(event) =>
                                update("address", event.target.value)
                              }
                              aria-invalid={Boolean(errors.address)}
                              aria-describedby={
                                errors.address ? "address-erreur" : undefined
                              }
                              className={FIELD_CLASS}
                            />
                          </Field>
                        </div>
                      )}

                      {/* ── Étape Paiement ──────────────────────────── */}
                      {currentStep === "paiement" && (
                        <div className="flex flex-col gap-6">
                          <dl className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                            {[
                              plan === "leasing"
                                ? {
                                    label: "Période",
                                    value: `${formatDate(form.startDate)} → ${formatDate(addDays(form.startDate, RENTAL_DAYS))}`,
                                  }
                                : {
                                    label: "Quantité",
                                    value: `${form.quantity} unité${form.quantity > 1 ? "s" : ""}`,
                                  },
                              {
                                label: "Client",
                                value: `${form.firstName} ${form.lastName}`,
                              },
                              { label: "Email", value: form.email },
                              { label: "Téléphone", value: form.phone },
                              { label: "Adresse", value: form.address },
                              ...(plan === "achat" && form.options.length > 0
                                ? [
                                    {
                                      label: "Options",
                                      value: OPTIONS.filter((option) =>
                                        form.options.includes(option.id),
                                      )
                                        .map((option) => option.label)
                                        .join(", "),
                                    },
                                  ]
                                : []),
                            ].map((row) => (
                              <div
                                key={row.label}
                                className="flex items-baseline justify-between gap-6"
                              >
                                <dt className="shrink-0 text-[0.68rem] font-light tracking-[0.14em] text-white/35 uppercase">
                                  {row.label}
                                </dt>
                                <dd className="truncate text-right text-[0.88rem] font-light text-white/80">
                                  {row.value}
                                </dd>
                              </div>
                            ))}
                          </dl>

                          <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-5">
                            {plan === "leasing" ? (
                              <>
                                <Amount
                                  label="Loyer du 1er mois"
                                  value={euros(PRICES.monthlyRent)}
                                />
                                <Amount
                                  label="Expédition sécurisée"
                                  value={euros(PRICES.shipping)}
                                />
                              </>
                            ) : (
                              <Amount
                                label={`Précommande (${form.quantity} × ${euros(PRICES.purchaseUnit)})`}
                                value={euros(purchaseTotal)}
                              />
                            )}

                            <div className="mt-1 flex items-baseline justify-between border-t border-white/[0.07] pt-4">
                              <span className="text-[0.88rem] font-light text-white/60">
                                À régler maintenant
                              </span>
                              <span className="text-xl font-medium tracking-tight text-white">
                                {euros(
                                  plan === "leasing"
                                    ? rentalTotal
                                    : purchaseTotal,
                                )}
                              </span>
                            </div>
                          </div>

                          {plan === "achat" && (
                            <div className="flex items-start gap-3 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.05] px-4 py-3.5">
                              <CreditCard
                                className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300"
                                strokeWidth={1.5}
                              />
                              <p className="text-[0.8rem] leading-relaxed font-light text-cyan-50/70">
                                {INSTALLMENTS_NOTE}
                              </p>
                            </div>
                          )}

                          {plan === "leasing" && (
                            <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
                              <CreditCard
                                className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/70"
                                strokeWidth={1.5}
                              />
                              <p className="text-[0.8rem] leading-relaxed font-light text-white/45">
                                Une empreinte de votre carte est conservée pour
                                la caution de garantie. Aucun montant n&apos;est
                                débité à ce titre aujourd&apos;hui.
                              </p>
                            </div>
                          )}

                          <p className="text-[0.78rem] leading-relaxed font-light text-white/35">
                            Le paiement est traité par Stripe : aucune
                            coordonnée bancaire ne transite par ce site.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {serverError && (
                  <p
                    role="alert"
                    className="mt-5 rounded-xl border border-rose-400/25 bg-rose-500/[0.07] px-4 py-3 text-[0.82rem] font-light text-rose-200"
                  >
                    {serverError}
                  </p>
                )}

                <div className="mt-8 flex items-center justify-between gap-4">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="group inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-[0.82rem] font-medium text-white/70 transition-colors duration-300 hover:border-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:outline-none"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                      Retour
                    </button>
                  ) : (
                    <span />
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    data-autofocus={currentStep === "paiement" ? "" : undefined}
                    className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 px-7 py-3.5 text-[0.85rem] font-semibold tracking-[0.03em] text-[#04070D] shadow-[0_0_32px_-8px_rgba(56,189,248,0.8)] transition-all duration-300 hover:shadow-[0_0_48px_-6px_rgba(56,189,248,0.95)] focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C10] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Redirection…
                      </>
                    ) : (
                      <>
                        {currentStep === "paiement"
                          ? config.submitLabel
                          : "Continuer"}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>

                {/* Option d'achat : mention exigée sous le bouton de paiement. */}
                {plan === "leasing" && currentStep === "paiement" && (
                  <p className="mt-5 text-center text-[0.8rem] leading-relaxed font-light text-cyan-100/60">
                    Option d&apos;achat : 100 % de vos loyers versés sont
                    déduits si vous décidez d&apos;acheter ATMOS ONE (
                    {euros(PRICES.purchaseUnit)}).
                  </p>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
