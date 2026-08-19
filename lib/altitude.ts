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

/* ── Le moteur de recommandation ────────────────────────────────────── */

/**
 * Contrat de sortie du moteur.
 *
 * Toutes les valeurs sont calculées, jamais tirées : à choix identiques, sortie
 * identique au bit près, sur le serveur comme dans le navigateur.
 */
export interface AltitudeRecommendation {
  protocolType: "LHTL" | "IHT" | "IHE" | "MIXED_LHTL_IHT" | "IHT_REHAB";
  protocolTitle: string;
  targetAltitudeMeters: number;
  fio2EquivalentPercent: number;
  targetSpo2Range: string;
  weeklyDose: {
    frequency: string;
    durationPerSession: string;
    totalWeeksRecommended: number;
  };
  acclimatizationProtocol: string[];
  physiologicalRationale: string;
  clinicalSafetyNotes: string;
  disclaimerLegal: string;
}

/**
 * Ce que le moteur renvoie réellement : le contrat ci-dessus, plus les nombres
 * bruts dont la fiche et le comparatif économique ont besoin. Les chaînes du
 * contrat en dérivent — elles ne peuvent donc pas s'en désaccorder.
 */
export interface Recommendation extends AltitudeRecommendation {
  /** Rang de la branche qui a tranché : 1 = blessure … 4 = défaut. */
  branch: 1 | 2 | 3 | 4;
  /** Ce qu'on fait pendant la phase hypoxique. */
  exposure: "effort" | "repos";
  /**
   * Palier des séances sous masque.
   *
   * Distinct de `targetAltitudeMeters` pour le seul protocole LHTL, dont le
   * chiffre de tête est l'altitude de sommeil : c'est elle qui définit le
   * protocole, et l'afficher en grand évite de présenter un palier d'effort
   * comme une consigne d'acclimatation.
   */
  sessionAltitudeMeters: number;
  sessionFio2Percent: number;
  /** Palier de sommeil sous tente. 0 = nuits en plaine, verrouillé. */
  sleepAltitudeMeters: number;
  sleepFio2Percent: number | null;
  /** Heures sous tente par nuit ; 0 hors protocole LHTL. */
  sleepHoursPerDay: number;
  /** Palier d'entrée de la première semaine. */
  rampAltitudeMeters: number;
  rampFio2Percent: number;
  hypoxiaMinutes: number;
  normoxiaMinutes: number;
  cycles: number;
  sessionMinutes: number;
  sessionsPerWeek: number;
  /** Modalité d'exécution, en une ligne. */
  modality: string;
}

/**
 * Plage du palier de sommeil, en mètres.
 *
 * Les plages d'exposition sont désormais portées par chaque branche : elles
 * diffèrent d'un protocole à l'autre même à modalité égale — une séance IHT de
 * rééducation plafonne à 3 000 m là où une séance IHT de performance monte à
 * 3 400 m. Voir le champ `band` de chaque branche.
 */
const BAND = {
  sommeil: [2100, 2600],
} as const;

/**
 * Plafond de verre du sommeil : 2 600 m, figé, sans exception de niveau.
 *
 * La littérature LHTL (Levine & Stray-Gundersen) situe l'optimum de la réponse
 * érythropoïétique entre 2 200 et 2 500 m. Au-dessus, la SpO₂ nocturne chute
 * trop bas, le sommeil se fragmente en micro-éveils et le gain hématologique
 * est mangé par la dette de récupération. Aucun bonus de niveau ne franchit
 * cette borne.
 */
const SLEEP_ALTITUDE_CAP = 2600;

/**
 * Mention légale attachée à toute sortie du moteur.
 *
 * Constante et non champ de branche : la portée est la même pour les 48
 * combinaisons, et une formulation unique évite qu'une branche s'en écarte au
 * fil des modifications.
 */
const DISCLAIMER_LEGAL =
  "Recommandations à titre indicatif basées sur les consensus en physiologie de l'effort. L'exposition à l'hypoxie doit être progressive et adaptée aux réponses individuelles.";

/** Durée de séance au-delà de laquelle nous ne recommandons plus rien. */
const MAX_SESSION_MINUTES = 60;

