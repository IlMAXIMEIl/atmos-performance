import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Les deux seuls boutons de la refonte : plein accent, ou fantôme cerné.
 *
 * Les ancres internes (`#offres`) restent de simples `<a>` ; les routes
 * passent par `<Link>` pour la navigation client — même règle que la
 * navigation principale.
 */
export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
  ...rest
}: {
  href: string;
  variant?: "primary" | "ghost";
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">) {
  const classes = [
    "group inline-flex items-center justify-center gap-2.5 rounded-full border px-7 py-3.5",
    "text-sm font-semibold tracking-[-0.01em] transition-[transform,box-shadow,color,border-color,background-color] duration-300",
    "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent",
    variant === "primary"
      ? "border-transparent bg-accent text-void shadow-[0_10px_40px_-12px_var(--accent)] hover:-translate-y-0.5 hover:shadow-[0_18px_46px_-12px_var(--accent)]"
      : "border-line-strong bg-transparent text-ink hover:border-accent hover:text-accent",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  );
}
