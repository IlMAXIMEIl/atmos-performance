/**
 * Modèle physiologique du simulateur d'altitude.
 *
 * Deux règles gouvernent ce fichier :
 *
 * 1. **Aucun calcul non déterministe.** Le simulateur est rendu côté serveur
 *    puis hydraté : la moindre différence de virgule flottante entre Node et le
 *    navigateur casserait l'hydratation. On n'utilise donc que `+ - * /` et
 *    `Math.round`, jamais `Math.pow` ni `Intl` (dont l'espace d'un millier
 *    varie d'une version d'ICU à l'autre).
 * 2. **Des valeurs indicatives.** Les protocoles renvoyés ici sont des points
 *    de départ raisonnables, pas une prescription. L'oxymètre reste l'arbitre.
 */

import { PURCHASE_PRICE_EUR } from "@/lib/offering";

/** Fraction d'oxygène de l'air ambiant au niveau de la mer, en %. */
export const SEA_LEVEL_FIO2 = 20.9;

/** Plafond du générateur ATMOS ONE, en mètres simulés. */
export const MAX_ALTITUDE = 6500;

/**
 * Correspondance altitude (m) → FiO₂ équivalente (%), tabulée tous les 250 m.
 *
 * Issue de l'atmosphère standard ISA : `FiO₂ = 20,9 × (1 − 2,25577e−5 × h)^5,25588`.
 * On tabule plutôt que de recalculer la puissance à chaque rendu, ce qui rend
 * le résultat identique au bit près sur toutes les plateformes. L'interpolation
 * linéaire entre deux bornes écarte de moins de 0,02 point du modèle exact.
 */
const CURVE: readonly (readonly [number, number])[] = [
  [0, 20.9],
  [250, 20.29],
  [500, 19.69],
  [750, 19.11],
  [1000, 18.54],
  [1250, 17.98],
  [1500, 17.44],
  [1750, 16.91],
  [2000, 16.4],
  [2250, 15.89],
  [2500, 15.4],
  [2750, 14.93],
  [3000, 14.46],
  [3250, 14.01],
  [3500, 13.56],
  [3750, 13.13],
  [4000, 12.71],
  [4250, 12.31],
  [4500, 11.91],
  [4750, 11.52],
  [5000, 11.14],
  [5250, 10.78],
  [5500, 10.42],
  [5750, 10.07],
  [6000, 9.73],
  [6250, 9.4],
  [6500, 9.08],
];

/**
 * Borne basse du module de conversion : la FiO₂ affichée au plafond de
 * l'appareil. On repart de la valeur arrondie pour que l'aller-retour
 * 6 500 m → 9,1 % → 6 500 m retombe exactement sur ses pieds.
 */
export const MIN_FIO2 = 9.1;

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}

/** Altitude simulée (m) → fraction d'oxygène (%), arrondie au dixième. */
export function fio2AtAltitude(metres: number): number {
  const target = clamp(metres, 0, MAX_ALTITUDE);

  for (let i = 1; i < CURVE.length; i += 1) {
    const [highAltitude, lowFio2] = CURVE[i];
    if (target > highAltitude) continue;

    const [lowAltitude, highFio2] = CURVE[i - 1];
    const ratio = (target - lowAltitude) / (highAltitude - lowAltitude);
    const value = highFio2 + (lowFio2 - highFio2) * ratio;
    return Math.round(value * 10) / 10;
  }

  return MIN_FIO2;
}

/**
 * Fraction d'oxygène (%) → altitude simulée (m), arrondie au palier de 50 m.
 *
 * Ce pas est celui du curseur d'altitude : un arrondi plus fin renverrait des
 * valeurs hors crans, et afficherait 4 010 m là où la table de correspondance
 * de la page annonce 4 000 m pour 12,7 %.
 */
export function altitudeForFio2(fio2: number): number {
  const target = clamp(fio2, MIN_FIO2, SEA_LEVEL_FIO2);

  // La table s'arrête à 9,08 % : sans ce raccourci, la borne affichée (9,1 %)
  // retomberait 20 m sous le plafond et les deux curseurs se désaccorderaient.
  if (target <= MIN_FIO2) return MAX_ALTITUDE;

  for (let i = 1; i < CURVE.length; i += 1) {
    const [highAltitude, lowFio2] = CURVE[i];
    if (target < lowFio2) continue;

    const [lowAltitude, highFio2] = CURVE[i - 1];
    const ratio = (highFio2 - target) / (highFio2 - lowFio2);
    const value = lowAltitude + (highAltitude - lowAltitude) * ratio;
    return Math.round(value / 50) * 50;
  }

  return MAX_ALTITUDE;
}

