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
