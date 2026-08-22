"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, CreditCard, LoaderCircle, X } from "lucide-react";

import {
  DROP_NAME,
  DROP_SCARCITY,
  INSTALLMENTS_NOTE,
  PREORDER_STEPS,
  WAITLIST_SUBTITLE,
  WAITLIST_TITLE,
} from "@/lib/offering";
import { WaitlistConsent } from "@/components/waitlist-consent";
import { EASE } from "@/lib/motion";

type Props = {
  open: boolean;
  onClose: () => void;
};

const FIELD_CLASS =
  "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-[0.95rem] font-light text-ink placeholder:text-dimmer transition-colors duration-300 focus:border-accent/40 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-accent";

/**
 * Capture de lead du Drop n°1.
 *
 * Tant que `ORDERS_OPEN` vaut `false`, c'est elle que les boutons d'action
 * ouvrent : aucun paiement n'est encaissé, on ne demande donc ni adresse ni
 * quantité. Le tunnel de commande complet reste dans `reservation-modal.tsx`,
 * prêt à reprendre la main le jour de l'ouverture.
 */
export function WaitlistModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "envoi" | "ok">("idle");

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
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Cette adresse email semble incomplète.");
      return;
    }

    setState("envoi");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, source: "drop-1" }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Inscription impossible.");
        setState("idle");
        return;
      }
      setState("ok");
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
      setState("idle");
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby="liste-prioritaire-titre"
      className="m-auto w-[min(34rem,calc(100vw-2rem))] bg-transparent p-0 text-ink backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence
        onExitComplete={() => {
          dialogRef.current?.close();
          setFirstName("");
          setEmail("");
          setError(null);
          setState("idle");
        }}
      >
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain rounded-xl border border-line bg-void shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.18),transparent_70%)]"
            />

            <div ref={panelRef} className="relative p-7 sm:p-9">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <span className="font-mono text-[0.62rem] tracking-[0.24em] text-accent uppercase">
                    {`${DROP_NAME} · ${WAITLIST_SUBTITLE}`}
                  </span>
                  <h2
                    id="liste-prioritaire-titre"
                    className="mt-2.5 text-xl leading-[1.2] font-medium tracking-[-0.02em] text-balance text-ink sm:text-2xl"
                  >
                    {WAITLIST_TITLE}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="-mt-1 rounded-full border border-line p-2 text-dim transition-colors hover:border-line-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {state === "ok" ? (
                <div className="mt-9 flex flex-col items-center gap-4 rounded-2xl border border-accent/40 bg-accent/[0.06] px-6 py-9 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-accent/10">
                    <Check className="h-5 w-5 text-accent" strokeWidth={2} />
                  </span>
                  <p className="text-[0.95rem] font-light text-accent">
                    Vous êtes sur la liste prioritaire.
                  </p>
                  <p className="max-w-sm text-[0.85rem] leading-relaxed font-light text-dim text-pretty">
                    {`Vous serez prévenu par email avant tout le monde à l'ouverture du ${DROP_NAME}, avec un accès réservé pendant 48 heures.`}
                  </p>
                </div>
              ) : (
                <>
                  <p className="mt-5 text-[0.9rem] leading-relaxed font-light text-dim text-pretty">
                    {`${DROP_SCARCITY}. L'inscription est sans engagement et ne demande aucun paiement : elle vous réserve simplement l'accès à l'ouverture des commandes.`}
                  </p>

                  {/* Déroulé de la précommande */}
                  <ol className="mt-7 flex flex-col gap-3.5">
                    {PREORDER_STEPS.map((step, index) => (
                      <li key={step.title} className="flex items-start gap-3.5">
                        <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/[0.08] text-[0.68rem] font-medium text-accent">
                          {index + 1}
                        </span>
                        <div>
                          <div className="text-[0.88rem] font-medium tracking-tight text-ink">
                            {step.title}
                          </div>
                          <div className="mt-0.5 text-[0.8rem] leading-relaxed font-light text-dimmer text-pretty">
                            {step.detail}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <form onSubmit={handleSubmit} noValidate className="mt-8">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="liste-prenom"
                          className="font-mono block text-[0.68rem] tracking-[0.16em] text-dim uppercase"
                        >
                          Prénom{" "}
                          <span className="normal-case">(facultatif)</span>
                        </label>
                        <input
                          id="liste-prenom"
                          type="text"
                          autoComplete="given-name"
                          placeholder="Camille"
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          className={`mt-2 ${FIELD_CLASS}`}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="liste-email"
                          className="font-mono block text-[0.68rem] tracking-[0.16em] text-dim uppercase"
                        >
                          Email
                        </label>
                        <input
                          id="liste-email"
                          type="email"
                          autoComplete="email"
                          placeholder="vous@exemple.com"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            setError(null);
                          }}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? "liste-erreur" : undefined}
                          className={`mt-2 ${FIELD_CLASS}`}
                        />
                      </div>
                    </div>

                    <WaitlistConsent className="mt-3.5" />

                    {error && (
                      <p
                        id="liste-erreur"
                        role="alert"
                        className="mt-3 text-[0.78rem] font-light text-rose-300/90"
                      >
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={state === "envoi"}
                      className="group relative mt-6 inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-accent px-7 py-3.5 text-[0.85rem] font-semibold tracking-[0.03em] text-void shadow-[0_0_32px_-8px_rgba(56,189,248,0.8)] transition-all duration-300 hover:shadow-[0_0_48px_-6px_rgba(56,189,248,0.95)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-void focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {state === "envoi" ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Inscription…
                        </>
                      ) : (
                        <>
                          Rejoindre la liste prioritaire
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>

                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-line bg-white/[0.02] px-4 py-3.5">
                      <CreditCard
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        strokeWidth={1.5}
                      />
                      <p className="text-[0.8rem] leading-relaxed font-light text-dim">
                        {INSTALLMENTS_NOTE}
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