/** Repère géographique le plus proche, pour donner une échelle au chiffre. */
export function landmarkFor(metres: number): string {
  if (metres < 400) return "Niveau de la mer";
  if (metres < 1200) return "Moyenne montagne, collines vosgiennes";
  if (metres < 1900) return "Font-Romeu, centre national d'altitude";
  if (metres < 2600) return "Sierra Nevada, plage classique du Live High";
  if (metres < 3300) return "Col du Stelvio, seuil du mal aigu des montagnes";
  if (metres < 4100) return "Aiguille du Midi, 3 842 m";
  if (metres < 4900) return "Mont Blanc, 4 808 m";
  if (metres < 5600) return "Camp de base de l'Everest, 5 364 m";
  if (metres < 6200) return "Kilimandjaro, 5 895 m";
  return "Plafond ATMOS ONE, au-delà du camp 1 de l'Everest";
}

/* ── Étape 1 : le profil ────────────────────────────────────────────── */

export const PROFILES = [
  {
    id: "endurance",
    label: "Sportif d'endurance",
    detail: "Course, trail, cyclisme, triathlon, ski de fond.",
  },
  {
    id: "biohacking",
    label: "Biohacking & longévité",
    detail: "Santé métabolique, densité mitochondriale, âge biologique.",
  },
  {
    id: "reeducation",
    label: "Rééducation / kiné",
    detail: "Reprise encadrée, charge articulaire réduite.",
  },
  {
    id: "sante",
    label: "Santé générale",
    detail: "Souffle, tolérance à l'effort, énergie au quotidien.",
  },
] as const;

/* ── Étape 2 : l'objectif ───────────────────────────────────────────── */

export const GOALS = [
  {
    id: "vo2max",
    label: "Développement VO2 max",
    detail: "Élever le plafond aérobie par la contrainte hypoxique.",
  },
  {
    id: "affutage",
    label: "Affûtage pré-compétition",
    detail: "Aiguiser la réponse ventilatoire avant l'objectif.",
  },
  {
    id: "recuperation",
    label: "Récupération post-blessure",
    detail: "Stimuler sans charge mécanique pendant l'indisponibilité.",
  },
  {
    id: "stress",
    label: "Régulation stress & sommeil",
    detail: "Travailler le tonus vagal et la qualité des nuits.",
  },
] as const;

/* ── Étape 3 : le niveau d'exposition ───────────────────────────────── */

export const LEVELS = [
  {
    id: "debutant",
    label: "Débutant en hypoxie",
    detail: "Jamais exposé, ou moins de dix séances au compteur.",
  },
  {
    id: "intermediaire",
    label: "Intermédiaire",
    detail: "Un ou deux cycles derrière vous, tolérance connue.",
  },
  {
    id: "confirme",
    label: "Athlète confirmé",
    detail: "Pratique régulière, séjours ou stages en altitude réelle.",
  },
] as const;

export type ProfileId = (typeof PROFILES)[number]["id"];
export type GoalId = (typeof GOALS)[number]["id"];
export type LevelId = (typeof LEVELS)[number]["id"];

export type Protocol = {
  /** Palier de croisière, en mètres simulés. */
  altitude: number;
  /** Fraction d'oxygène correspondante, en %. */
  fio2: number;
  /** Palier de la première semaine, le temps que la tolérance s'installe. */
  rampAltitude: number;
  rampFio2: number;
  hypoxiaMinutes: number;
  normoxiaMinutes: number;
  cycles: number;
  totalMinutes: number;
  sessionsPerWeek: number;
  weeks: number;
  /** Plage SpO₂ à tenir pendant la phase hypoxique, en %. */
  spo2: readonly [number, number];
  modality: string;
  family: string;
  complement: string | null;
};

/**
 * Plage de SpO₂ attendue au palier donné, en %.
 *
 * Elle se déduit de l'altitude et non du niveau déclaré : prescrire « tenir
 * 91 à 96 % » à un palier de 3 800 m serait intenable, la saturation y descend
 * mécaniquement plus bas. C'est donc le palier qui se règle pour atteindre la
 * plage, jamais l'inverse. Le plancher est bloqué à 80 % : en dessous, la
 * consigne est d'interrompre la séance, pas de la poursuivre.
 */
