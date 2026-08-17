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
  LoaderCircle,
  Lock,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import { EASE } from "@/lib/motion";

export type PlanId = "achat" | "leasing";

type Props = {
  open: boolean;
  onClose: () => void;
  plan: PlanId;
};

type StepId = "dates" | "contact" | "paiement";

const STEP_META: Record<StepId, { label: string; icon: LucideIcon }> = {
  dates: { label: "Dates", icon: CalendarDays },
  contact: { label: "Coordonnées", icon: User },
  paiement: { label: "Paiement", icon: Lock },
};

/**
 * L'étape de dates n'existe qu'en location : une plage de dates n'a pas de
 * sens pour un achat ferme.
 */
const PLAN_CONFIG: Record<
  PlanId,
  {
    eyebrow: string;
    title: string;
    steps: StepId[];
    recapPlan: string;
    amountLabel: string;
    amount: string;
    submitLabel: string;
    note: string;
  }
> = {
  leasing: {
    eyebrow: "Location · Vague #1",
    title: "Louer ATMOS ONE",
    steps: ["dates", "contact", "paiement"],
    recapPlan: "Location",
    amountLabel: "Caution à régler maintenant",
    amount: "500 €",
    submitLabel: "Régler la caution",
    note: "Entièrement remboursable en fin de location. Le paiement est traité par Stripe : aucune coordonnée bancaire ne transite par ce site.",
  },
  achat: {
    eyebrow: "Achat · Vague #1",
    title: "Acheter ATMOS ONE",
    steps: ["contact", "paiement"],
    recapPlan: "Achat",
    amountLabel: "Acompte à régler maintenant",
    amount: "300 €",
    submitLabel: "Régler l'acompte",
    note: "Acompte déduit du prix de 1 890 €. Le solde de 1 590 € est réglé avant ou à la livraison. Le paiement est traité par Stripe : aucune coordonnée bancaire ne transite par ce site.",
  },
};

const EMPTY_FORM = {
  startDate: "",
  endDate: "",
  name: "",
  email: "",
  phone: "",
  address: "",
};

type FormState = typeof EMPTY_FORM;
type FieldErrors = Partial<Record<keyof FormState, string>>;

// Les montants affichés ci-dessus le sont à titre indicatif : le serveur reste
// seul maître de la somme réellement débitée.

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[0.95rem] font-light text-white placeholder:text-white/25 transition-colors duration-300 [color-scheme:dark] focus:border-cyan-300/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-cyan-300/20";

/** Date du jour au format `YYYY-MM-DD`, dans le fuseau du visiteur. */
function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function formatDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function validateDates(form: FormState, minDate: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.startDate) {
    errors.startDate = "Choisissez une date de début.";
  } else if (minDate && form.startDate < minDate) {
    errors.startDate = "La date de début ne peut pas être passée.";
  }

  if (!form.endDate) {
    errors.endDate = "Choisissez une date de fin.";
  } else if (form.startDate && form.endDate <= form.startDate) {
    errors.endDate = "La date de fin doit suivre la date de début.";
  }

  return errors;
}