type Branch = {
  rank: 1 | 2 | 3 | 4;
  protocolType: AltitudeRecommendation["protocolType"];
  /** Le déclencheur. La première branche qui répond « oui » l'emporte. */
  matches: (profile: ProfileId, goal: GoalId) => boolean;
  protocolTitle: string;
  /** Palier d'exposition au niveau « intermédiaire », en mètres. */
  altitude: number;
  /** Bornes du palier d'exposition, décalage de niveau appliqué. */
  band: readonly [number, number];
  /**
   * Lequel des deux paliers porte le chiffre de tête de la fiche.
   *
   * `sommeil` pour le LHTL : afficher en grand le palier des séances ferait
   * passer une consigne d'effort pour une consigne d'acclimatation.
   */
  display: "exposition" | "sommeil";
  /** Palier de sommeil au niveau « intermédiaire ». 0 = nuits en plaine. */
  sleepAltitude: number;
  sleepHoursPerDay: number;
  exposure: "effort" | "repos";
  targetSpo2Range: string;
  modality: string;
  hypoxiaMinutes: number;
  normoxiaMinutes: number;
  cycles: number;
  sessionsPerWeek: number;
  weeks: number;
  physiologicalRationale: string;
  clinicalSafetyNotes: string;
};

/**
 * La hiérarchie des cas, en priorité stricte.
 *
 * Les 48 combinaisons de l'interface (4 profils × 4 objectifs × 3 niveaux)
 * traversent cette liste de haut en bas et s'arrêtent à la première branche qui
 * les reconnaît. La dernière accepte tout : aucune combinaison ne peut sortir
 * sans protocole.
 *
 * L'ordre n'est pas cosmétique. La blessure prime sur l'ambition de
 * performance : un coureur d'endurance qui coche « récupération post-blessure »
 * reçoit le protocole de décharge mécanique, jamais le bloc LHTL.
 */
