"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Music2 } from "lucide-react";

import { EASE } from "@/lib/motion";

/**
 * Cette version de `lucide-react` ne fournit plus d'icônes de marque
 * (Instagram, Youtube… sont absents du paquet). On redessine donc les deux
 * repères nécessaires dans le même style de trait que le reste des icônes.
 */
function InstagramMark(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeMark(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="2" y="5" width="20" height="14" rx="4.5" />
      <path d="M10.3 9.2v5.6l4.7-2.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const NAVIGATION = [
  { label: "Produit", href: "#produit" },
  { label: "Protocoles", href: "#protocoles" },
  { label: "La science", href: "#science" },
  { label: "Offres", href: "#offres" },
  { label: "FAQ", href: "#faq" },
  { label: "Blog", href: "/blog" },
];

const SOCIALS = [
  {
    label: "Instagram",
    handle: "@atmos_performance",
    href: "https://www.instagram.com/atmos_performance",
    icon: InstagramMark,
  },
  {
    label: "YouTube",
    handle: "@atmos_performance",
    href: "https://www.youtube.com/@atmos_performance",
    icon: YoutubeMark,
  },
  {
    label: "TikTok",
    handle: "@atmos_performance",
    href: "https://www.tiktok.com/@atmos_performance",
    icon: Music2,
  },
];

const CONTACT_EMAIL = "contact@atmos-performance.com";

/** Figé volontairement : `new Date()` diffère entre serveur et client. */
const COPYRIGHT_YEAR = 2026;

export function SiteFooter() {
  return (
    <footer className="relative z-20 mt-8 border-t border-white/[0.07]">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16"
        >
          {/* ── Marque ─────────────────────────────────────────────── */}
          <div>
            <a
              href="#"
              className="text-[1.05rem] font-medium tracking-[0.42em] text-white/95 transition-colors hover:text-white"
            >
              ATMOS
            </a>

            <p className="mt-5 max-w-sm text-[0.9rem] leading-relaxed font-light text-white/45 text-pretty">
              ATMOS ONE, générateur d&apos;altitude hypoxique. De 0 à 6 500
              mètres simulés, pour la performance et l&apos;acclimatation.
            </p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="group mt-7 inline-flex items-center gap-2.5 text-[0.9rem] font-light text-white/65 transition-colors hover:text-white"
            >
              <Mail
                className="h-4 w-4 text-cyan-300/70 transition-colors group-hover:text-cyan-300"
                strokeWidth={1.5}
              />
              {CONTACT_EMAIL}
            </a>
          </div>

          {/* ── Navigation ─────────────────────────────────────────── */}
          <nav aria-label="Pied de page">
            <h2 className="text-[0.64rem] font-medium tracking-[0.24em] text-white/40 uppercase">
              Navigation
            </h2>
            <ul className="mt-6 flex flex-col gap-3.5">
              {NAVIGATION.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/") ? (
                    <Link
                      href={link.href}
                      className="text-[0.9rem] font-light text-white/55 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-[0.9rem] font-light text-white/55 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Réseaux ────────────────────────────────────────────── */}
          <div>
            <h2 className="text-[0.64rem] font-medium tracking-[0.24em] text-white/40 uppercase">
              Nous suivre
            </h2>
            <ul className="mt-6 flex flex-col gap-3.5">
              {SOCIALS.map(({ label, handle, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group inline-flex items-center gap-3 text-[0.9rem] font-light text-white/55 transition-colors hover:text-white"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-colors duration-300 group-hover:border-cyan-300/30">
                      <Icon
                        className="h-3.5 w-3.5 text-white/60 transition-colors duration-300 group-hover:text-cyan-300"
                        strokeWidth={1.5}
                      />
                    </span>
                    <span>
                      <span className="sr-only">{label} — </span>
                      {handle}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* ── Barre légale ─────────────────────────────────────────── */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-8 sm:flex-row">
          <p className="text-[0.78rem] font-light text-white/35">
            © {COPYRIGHT_YEAR} ATMOS PERFORMANCE. Tous droits réservés.
          </p>

          <Link
            href="/mentions-legales"
            className="text-[0.78rem] font-light text-white/45 transition-colors hover:text-white"
          >
            Mentions légales
          </Link>
        </div>
      </div>
    </footer>
  );
}
