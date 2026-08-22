import type { ComponentProps, ReactNode } from "react";

/**
 * Surtitre de section : chasse fixe, capitales espacées, filet d'accent.
 *
 * C'est la marque typographique de la refonte — elle annonce chaque scène et
 * revient à l'identique du hero jusqu'à la pré-vente. Le filet est un
 * pseudo-élément, pas un `<span>` : il ne doit rien peser dans le texte lu
 * par un lecteur d'écran.
 */
export function Eyebrow({
  children,
  as: Tag = "p",
  tone = "accent",
  rule = true,
  className = "",
  ...rest
}: {
  children: ReactNode;
  /**
   * Quand le surtitre *est* le titre de la section — le déroulé de la
   * précommande, par exemple — il doit sortir comme tel dans le plan du
   * document, sans changer d'apparence.
   */
  as?: "p" | "h2" | "h3";
  /** `warm` distingue les blocs de récupération des blocs d'hypoxie. */
  tone?: "accent" | "warm";
  /** Le filet se retire quand le surtitre est déjà tenu par un cadre. */
  rule?: boolean;
  className?: string;
} & Omit<ComponentProps<"p">, "className" | "children">) {
  return (
    <Tag
      {...rest}
      className={[
        "flex items-center gap-2.5 font-mono text-[0.68rem] tracking-[0.22em] uppercase",
        tone === "warm" ? "text-warm" : "text-accent",
        rule
          ? "before:h-px before:w-6 before:flex-none before:bg-current before:content-['']"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