const BRANCHES: readonly Branch[] = [
  {
    rank: 1,
    protocolType: "IHT_REHAB",
    matches: (profile, goal) =>
      profile === "reeducation" || goal === "recuperation",
    protocolTitle: "IHT de décharge mécanique",
    altitude: 2800,
    band: [2400, 3000],
    display: "exposition",
    sleepAltitude: 0,
    sleepHoursPerDay: 0,
    exposure: "effort",
    targetSpo2Range: "84 – 88 %",
    modality:
      "Marche, vélo doux ou rameur en aisance respiratoire, sans charge sur la zone lésée",
    hypoxiaMinutes: 5,
    normoxiaMinutes: 3,
    cycles: 5,
    sessionsPerWeek: 4,
    weeks: 8,
    physiologicalRationale:
      "Le principe est de dissocier charge métabolique et charge mécanique. En hypoxie normobarique à 2 800 m, la désaturation artérielle (SpO₂ 84 – 88 %) impose au système cardio-respiratoire une contrainte équivalente à un effort de haute intensité, alors que la vitesse de déplacement — et donc l'impact articulaire — reste celle d'une marche. La fréquence cardiaque cible est atteinte à puissance mécanique quasi nulle : les adaptations centrales (volume d'éjection systolique, densité capillaire, extraction périphérique d'O₂) sont maintenues pendant que le tissu lésé est déchargé. La stabilisation de HIF-1α sous hypoxie régule par ailleurs à la hausse l'expression du VEGF, facteur d'angiogenèse impliqué dans la perfusion des tissus en réparation.",
    clinicalSafetyNotes:
      "Protocole à valider avec le praticien qui suit la blessure : c'est lui qui fixe la charge mécanique autorisée. L'hypoxie remplace l'intensité manquante, elle ne raccourcit pas une consolidation osseuse ni une cicatrisation tendineuse. Interrompre la séance si la SpO₂ descend sous 80 %, ou en cas de céphalée, de nausée ou de vertige. Sommeil en plaine impératif : aucune exposition nocturne pendant la phase de réparation tissulaire, la qualité du sommeil profond conditionne la récupération.",
  },
  {
    rank: 2,
    protocolType: "MIXED_LHTL_IHT",
    matches: (profile, goal) =>
      profile === "endurance" || goal === "vo2max" || goal === "affutage",
    protocolTitle: "Live High – Train Low + rappels IHT",
    altitude: 3000,
    band: [2600, 3400],
    display: "sommeil",
    sleepAltitude: 2500,
    sleepHoursPerDay: 12,
    exposure: "effort",
    targetSpo2Range: "88 – 92 % en moyenne nocturne · 84 – 88 % en séance IHT",
    modality:
      "Nuits sous tente, puis rappels d'intensité sous masque sur home-trainer ou tapis",
    hypoxiaMinutes: 5,
    normoxiaMinutes: 3,
    cycles: 5,
    sessionsPerWeek: 3,
    weeks: 4,
    physiologicalRationale:
      "Le protocole de référence de la littérature en endurance, et le seul qui découple les deux signaux. La nuit, l'hypoxie normobarique à 2 400 m (SpO₂ 90 – 93 %) maintient la stabilisation de HIF-1α assez longtemps pour déclencher la transcription rénale d'EPO et l'expansion progressive du volume de globules rouges — d'où l'exigence de 12 à 14 h d'exposition quotidienne, en deçà de laquelle le stimulus est trop bref. Le jour, l'entraînement s'effectue en normoxie, à pleine intensité : la vitesse et la puissance développées restent celles de la plaine, ce qui évite la désadaptation neuromusculaire classique des stages en altitude réelle. Les rappels IHT à 3 000 m ajoutent un stimulus périphérique — expression du VEGF, angiogenèse musculaire, efficacité mitochondriale — sans coût en fatigue centrale, l'intensité mécanique y étant volontairement sous-maximale.",
    clinicalSafetyNotes:
      "Repère de suivi nocturne : la SpO₂ moyenne de la nuit doit se stabiliser entre 88 et 92 %. C'est la fenêtre où le stimulus érythropoïétique est obtenu sans basculer dans l'hypoxie délétère. Sous 85 % de moyenne, réduire immédiatement le palier de sommeil — un oxymètre à enregistrement continu, relu au réveil, suffit à trancher. Le reste de la semaine s'entraîne en plaine à pleine intensité : c'est tout le principe du Train Low, l'altitude sert à dormir et non à brider les séances qualitatives. Surveiller la ferritine avant d'engager le bloc — une érythropoïèse stimulée sans réserve en fer ne produit aucun gain. Descendre le palier nocturne si le sommeil se fragmente ou si la fréquence cardiaque de repos matinale monte de plus de 5 bpm sur trois jours consécutifs. Pour un objectif d'affûtage, arrêter le bloc 5 à 7 jours avant l'échéance.",
  },
  {
    rank: 3,
    protocolType: "IHE",
    matches: (profile, goal) => profile === "biohacking" || goal === "stress",
    protocolTitle: "Exposition intermittente passive",
    altitude: 4400,
    band: [4000, 4500],
    display: "exposition",
    sleepAltitude: 0,
    sleepHoursPerDay: 0,
    exposure: "repos",
    targetSpo2Range: "78 – 82 %",
    modality: "Au repos complet, assis ou allongé, respiration nasale calme",
    hypoxiaMinutes: 5,
    normoxiaMinutes: 5,
    cycles: 5,
    sessionsPerWeek: 5,
    weeks: 6,
    physiologicalRationale:
      "L'IHE ne cherche pas une adaptation à l'effort mais une réponse hormétique. L'alternance de cycles courts — 5 min d'hypoxie normobarique à 4 200 m, 5 min de réoxygénation en air ambiant — produit une désaturation marquée (SpO₂ 78 – 82 %) suivie d'une remontée rapide. C'est ce gradient répété, et non la profondeur seule, qui stabilise HIF-1α et déclenche la cascade en aval : biogenèse mitochondriale via PGC-1α, expression du VEGF, régulation à la hausse des enzymes antioxydantes. Le corps étant au repos, la demande métabolique reste minimale : la totalité du stimulus est portée par le contenu artériel en O₂. La stimulation itérative des chémorécepteurs carotidiens agit par ailleurs sur la balance sympatho-vagale, ce qui explique le regain de variabilité de fréquence cardiaque et l'amélioration du sommeil profond rapportés après quelques semaines.",
    clinicalSafetyNotes:
      "C'est le palier le plus exigeant du simulateur : la cible de 78 – 82 % ne s'atteint qu'au repos strict, jamais en marchant ni en parlant. Oxymètre au doigt en continu, arrêt immédiat de la phase hypoxique sous 75 % ou en cas de céphalée, d'acouphène ou de confusion. Progression obligatoire par le protocole d'acclimatation ci-dessus, sans le raccourcir. Contre-indiqué en cas de pathologie cardio-respiratoire non stabilisée, de grossesse ou d'hypertension pulmonaire : avis médical préalable.",
  },
  {
    rank: 4,
    protocolType: "IHT",
    matches: () => true,
    protocolTitle: "Conditionnement aérobie modéré",
    altitude: 2200,
    band: [1800, 2600],
    display: "exposition",
    sleepAltitude: 0,
    sleepHoursPerDay: 0,
    exposure: "effort",
    targetSpo2Range: "91 – 94 %",
    modality: "Marche sur tapis ou vélo à allure de conversation",
    hypoxiaMinutes: 5,
    normoxiaMinutes: 4,
    cycles: 4,
    sessionsPerWeek: 3,
    weeks: 6,
    physiologicalRationale:
      "Une exposition modérée conduite à l'effort. À 2 200 m en hypoxie normobarique, la SpO₂ se stabilise autour de 91 – 94 % : assez pour élever la contrainte métabolique d'un cran — coût en O₂ d'une allure donnée, sollicitation ventilatoire, recrutement du métabolisme glucidique — sans quitter la zone d'aisance respiratoire. L'intérêt tient au rendement : l'hypoxie légère augmente la translocation de GLUT-4 et la captation musculaire du glucose, ce qui améliore la sensibilité à l'insuline et le métabolisme de base pour un temps de séance et une charge articulaire deux fois moindres qu'un travail équivalent en plaine. La stabilisation modérée de HIF-1α suffit à entretenir la densité capillaire sans imposer la charge de récupération d'un bloc de performance.",
    clinicalSafetyNotes:
      "Aucune charge d'entraînement n'est requise : l'allure reste celle où l'on peut tenir une conversation, c'est l'air qui fait le travail. Oxymètre au doigt pendant toute la phase hypoxique, arrêt sous 85 %. En cas de traitement cardiovasculaire, de diabète traité ou de pathologie respiratoire, demander un avis médical avant le premier cycle.",
  },
];

