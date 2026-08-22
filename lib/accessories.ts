/**
 * Les accessoires de l'écosystème ATMOS.
 *
 * Le générateur fabrique l'air ; ces quatre pièces décident de ce qu'il en
 * advient. Elles sont décrites ici plutôt que dans la page pour que le
 * balisage `ItemList` et l'affichage sortent de la même source.
 *
 * **Aucun prix, aucune disponibilité.** Rien n'est arrêté à ce jour, et
 * annoncer un tarif qui bougera vaut moins que ne rien annoncer. La page dit
 * ce que chaque pièce fait, pas ce qu'elle coûtera.
 */

export const ACCESSORIES_PATH = "/accessoires";

export type Accessory = {
  slug: string;
  name: string;
  /** Ce à quoi la pièce sert, en une ligne. */
  tagline: string;
  description: string;
  /** Ce qui distingue la pièce, en trois points au plus. */
  points: string[];
  /**
   * Texte de remplacement de la photographie à venir. Rédigé maintenant :
   * l'écrire au moment de poser l'image, c'est l'écrire à la va-vite.
   */
  imageAlt: string;
};

export const ACCESSORIES: Accessory[] = [
  {
    slug: "masque",
    name: "Le masque",
    tagline: "L'interface entre vous et l'air fabriqué",
    description:
      "Le masque achemine l'air hypoxique du générateur jusqu'à vos voies respiratoires, sans fuite ni recyclage du gaz expiré. C'est la pièce qui décide de la précision réelle du protocole : une fuite de bord, et la fraction d'oxygène inspirée remonte sans que rien ne l'indique.",
    points: [
      "Séances sous masque : entraînement (IHT) et exposition au repos (IHE)",
      "Valves séparant l'air inspiré de l'air expiré",
      "Ballon réservoir : il encaisse les pics inspiratoires de l'effort, que le débit continu du générateur ne peut pas suivre",
      "Plusieurs tailles de jupe, l'étanchéité dépendant du visage",
    ],
    imageAlt:
      "Masque d'hypoxie ATMOS, vu de trois quarts : jupe souple, valves d'inspiration et d'expiration, raccord du tuyau.",
  },
  {
    slug: "filtre",
    name: "Le filtre",
    tagline: "Ce qui reste propre au fil des séances",
    description:
      "Un générateur d'hypoxie aspire l'air de la pièce en continu. Le filtre retient les poussières avant l'étage de séparation, protège le compresseur et maintient le débit annoncé. C'est une pièce d'usure : elle se remplace, elle ne s'entretient pas indéfiniment.",
    points: [
      "Protège l'étage de séparation azote / oxygène",
      "Maintient le débit de 100 L/min dans la durée",
      "Remplacement périodique, selon l'usage et l'empoussièrement",
    ],
    imageAlt:
      "Filtre de rechange du générateur ATMOS ONE, posé à plat, cartouche visible.",
  },
  {
    slug: "tente",
    name: "La tente",
    tagline: "Le protocole de sommeil, sans masque",
    description:
      "La tente se pose sur le lit et se remplit d'air hypoxique produit par le générateur. C'est ce qui rend le protocole de sommeil praticable : douze à quatorze heures d'exposition sans rien porter sur le visage, à l'altitude choisie.",
    points: [
      "Dédiée au protocole de sommeil (LHTL), entre 2 100 et 2 600 m",
      "Se monte sur un lit existant, sans travaux",
      "Le générateur peut rester hors de la chambre, relié au circuit",
    ],
    imageAlt:
      "Tente d'altitude ATMOS montée sur un lit double, fermeture latérale ouverte, gaine reliée au générateur.",
  },
  {
    slug: "oxymetre",
    name: "L'oxymètre de pouls",
    tagline: "L'arbitre de la séance",
    description:
      "Aucun protocole ne se règle une fois pour toutes : entre deux personnes soumises au même palier, la réponse varie fortement. L'oxymètre lit la saturation en oxygène du sang et la fréquence cardiaque, et c'est cette lecture — pas le réglage affiché — qui dit s'il faut monter, tenir ou redescendre.",
    points: [
      "Saturation (SpO₂) et fréquence cardiaque en continu",
      "La donnée qui pilote la progression, séance après séance",
      "Recommandé dès la première séance, quel que soit le protocole",
    ],
    imageAlt:
      "Oxymètre de pouls au doigt, écran affichant la saturation en oxygène et la fréquence cardiaque.",
  },
];
