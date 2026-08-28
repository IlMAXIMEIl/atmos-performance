/**
 * Plan du site, en un seul endroit.
 *
 * Le volet de navigation en tête de page et le pied de page lisent tous deux
 * cette table : une page ajoutée ici apparaît des deux côtés, et les deux ne
 * peuvent pas raconter un plan différent.
 *
 * Les ancres sont préfixées de `/`. En `#produit` seul, elles ne mènent nulle
 * part depuis une page secondaire — or c'est précisément là que le volet sert
 * le plus.
 */
export type NavLink = {
  label: string;
  href: string;
  /** Une ligne de contexte, affichée dans le volet et nulle part ailleurs. */
  detail?: string;
  /**
   * Libellé abrégé pour la barre légale, où la place est comptée.
   * « Conditions générales de vente » y tiendrait toute la largeur.
   */
  short?: string;
};

export type NavGroup = {
  title: string;
  links: NavLink[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Le produit",
    links: [
      {
        label: "Le générateur",
        href: "/#produit",
        detail: "ATMOS ONE, pièce par pièce",
      },
      {
        label: "Les protocoles",
        href: "/#protocoles",
        detail: "Sommeil, entraînement, exposition",
      },
      {
        label: "Les accessoires",
        href: "/accessoires",
        detail: "Masque, filtre, tente, oxymètre",
      },
      {
        label: "Offres et précommande",
        href: "/#offres",
        detail: "Édition de lancement",
      },
      {
        label: "La gamme",
        href: "/#gamme",
        detail: "Ce qui vient après l'ATMOS ONE",
      },
    ],
  },
  {
    title: "Comprendre",
    links: [
      {
        label: "Le simulateur d'altitude",
        href: "/outils/simulateur-altitude",
        detail: "Votre protocole en deux questions",
      },
      {
        label: "La science",
        href: "/la-science",
        detail: "Ce que dit la littérature",
      },
      { label: "Le blog", href: "/blog", detail: "Articles de fond" },
      {
        label: "Le glossaire",
        href: "/glossaire",
        detail: "Les termes de l'hypoxie",
      },
      { label: "Tous les outils", href: "/outils" },
    ],
  },
  {
    title: "La maison",
    links: [
      {
        label: "Mon espace",
        href: "/compte",
        detail: "Vos nuits, votre dose, vos commandes",
      },
      { label: "À propos", href: "/a-propos", detail: "Qui construit ATMOS" },
      { label: "Questions fréquentes", href: "/#faq" },
      { label: "Conditions générales de vente", href: "/cgv", short: "CGV" },
      { label: "Mentions légales", href: "/mentions-legales" },
    ],
  },
];

/**
 * Les trois entrées tenues en clair dans la barre, sur grand écran.
 *
 * Le parcours d'achat se joue là : ce qu'est l'appareil, ce qu'on en fait, et
 * l'outil qui le prouve. Tout le reste vit dans le volet — accessible en un
 * geste, sans encombrer la barre.
 */
export const PRIMARY_LINKS: NavLink[] = [
  { label: "Produit", href: "/#produit" },
  { label: "Protocoles", href: "/#protocoles" },
  { label: "Simulateur", href: "/outils/simulateur-altitude" },
];

/**
 * Les liens que la barre légale du pied de page porte déjà.
 *
 * Ils restent dans le plan — le volet en tête de page les range sous « La
 * maison », c'est là qu'on les cherche. Mais les répéter dans les colonnes du
 * pied de page reviendrait à les afficher deux fois à trente pixels d'écart :
 * le pied de page les retire de ses colonnes et les lit d'ici pour sa barre.
 */
export const LEGAL_HREFS = ["/cgv", "/mentions-legales"];

/** Le plan, moins ce que la barre légale affiche déjà. */
export const FOOTER_GROUPS: NavGroup[] = NAV_GROUPS.map((group) => ({
  ...group,
  links: group.links.filter((link) => !LEGAL_HREFS.includes(link.href)),
}));

/** Les entrées légales, dans l'ordre où le plan les déclare. */
export const LEGAL_LINKS: NavLink[] = NAV_GROUPS.flatMap((group) =>
  group.links.filter((link) => LEGAL_HREFS.includes(link.href)),
);