function validateContact(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.name.trim()) errors.name = "Indiquez votre nom.";
  if (!form.email.trim()) {
    errors.email = "Indiquez votre email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
    errors.email = "Cette adresse email semble incomplète.";
  }
  if (!form.phone.trim()) errors.phone = "Indiquez un téléphone.";
  if (!form.address.trim()) errors.address = "Indiquez une adresse de livraison.";

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

  // Le contenu de la modale n'est monté que lorsqu'elle est ouverte, donc
  // jamais présent dans le HTML rendu côté serveur : `new Date()` ne peut pas
  // provoquer d'écart d'hydratation ici.
  const minDate = open ? todayISO() : "";

  // `showModal` place la boîte dans la couche supérieure et prend en charge le
  // piège à focus et la touche Échap.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
  }, [open]);

  // Échap : on annule la fermeture native pour laisser jouer l'animation.
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

  // La page derrière ne doit pas défiler pendant que la modale est ouverte.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Le focus suit l'étape affichée.
  useEffect(() => {
    if (!open) return;
    const target = panelRef.current?.querySelector<HTMLElement>(
      "input, [data-autofocus]",
    );
    target?.focus();
  }, [open, step]);

  const update = useCallback((field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }, []);

  function goBack() {
    setDirection(-1);
    setErrors({});
    setStep((current) => Math.max(0, current - 1));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const currentStep = steps[step];

    if (currentStep !== "paiement") {
      const found =
        currentStep === "dates"
          ? validateDates(form, minDate)
          : validateContact(form);
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
          // Réinitialisation une fois la sortie jouée : la prochaine ouverture
          // repart d'un formulaire vierge, sans vider les champs sous les yeux
          // de l'utilisateur pendant l'animation.
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
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B0C10] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
          >
            {/* Halo d'accent en tête de modale */}
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
                    const item = STEP_META[stepId];
                    const Icon = item.icon;
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
                          {item.label}
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

              {/* Étapes */}
              <form onSubmit={handleSubmit} noValidate className="mt-8">
                <div ref={panelRef} className="min-h-[17rem]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={step} {...slide}>
                      {steps[step] === "dates" && (
                        <div className="flex flex-col gap-5">
                          <p className="text-[0.88rem] leading-relaxed font-light text-white/50">
                            Indiquez la période de location souhaitée. Elle reste
                            ajustable avec notre équipe après la réservation.
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
                                errors.startDate ? "startDate-erreur" : undefined
                              }
                              className={FIELD_CLASS}
                            />
                          </Field>

                          <Field
                            id="endDate"
                            label="Date de fin"
                            error={errors.endDate}
                          >
                            <input
                              id="endDate"
                              type="date"
                              value={form.endDate}
                              min={form.startDate || minDate}
                              onChange={(event) =>
                                update("endDate", event.target.value)
                              }
                              aria-invalid={Boolean(errors.endDate)}
                              aria-describedby={
                                errors.endDate ? "endDate-erreur" : undefined
                              }
                              className={FIELD_CLASS}
                            />
                          </Field>
                        </div>
                      )}

                      {steps[step] === "contact" && (
                        <div className="flex flex-col gap-5">
                          <Field id="name" label="Nom complet" error={errors.name}>
                            <input
                              id="name"
                              type="text"
                              autoComplete="name"
                              placeholder="Camille Renaud"
                              value={form.name}
                              onChange={(event) => update("name", event.target.value)}
                              aria-invalid={Boolean(errors.name)}
                              aria-describedby={errors.name ? "name-erreur" : undefined}
                              className={FIELD_CLASS}
                            />
                          </Field>

                          <div className="grid gap-5 sm:grid-cols-2">
                            <Field id="email" label="Email" error={errors.email}>
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

                            <Field id="phone" label="Téléphone" error={errors.phone}>
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

                      {steps[step] === "paiement" && (
                        <div className="flex flex-col gap-6">
                          <dl className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                            {[
                              { label: "Formule", value: config.recapPlan },
                              ...(plan === "leasing"
                                ? [
                                    {
                                      label: "Période de location",
                                      value: `${formatDate(form.startDate)} → ${formatDate(form.endDate)}`,
                                    },
                                  ]
                                : []),
                              { label: "Nom", value: form.name },
                              { label: "Email", value: form.email },
                              { label: "Téléphone", value: form.phone },
                              { label: "Adresse", value: form.address },
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

                          <div className="flex items-baseline justify-between border-t border-white/[0.07] pt-5">
                            <span className="text-[0.88rem] font-light text-white/60">
                              {config.amountLabel}
                            </span>
                            <span className="text-xl font-medium tracking-tight text-white">
                              {config.amount}
                            </span>
                          </div>

                          <p className="text-[0.78rem] leading-relaxed font-light text-white/35">
                            {config.note}
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

                {/* Navigation */}
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
                    data-autofocus={steps[step] === "paiement" ? "" : undefined}
                    className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 px-7 py-3.5 text-[0.85rem] font-semibold tracking-[0.03em] text-[#04070D] shadow-[0_0_32px_-8px_rgba(56,189,248,0.8)] transition-all duration-300 hover:shadow-[0_0_48px_-6px_rgba(56,189,248,0.95)] focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C10] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Redirection…
                      </>
                    ) : (
                      <>
                        {steps[step] === "paiement"
                          ? config.submitLabel
                          : "Continuer"}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
