import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Réservation confirmée — ATMOS PERFORMANCE",
  description: "Votre acompte a bien été enregistré.",
  robots: { index: false },
};

export default function ReservationConfirmeePage() {
  return (
    <div className="relative min-h-screen w-full bg-[#0B0C10] font-[family-name:var(--font-geist-sans)] text-white selection:bg-cyan-400/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.14),transparent_70%)]"
      />

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-28 text-center sm:py-36 lg:px-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_40px_-8px_rgba(56,189,248,0.8)]">
          <Check className="h-6 w-6 text-cyan-200" strokeWidth={2} />
        </span>

        <h1 className="mt-9 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance sm:text-4xl">
          <span className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
            Votre place est réservée.
          </span>
        </h1>

        <p className="mt-6 max-w-lg text-base leading-relaxed font-light text-white/55 text-pretty">
          {
            "L'acompte a bien été enregistré. Vous recevez un récapitulatif par email dans les prochaines minutes. Notre équipe revient vers vous pour caler la date de mise en service."
          }
        </p>

        <p className="mt-4 text-[0.82rem] font-light text-white/35">
          Cet acompte reste remboursable et sera déduit du montant final.
        </p>

        <Link
          href="/"
          className="group mt-12 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white/85 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.07] hover:text-white"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={1.5}
          />
          Retour à l&apos;accueil
        </Link>
      </main>
    </div>
  );
}