/**
 * Décalage d'altitude par niveau, appliqué en toute fin de calcul.
 *
 * Le débutant descend de 400 m sur toutes les cibles, sommeil compris. Le
 * confirmé monte de 400 m sur l'exposition — séance IHT ou séance passive
 * IHE — mais **jamais sur le sommeil** : y ajouter de l'altitude dégraderait
 * les nuits sans renforcer le signal hématologique, déjà saturé à ce palier.
 */
const LEVEL_ALTITUDE_SHIFT: Record<
  LevelId,
  { exposure: number; sleep: number }
> = {
  debutant: { exposure: -400, sleep: -400 },
  intermediaire: { exposure: 0, sleep: 0 },
  confirme: { exposure: 400, sleep: 0 },
};

/** Arrondi à la centaine : la station se règle ainsi, et un chiffre rond se retient. */
function roundToHundred(metres: number) {
  return Math.round(metres / 100) * 100;
}

/**
 * Compose la recommandation à partir des trois réponses.
 *
 * L'enchaînement est toujours le même : la hiérarchie choisit la branche, la
 * branche impose sa plage d'altitude, le niveau déplace le curseur à
 * l'intérieur de cette plage, les clamps de sécurité ferment la marche. Jamais
 * l'inverse — c'est ce qui garantit qu'aucune des 48 combinaisons ne produit un
 * palier hors de son protocole.
 */
