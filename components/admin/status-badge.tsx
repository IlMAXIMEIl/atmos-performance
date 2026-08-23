// `@/lib/order-status` et non `@/lib/orders` : ce composant est rendu à
// l'intérieur du tableau, qui est un composant client. Passer par
// `lib/orders` entraînerait `mysql2` — donc `net` et `tls` — dans le paquet
// du navigateur, et la compilation échoue.
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status";

/**
 * Pastille de statut, identique dans la liste, la fiche et le journal.
 *
 * Les quatre teintes viennent des jetons existants, sans en ajouter :
 *
 * - **reçue** est neutre — elle n'appelle pas l'œil, c'est l'état par défaut
 *   de toute commande qui vient d'arriver ;
 * - **en fabrication** prend l'accent, la couleur de ce qui est en cours ;
 * - **expédiée** prend le contrepoint chaud. `globals.css` le réserve aux
 *   signaux de récupération sur les pages publiques ; ici il n'y en a aucun,
 *   et c'est le seul jeton qui se lise comme un aboutissement sans se
 *   confondre avec l'accent ;
 * - **annulée** prend l'alerte, déjà utilisée par les échecs de paiement.
 */
const STYLES: Record<OrderStatus, string> = {
  recue: "border-line-strong bg-white/[0.04] text-dim",
  en_fabrication: "border-accent/40 bg-accent-soft text-accent",
  expediee: "border-warm/35 bg-warm/10 text-warm",
  annulee: "border-danger/40 bg-danger/10 text-danger-soft",
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.66rem] tracking-[0.12em] whitespace-nowrap uppercase ${STYLES[status]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