function spo2Band(altitude: number): readonly [number, number] {
  if (altitude < 2200) return [93, 96];
  if (altitude < 2800) return [91, 94];
  if (altitude < 3400) return [89, 93];
  if (altitude < 4000) return [87, 91];
  if (altitude < 4600) return [85, 89];
  if (altitude < 5200) return [83, 87];
  if (altitude < 5800) return [81, 85];
  return [80, 84];
}

/** Durée d'une séance au-delà de laquelle nous ne recommandons plus rien. */
const MAX_SESSION_MINUTES = 60;

/** Socle de dosage propre à chaque objectif, avant ajustements. */
const GOAL_BASE: Record<
  GoalId,
  {
    altitude: number;
    hypoxia: number;
    normoxia: number;
    minutes: number;
    sessions: number;
    weeks: number;
    family: string;
    modality: string;
    complement: string | null;
  }
> = {
  vo2max: {
    altitude: 5000,
    hypoxia: 5,
    normoxia: 3,
    minutes: 45,
    sessions: 3,
    weeks: 6,
    family: "Train High · hypoxie intermittente",
    modality: "Sous masque, sur home-trainer en zone 2 à 3",
    complement: null,
  },
  affutage: {
    altitude: 4300,
    hypoxia: 6,
    normoxia: 4,
    minutes: 40,
    sessions: 4,
    weeks: 3,
    family: "Train High · bloc d'affûtage",
    modality: "Sous masque, au repos ou en pédalage léger",
    complement:
      "Arrêtez le bloc 5 à 7 jours avant l'échéance : la dernière semaine sert à absorber la charge, pas à en ajouter.",
  },
  recuperation: {
    altitude: 3200,
    hypoxia: 4,
    normoxia: 4,
    minutes: 35,
    sessions: 4,
    weeks: 8,
    family: "IHT douce · maintien de la charge interne",
    modality: "Sous masque, au repos complet, assis ou allongé",
    complement:
      "L'intérêt de la période : une contrainte cardio-respiratoire sans aucune charge mécanique sur la zone lésée. À valider avec le praticien qui vous suit.",
  },
  stress: {
    altitude: 2600,
    hypoxia: 5,
    normoxia: 5,
    minutes: 40,
    sessions: 5,
    weeks: 8,
    family: "Live Low · exposition douce",
    modality: "Sous masque, assis, respiration nasale calme",
    complement:
      "Ce protocole se marie bien avec le mode Sommeil : une fois la tolérance installée, des nuits sous tente au même palier prolongent l'exposition sans y consacrer de temps éveillé.",
  },
};

/** Décalages appliqués par profil : qui vous êtes déplace le curseur. */
const PROFILE_SHIFT: Record<
  ProfileId,
  { altitude: number; minutes: number; sessions: number }
> = {
  endurance: { altitude: 300, minutes: 5, sessions: 0 },
  biohacking: { altitude: 0, minutes: 0, sessions: 0 },
  reeducation: { altitude: -500, minutes: -5, sessions: 0 },
  sante: { altitude: -400, minutes: -5, sessions: -1 },
};

/** Décalages appliqués par niveau d'exposition. */
const LEVEL_SHIFT: Record<
  LevelId,
  {
    altitude: number;
    hypoxia: number;
    minutes: number;
    sessions: number;
    weeks: number;
  }
> = {
  debutant: { altitude: -700, hypoxia: -1, minutes: -10, sessions: -1, weeks: 0 },
  intermediaire: { altitude: 0, hypoxia: 0, minutes: 0, sessions: 0, weeks: 0 },
  confirme: { altitude: 500, hypoxia: 1, minutes: 10, sessions: 1, weeks: 1 },
};

/**
 * Compose le protocole recommandé.
 *
 * L'objectif fixe le socle, le profil et le niveau le déplacent. Tout est
 * ensuite borné : aucune combinaison ne peut sortir des plages que nous
 * assumons de recommander.
 */