export function buildProtocol(
  profileId: ProfileId,
  goalId: GoalId,
  levelId: LevelId,
): Recommendation {
  // La dernière branche accepte tout ; le repli ne sert qu'à satisfaire le type.
  const branch =
    BRANCHES.find((b) => b.matches(profileId, goalId)) ??
    BRANCHES[BRANCHES.length - 1];
  const shift = LEVEL_ALTITUDE_SHIFT[levelId];

  const band = branch.band;
  const sessionAltitudeMeters = roundToHundred(
    clamp(branch.altitude + shift.exposure, band[0], band[1]),
  );

  // Blessure détectée : sommeil verrouillé en plaine, le décalage de niveau ne
  // s'y applique pas. La branche porte déjà 0, ce test rend la règle explicite
  // et la protège d'une future modification de la table.
  const sleepBase = branch.rank === 1 ? 0 : branch.sleepAltitude;
  const sleepAltitudeMeters =
    sleepBase === 0
      ? 0
      : roundToHundred(
          clamp(
            // `shift.sleep` ne porte que la baisse débutant : le bonus du
            // confirmé vaut 0 sur le sommeil, par construction de la table.
            sleepBase + shift.sleep,
            BAND.sommeil[0],
            // Double borne volontaire : la plage du protocole *et* le plafond
            // de verre. Si l'une bouge un jour, l'autre tient encore.
            BAND.sommeil[1] < SLEEP_ALTITUDE_CAP
              ? BAND.sommeil[1]
              : SLEEP_ALTITUDE_CAP,
          ),
        );

  // Le chiffre de tête : palier de sommeil pour le LHTL, palier d'exposition
  // partout ailleurs. Afficher en grand le palier des séances d'un bloc LHTL
  // ferait passer une consigne d'effort pour une consigne d'acclimatation.
  const sleeps = sleepAltitudeMeters > 0;
  const targetAltitudeMeters =
    branch.display === "sommeil" && sleeps
      ? sleepAltitudeMeters
      : sessionAltitudeMeters;

  // Montée en charge : le débutant part 600 m sous son palier de séance, les
  // autres 400 m, avec un palier intermédiaire à −200 m. Tout reste borné.
  const rampDrop = levelId === "debutant" ? 600 : 400;
  const rampAltitudeMeters = roundToHundred(
    clamp(sessionAltitudeMeters - rampDrop, band[0], band[1]),
  );
  const midAltitude = roundToHundred(
    clamp(sessionAltitudeMeters - 200, rampAltitudeMeters, band[1]),
  );

  const { hypoxiaMinutes, normoxiaMinutes } = branch;
  const cycleLength = hypoxiaMinutes + normoxiaMinutes;

  // Le plafond de durée prime sur la recette : on retire un cycle plutôt que de
  // le dépasser. Deux cycles restent toujours possibles, le plus long fait 12 min.
  let cycles = clamp(branch.cycles, 2, 8);
  if (cycles * cycleLength > MAX_SESSION_MINUTES) cycles -= 1;
  const sessionMinutes = cycles * cycleLength;

  const sleepFio2Percent = sleeps ? fio2AtAltitude(sleepAltitudeMeters) : null;

  const acclimatizationProtocol = [
    `Semaine 1 — palier d'entrée à ${formatNumber(rampAltitudeMeters)} m (${formatDecimal(fio2AtAltitude(rampAltitudeMeters))} % d'O₂), séances écourtées à ${cycles - 1} cycles, oxymètre en continu.`,
    `Semaine 2 — passage à ${formatNumber(midAltitude)} m (${formatDecimal(fio2AtAltitude(midAltitude))} % d'O₂) et retour au format complet de ${cycles} cycles dès que la SpO₂ se stabilise dans la plage cible.`,
    `Semaine 3 et suivantes — palier de croisière à ${formatNumber(sessionAltitudeMeters)} m (${formatDecimal(fio2AtAltitude(sessionAltitudeMeters))} % d'O₂), maintenu jusqu'au terme des ${branch.weeks} semaines.`,
    sleeps
      ? `Nuits sous tente — première nuit à ${formatNumber(sleepAltitudeMeters - 400 < BAND.sommeil[0] ? BAND.sommeil[0] : sleepAltitudeMeters - 400)} m, puis ${formatNumber(sleepAltitudeMeters)} m (${formatDecimal(sleepFio2Percent as number)} % d'O₂) dès la deuxième, ${branch.sleepHoursPerDay} à ${branch.sleepHoursPerDay + 2} h par nuit sans interruption. Ce palier ne monte jamais au-delà de ${formatNumber(SLEEP_ALTITUDE_CAP)} m, quel que soit le niveau.`
      : "Nuits en plaine sur toute la durée du bloc : aucune exposition nocturne dans ce protocole.",
    `Sortie de bloc — 2 à 3 semaines sans exposition avant d'en relancer un, le temps que les adaptations se consolident.`,
  ];

  const frequency = sleeps
    ? `${branch.sessionsPerWeek} séances IHT par semaine · ${branch.sleepHoursPerDay} à ${branch.sleepHoursPerDay + 2} h sous tente chaque nuit`
    : `${branch.sessionsPerWeek} séances par semaine`;

  return {
    protocolType: branch.protocolType,
    protocolTitle: branch.protocolTitle,
    targetAltitudeMeters,
    fio2EquivalentPercent: fio2AtAltitude(targetAltitudeMeters),
    sessionAltitudeMeters,
    sessionFio2Percent: fio2AtAltitude(sessionAltitudeMeters),
    targetSpo2Range: branch.targetSpo2Range,
    weeklyDose: {
      frequency,
      durationPerSession: `${formatDuration(sessionMinutes)} — ${cycles} cycles de ${hypoxiaMinutes} min d'hypoxie / ${normoxiaMinutes} min d'air libre`,
      totalWeeksRecommended: branch.weeks,
    },
    acclimatizationProtocol,
    physiologicalRationale: branch.physiologicalRationale,
    clinicalSafetyNotes: branch.clinicalSafetyNotes,
    disclaimerLegal: DISCLAIMER_LEGAL,

    branch: branch.rank,
    exposure: branch.exposure,
    sleepAltitudeMeters,
    sleepFio2Percent,
    sleepHoursPerDay: sleeps ? branch.sleepHoursPerDay : 0,
    rampAltitudeMeters,
    rampFio2Percent: fio2AtAltitude(rampAltitudeMeters),
    hypoxiaMinutes,
    normoxiaMinutes,
    cycles,
    sessionMinutes,
    sessionsPerWeek: branch.sessionsPerWeek,
    modality: branch.modality,
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
  /** Heures de fonctionnement du générateur sur l'ensemble du cycle. */
  hours: number;
  energyKwh: number;
  energyCost: number;
  /** Écart sur le premier cycle, achat de l'appareil compris. */
  firstCycle: number;
  /** Écart sur chaque cycle suivant, l'appareil étant déjà payé. */
  nextCycle: number;
};

export function estimateSavings(protocol: Recommendation): Savings {
  const campLodging = CAMP.nights * CAMP.nightlyRate;
  const campTotal = campLodging + CAMP.travel;

  const weeks = protocol.weeklyDose.totalWeeksRecommended;
  const sessions = protocol.sessionsPerWeek * weeks;

  // Les nuits sous tente comptent dans la facture : sur un bloc LHTL elles
  // pèsent bien plus lourd que les séances, et annoncer la seule électricité
  // des séances donnerait un chiffre flatteur mais faux.
  const sessionHours = (protocol.sessionMinutes * sessions) / 60;
  const sleepHours = protocol.sleepHoursPerDay * 7 * weeks;
  const hours = Math.round((sessionHours + sleepHours) * 10) / 10;

  const energyKwh = Math.round(GENERATOR_KW * hours * 10) / 10;
  // Au dixième d'euro : arrondi à l'unité, un cycle entier afficherait « 0 € »
  // et passerait pour un bug plutôt que pour l'argument qu'il est.
  const energyCost = Math.round(energyKwh * KWH_PRICE * 10) / 10;

  return {
    campTotal,
    campLodging,
    sessions,
    hours,
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
