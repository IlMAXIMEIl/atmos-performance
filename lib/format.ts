/**
 * Formateurs de nombres, sans aucune dépendance.
 *
 * Ils vivaient au bas de `lib/altitude.ts`, où seules les altitudes en
 * avaient l'usage. `lib/offering.ts` en a besoin à son tour pour écrire ses
 * montants — et ne peut pas importer `lib/altitude.ts`, qui importe déjà
 * `PURCHASE_PRICE_EUR` : le cycle serait immédiat. D'où ce module, que les
 * deux peuvent lire sans se croiser.
 *
 * `lib/altitude.ts` les réexporte, si bien qu'aucun appelant existant n'a à
 * changer d'import.
 */

/**
 * Formatage des milliers à la française.
 *
 * `toLocaleString` est écarté volontairement : selon la version d'ICU, il
 * sépare par une espace insécable fine ou par une espace insécable simple, et
 * l'écart entre le rendu serveur et le rendu navigateur suffit à déclencher une
 * erreur d'hydratation.
 */
export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const digits = String(rounded < 0 ? -rounded : rounded);

  let out = "";
  for (let i = 0; i < digits.length; i += 1) {
    // Une espace insécable fine tous les trois chiffres, en partant de la fin.
    if (i > 0 && (digits.length - i) % 3 === 0) out += "\u202F";
    out += digits[i];
  }

  return sign + out;
}

/** Un décimal, virgule française : « 13,6 ». */
export function formatDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const whole = Math.floor(Math.abs(rounded));
  const decimal = Math.round((Math.abs(rounded) - whole) * 10);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${formatNumber(whole)},${decimal}`;
}

/** « 45 min » ou « 1 h 05 » selon la durée. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes - hours * 60;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest < 10 ? "0" : ""}${rest}`;
}

/* ══════════════════════════════════════════════════════════════════════
   Dates et montants de l'espace d'administration

   Les commandes sont stockées en UTC et relues en ISO. Les afficher telles
   quelles décalerait chaque horodatage d'une à deux heures : une commande
   passée à 23 h 40 s'afficherait au lendemain, et le tri par date deviendrait
   incompréhensible pour qui traite les commandes.

   `Intl.DateTimeFormat` avec `timeZone: "Europe/Paris"` ferait le travail,
   mais c'est exactement ce que le reste du fichier évite : la sortie dépend
   de la version d'ICU embarquée, et l'écart entre le rendu serveur et le
   rendu navigateur suffit à déclencher une erreur d'hydratation. La règle
   d'heure d'été européenne tient en quelques lignes, sans dépendance et sans
   surprise.
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Instant, en millisecondes, du dernier dimanche d'un mois à 01:00 UTC.
 *
 * C'est la définition exacte de la bascule européenne : elle a lieu au même
 * instant dans toute l'Union, à 01:00 UTC, et non à une heure locale qui
 * varierait d'un fuseau à l'autre.
 */
function lastSundayAt1amUtc(year: number, month: number): number {
  // Mars et octobre comptent tous deux 31 jours : le 31 existe, et son jour
  // de la semaine donne directement le recul jusqu'au dernier dimanche.
  const lastDay = new Date(Date.UTC(year, month, 31));
  return Date.UTC(year, month, 31 - lastDay.getUTCDay(), 1);
}

/** `true` si l'instant tombe dans l'heure d'été — UTC+2 à Paris. */
function isSummerTime(ms: number, year: number): boolean {
  return ms >= lastSundayAt1amUtc(year, 2) && ms < lastSundayAt1amUtc(year, 9);
}

/** Découpe un instant ISO en composantes horaires parisiennes, sans `Intl`. */
function parisParts(iso: string) {
  const utc = new Date(iso);
  const ms = utc.valueOf();
  if (Number.isNaN(ms)) return null;

  const offsetHours = isSummerTime(ms, utc.getUTCFullYear()) ? 2 : 1;
  const local = new Date(ms + offsetHours * 3_600_000);
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    day: pad(local.getUTCDate()),
    month: pad(local.getUTCMonth() + 1),
    year: String(local.getUTCFullYear()),
    hours: pad(local.getUTCHours()),
    minutes: pad(local.getUTCMinutes()),
  };
}

/** Instant ISO → « 22/08/2026 », heure de Paris. */
export function formatParisDate(iso: string): string {
  const parts = parisParts(iso);
  return parts ? `${parts.day}/${parts.month}/${parts.year}` : "—";
}

/** Instant ISO → « 22/08/2026 08:10 », heure de Paris. */
export function formatParisDateTime(iso: string): string {
  const parts = parisParts(iso);
  if (!parts) return "—";
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hours}:${parts.minutes}`;
}

/**
 * Jour civil `2026-08-22` → « 22/08/2026 ».
 *
 * Distinct des deux formateurs ci-dessus : les dates de location sont des
 * **jours**, sans heure ni fuseau. Les faire passer par `new Date()` leur
 * inventerait un minuit UTC, donc un décalage de fuseau, donc un jour de
 * moins pour la moitié de l'année.
 */
export function formatDay(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value || "—";
}

/**
 * Montant en centimes vers une chaîne lisible : `189000` → « 1 890,00 € ».
 *
 * Les montants viennent de Stripe, donc **en centimes**. `formatEuros` prend
 * des euros et arrondit : l'employer ici ferait disparaître les centimes d'un
 * acompte ou d'un prorata de location.
 */
export function formatAmount(cents: number, currency = "eur"): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(Math.round(cents));
  const symbol = currency.toLowerCase() === "eur" ? "€" : currency.toUpperCase();

  return `${sign}${formatNumber(Math.floor(absolute / 100))},${String(
    absolute % 100,
  ).padStart(2, "0")} ${symbol}`;
}