export function buildProtocol(
  profileId: ProfileId,
  goalId: GoalId,
  levelId: LevelId,
): Protocol {
  const base = GOAL_BASE[goalId];
  const profile = PROFILE_SHIFT[profileId];
  const level = LEVEL_SHIFT[levelId];

  const rawAltitude = base.altitude + profile.altitude + level.altitude;
  // Arrondi au palier de 100 m : la station se règle ainsi, et un chiffre rond
  // se retient mieux qu'un 4 273 m faussement précis.
  const altitude = Math.round(clamp(rawAltitude, 1800, 6000) / 100) * 100;

  const hypoxiaMinutes = Math.round(clamp(base.hypoxia + level.hypoxia, 3, 7));
  const normoxiaMinutes = Math.round(clamp(base.normoxia, 2, 5));

  const targetMinutes = clamp(
    base.minutes + profile.minutes + level.minutes,
    20,
    MAX_SESSION_MINUTES,
  );
  const cycleLength = hypoxiaMinutes + normoxiaMinutes;
  let cycles = clamp(Math.round(targetMinutes / cycleLength), 2, 8);
  // Le plafond de durée prime sur l'arrondi : on retire un cycle plutôt que de
  // le dépasser. Deux cycles restent toujours possibles, le plus long faisant
  // 12 min.
  if (cycles * cycleLength > MAX_SESSION_MINUTES) cycles -= 1;

  // La durée totale découle des cycles plutôt que l'inverse : la fiche affiche
  // ainsi trois nombres cohérents entre eux.
  const totalMinutes = cycles * cycleLength;

  const sessionsPerWeek = Math.round(
    clamp(base.sessions + profile.sessions + level.sessions, 2, 6),
  );
  const weeks = Math.round(clamp(base.weeks + level.weeks, 3, 12));

  // Le débutant démarre 500 m sous son palier de croisière ; les autres 300 m.
  const rampDrop = levelId === "debutant" ? 500 : 300;
  const rampAltitude = Math.round(clamp(altitude - rampDrop, 1500, 6000) / 100) * 100;

  // La rééducation impose le repos, quel que soit l'objectif choisi.
  const modality =
    profileId === "reeducation"
      ? "Sous masque, au repos complet, sans charge sur la zone lésée"
      : base.modality;

  return {
    altitude,
    fio2: fio2AtAltitude(altitude),
    rampAltitude,
    rampFio2: fio2AtAltitude(rampAltitude),
    hypoxiaMinutes,
    normoxiaMinutes,
    cycles,
    totalMinutes,
    sessionsPerWeek,
    weeks,
    spo2: spo2Band(altitude),
    modality,
    family: base.family,
    complement: base.complement,
  };
}

/* ── Comparatif économique ──────────────────────────────────────────── */

/** Ré-export : le prix fait autorité dans le module commercial. */
export const ATMOS_PRICE = PURCHASE_PRICE_EUR;

/**
 * Référence de comparaison : un stage classique de trois semaines en centre
 * d'altitude. Valeurs de marché constatées, hors coût d'opportunité des congés.
 */
export const CAMP = {
  nights: 21,
  nightlyRate: 145,
  travel: 380,
};

/** Consommation du générateur (kW) et prix moyen du kWh en France (€). */
const GENERATOR_KW = 0.55;
const KWH_PRICE = 0.25;

export type Savings = {
  campTotal: number;
  campLodging: number;
  sessions: number;
  energyKwh: number;
  energyCost: number;
  /** Écart sur le premier cycle, achat de l'appareil compris. */
  firstCycle: number;
  /** Écart sur chaque cycle suivant, l'appareil étant déjà payé. */
  nextCycle: number;
};

export function estimateSavings(protocol: Protocol): Savings {
  const campLodging = CAMP.nights * CAMP.nightlyRate;
  const campTotal = campLodging + CAMP.travel;

  const sessions = protocol.sessionsPerWeek * protocol.weeks;
  const hours = (protocol.totalMinutes * sessions) / 60;
  const energyKwh = Math.round(GENERATOR_KW * hours * 10) / 10;
  // Au dixième d'euro : arrondi à l'unité, un cycle entier afficherait « 0 € »
  // et passerait pour un bug plutôt que pour l'argument qu'il est.
  const energyCost = Math.round(energyKwh * KWH_PRICE * 10) / 10;

  return {
    campTotal,
    campLodging,
    sessions,
    energyKwh,
    energyCost,
    firstCycle: Math.round(campTotal - ATMOS_PRICE - energyCost),
    nextCycle: Math.round(campTotal - energyCost),
  };
}

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
