"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Music2 } from "lucide-react";

import { EASE } from "@/lib/motion";
import { ouvrirBandeau } from "@/lib/consentement";
import { FOOTER_GROUPS, LEGAL_LINKS } from "@/lib/navigation";
import { CONTACT_EMAIL, SOCIAL_URLS } from "@/lib/site";

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

const SOCIALS = [
  {
    label: "Instagram",
    handle: "@atmos_performance",
    href: SOCIAL_URLS.instagram,
    icon: InstagramMark,
  },
  {
    label: "YouTube",
    handle: "@atmos_performance",
    href: SOCIAL_URLS.youtube,
    icon: YoutubeMark,
  },
  {
    label: "TikTok",
    handle: "@atmos_performance",
    href: SOCIAL_URLS.tiktok,
    icon: Music2,
  },
];

/** Figé volontairement : `new Date()` diffère entre serveur et client. */
const COPYRIGHT_YEAR = 2026;

export function SiteFooter() {
  return (
    <footer className="relative z-20 mt-8 border-t border-line">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-[1.5fr_repeat(3,1fr)] lg:gap-x-12"
        >
          {/* ── Marque ─────────────────────────────────────────────── */}
          <div className="col-span-2 lg:col-span-1">
            <a
              href="#"
              className="font-mono text-[0.95rem] tracking-[0.28em] text-ink transition-colors hover:text-accent"
            >
              ATMOS
            </a>

            <p className="mt-5 max-w-sm text-[0.9rem] leading-relaxed font-light text-dim text-pretty">
              ATMOS ONE, générateur d&apos;altitude hypoxique. De 0 à 6 500
              mètres simulés, pour la performance et l&apos;acclimatation.
            </p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="group mt-7 inline-flex items-center gap-2.5 text-[0.9rem] font-light text-dim transition-colors hover:text-ink"
            >
              <Mail
                className="h-4 w-4 text-accent/70 transition-colors group-hover:text-accent"
                strokeWidth={1.5}
              />
              {CONTACT_EMAIL}
            </a>

            {/* Une rangée d'icônes plutôt qu'une colonne de pseudonymes : le
                pseudonyme est le même sur les trois réseaux, l'écrire trois
                fois occupait une colonne entière pour ne rien apprendre. */}
            <ul className="mt-8 flex items-center gap-3">
              {SOCIALS.map(({ label, handle, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${label} — ${handle}`}
                    className="group flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white/[0.03] transition-colors duration-300 hover:border-accent/40"
                  >
                    <Icon
                      className="h-4 w-4 text-dim transition-colors duration-300 group-hover:text-accent"
                      strokeWidth={1.5}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/*
            Les trois mêmes groupes que le volet en tête de page.

            Une colonne unique de treize entrées se lisait comme une liste de
            courses : rien n'y disait ce qui relevait du produit, de la
            documentation ou de la maison. Les colonnes tiennent le même
            nombre de liens sur un tiers de la hauteur.
          */}
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-mono text-[0.64rem] tracking-[0.24em] text-dimmer uppercase">
                {group.title}
              </h2>

              <ul className="mt-6 flex flex-col gap-3.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.9rem] font-light text-dim transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

        </motion.div>

        {/* ── Barre légale ─────────────────────────────────────────── */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <p className="text-[0.78rem] font-light text-dimmer">
            © {COPYRIGHT_YEAR} ATMOS PERFORMANCE. Tous droits réservés.
          </p>

          <div className="flex items-center gap-5">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.78rem] font-light text-dim transition-colors hover:text-ink"
              >
                {link.short ?? link.label}
              </Link>
            ))}
            {/* Le retrait du consentement, accessible depuis chaque page :
                rouvre le bandeau — exigence RGPD, voir lib/consentement.ts. */}
            <button
              type="button"
              onClick={ouvrirBandeau}
              className="text-[0.78rem] font-light text-dim transition-colors hover:text-ink"
            >
              Cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
