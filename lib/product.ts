/**
 * La vérité produit de l'ATMOS ONE, en un seul endroit.
 *
 * Ces valeurs viennent de la fiche du constructeur, pas d'une maquette. Elles
 * alimentent à la fois la traversée annotée du générateur et le volet de
 * fiche technique : les deux ne peuvent donc pas diverger.
 */

/** Fiche technique complète, telle que fournie par le constructeur. */
export const DATASHEET = [
  { label: "Concentration hypoxique", value: "9 % – 20,9 % O₂" },
  { label: "Altitude simulée", value: "0 – 6 500 m (0 – 21 330 ft)" },
  { label: "Débit hypoxique", value: "100 L/min" },
  { label: "Niveau sonore", value: "≤ 50 dB" },
  { label: "Consommation", value: "≤ 550 W" },
  { label: "Poids net", value: "27 kg" },
  { label: "Dimensions", value: "365 × 375 × 600 mm" },
  { label: "Alarmes", value: "Coupure d'alimentation, pression haute / basse" },
  { label: "En option", value: "Oxymètre de pouls, système de monitoring" },
] as const;

/**
 * Les chapitres de la traversée du générateur.
 *
 * Le premier est le chapitre d'ouverture : il nomme l'appareil. Les quatre
 * suivants prennent chacun une pièce du dessin, dans l'ordre où le regard la
 * rencontre en descendant le châssis.
 *
 * Une phrase par chapitre, pas davantage. La scène est épinglée : elle impose
 * son rythme, et trois lignes à lire par palier obligent le visiteur soit à
 * s'arrêter de défiler, soit à renoncer à lire.
 */
export const PRODUCT_CHAPTERS = [
  {
    eyebrow: "Le générateur",
    title: "ATMOS ONE",
    body: "Il sépare l'azote de l'oxygène pour fabriquer l'air que vous respirez. Conçu pour un usage quotidien à domicile, pas pour un laboratoire.",
  },
  {
    eyebrow: "01 — Interface",
    title: "Un écran, ce qu'il faut dessus.",
    body: "Concentration cible, état de l'appareil, alarmes. La machine signale elle-même une coupure ou une pression anormale.",
  },
  {
    eyebrow: "02 — Réglage",
    title: "De 20,9 % à 9 % d'oxygène.",
    body: "Une molette, n'importe quel palier entre le niveau de la mer et 6 500 mètres. Le même appareil couvre les trois protocoles.",
  },
  {
    eyebrow: "03 — Débit",
    title: "Cent litres par minute, stables.",
    body: "De quoi alimenter un masque en séance comme une tente sur une nuit entière, sans dériver en cours de route.",
  },
  {
    eyebrow: "04 — Format",
    title: "27 kg sur roulettes, sous 50 dB.",
    body: "365 × 375 × 600 mm, 550 watts : le volume d'un gros appareil ménager. Il passe du salon à la chambre sans démontage.",
  },
] as const;

/**
 * Les annotations posées sur le dessin, et le chapitre à partir duquel
 * chacune s'allume.
 *
 * Elles s'accumulent : arrivé au dernier chapitre, le dessin est entièrement
 * légendé. Chaque libellé décrit une pièce réellement présente sur l'appareil
 * et reprend un chiffre de `DATASHEET` — aucune n'est décorative.
 */
export const PRODUCT_ANNOTATIONS = [
  {
    id: "screen",
    label: "Écran de contrôle",
    from: 1,
    side: "left",
    position: "top-[8%] left-0",
  },
  {
    id: "flow",
    label: "Débitmètre 100 L/min",
    from: 3,
    side: "right",
    position: "top-[32%] right-0",
  },
  {
    id: "sieve",
    label: "Colonne de séparation N₂ / O₂",
    from: 2,
    side: "left",
    position: "top-[46%] left-0",
  },
  {
    id: "dial",
    label: "Réglage O₂ · 9 – 20,9 %",
    from: 2,
    side: "right",
    position: "top-[55%] right-0",
  },
  {
    id: "caster",
    label: "Roulettes intégrées · 27 kg",
    from: 4,
    side: "left",
    position: "bottom-[6%] left-0",
  },
] as const;
