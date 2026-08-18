/**
 * Contenu du blog.
 *
 * Les articles sont de simples objets : pour en ajouter un, il suffit
 * d'étendre `POSTS`. Le corps est découpé en blocs typés plutôt qu'en HTML
 * brut, ce qui évite d'injecter du balisage et garde la mise en forme
 * cohérente d'un article à l'autre.
 */

export type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

export type Post = {
  slug: string;
  title: string;
  /** Sert de meta description et de résumé en liste. */
  description: string;
  /** Format ISO `YYYY-MM-DD`. */
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  tags: string[];
  body: Block[];
};

export const POSTS: Post[] = [
  {
    slug: "recuperation-athletique-role-oxygene",
    title: "Récupération athlétique : le rôle réel de l'oxygène",
    description:
      "Pourquoi l'oxygène conditionne la vitesse de récupération après l'effort, ce que le corps fait pendant les heures qui suivent une séance, et où l'altitude simulée intervient.",
    publishedAt: "2026-06-12",
    readingMinutes: 6,
    tags: ["Récupération", "Physiologie"],
    body: [
      {
        type: "paragraph",
        text: "La récupération est la partie de l'entraînement que l'on regarde le moins et qui décide pourtant du reste. Une séance ne rend pas plus fort au moment où on la fait : elle crée une contrainte, et c'est la réponse à cette contrainte, dans les heures et les jours qui suivent, qui produit l'adaptation. L'oxygène est au centre de cette réponse.",
      },
      { type: "heading", text: "Ce qui se joue après l'effort" },
      {
        type: "paragraph",
        text: "Dès l'arrêt d'un effort intense, la consommation d'oxygène ne redescend pas immédiatement à son niveau de repos. Le corps continue de consommer davantage pendant un temps variable, parfois plusieurs heures. Cette consommation excédentaire alimente des tâches précises : reconstituer les réserves de phosphocréatine, éliminer les sous-produits métaboliques, rétablir les équilibres ioniques, ramener la température et la fréquence cardiaque à leur point de départ.",
      },
      {
        type: "paragraph",
        text: "Autrement dit, la récupération n'est pas une absence d'activité. C'est un travail biologique coûteux, et l'oxygène en est le carburant principal. Un athlète dont l'oxygénation tissulaire se rétablit vite enchaîne mieux les séances qu'un athlète qui traîne cette dette plus longtemps.",
      },
      { type: "heading", text: "Les leviers qui comptent, dans l'ordre" },
      {
        type: "paragraph",
        text: "Avant de chercher une technologie, il faut avoir couvert les fondamentaux. Aucun dispositif ne compense leur absence.",
      },
      {
        type: "list",
        items: [
          "Le sommeil, de loin le levier le plus puissant et le moins cher.",
          "L'apport énergétique et protéique suffisant dans les heures qui suivent la séance.",
          "L'hydratation et le statut en fer, qui conditionnent le transport de l'oxygène.",
          "La charge d'entraînement elle-même : une charge mal répartie ne se rattrape par aucun protocole.",
        ],
      },
      {
        type: "paragraph",
        text: "Ces quatre points réglés, il reste une marge de progression sur la capacité du corps à transporter et utiliser l'oxygène. C'est précisément le terrain sur lequel travaille l'exposition à l'altitude.",
      },
      { type: "heading", text: "Où intervient l'altitude simulée" },
      {
        type: "paragraph",
        text: "L'exposition à un air appauvri en oxygène ne rend pas la récupération immédiate plus facile : elle fait l'inverse à court terme, en ajoutant une contrainte. Son intérêt est ailleurs, dans l'adaptation qu'elle provoque sur la durée. Confronté à une disponibilité réduite en oxygène, l'organisme ajuste sa ventilation, son réseau capillaire et sa capacité de transport.",
      },
      {
        type: "paragraph",
        text: "L'effet recherché est donc structurel : améliorer le système qui, séance après séance, assure la récupération. C'est la raison pour laquelle les protocoles d'altitude se planifient sur des semaines, et non comme un remède ponctuel après une compétition.",
      },
      { type: "heading", text: "Ce qu'il faut retenir" },
      {
        type: "paragraph",
        text: "L'oxygène ne se contente pas d'alimenter l'effort, il alimente aussi la réparation qui suit. Travailler sa capacité à le transporter, c'est agir sur la récupération de toutes les séances à venir plutôt que sur une seule. À condition d'avoir d'abord sécurisé le sommeil, l'alimentation et le statut en fer, sans lesquels l'adaptation ne se met pas en place.",
      },
    ],
  },
  {
    slug: "live-high-train-low-protocole-altitude",
    title: "Live High, Train Low : comprendre le protocole d'altitude",
    description:
      "Dormir en altitude et s'entraîner au niveau de la mer : d'où vient ce protocole, pourquoi il est le plus documenté, et comment il se transpose à domicile avec un générateur d'altitude.",
    publishedAt: "2026-07-03",
    readingMinutes: 7,
    tags: ["Protocoles", "Altitude"],
    body: [
      {
        type: "paragraph",
        text: "Parmi les méthodes d'entraînement en altitude, une approche s'est imposée depuis les années 1990 : vivre haut, s'entraîner bas. Le principe tient en une phrase, mais il résout un problème que les stages en altitude classiques n'avaient jamais réglé.",
      },
      { type: "heading", text: "Le problème des stages en altitude" },
      {
        type: "paragraph",
        text: "Un séjour prolongé en altitude déclenche des adaptations recherchées. Mais il a une contrepartie : en altitude, on ne peut plus s'entraîner aussi fort. La puissance disponible baisse, les vitesses de séance chutent, et l'athlète perd d'un côté ce qu'il gagne de l'autre. Un bloc entier passé en montagne peut ainsi émousser la qualité d'entraînement au moment précis où on cherchait à l'augmenter.",
      },
      {
        type: "paragraph",
        text: "D'où l'idée de dissocier les deux : conserver l'exposition longue à l'altitude, qui produit l'adaptation, et rendre à l'entraînement l'oxygène dont il a besoin pour rester intense.",
      },
      { type: "heading", text: "Comment le protocole se structure" },
      {
        type: "paragraph",
        text: "L'exposition passe principalement par le sommeil, parce que c'est la seule plage de la journée où l'on peut accumuler huit à dix heures sans empiéter sur autre chose. Les séances, elles, se font en air ambiant, à pleine intensité.",
      },
      {
        type: "list",
        items: [
          "Un palier d'exposition modéré, généralement entre 2 000 et 3 500 mètres simulés.",
          "Une durée longue et quotidienne : la régularité compte davantage que l'altitude atteinte.",
          "Une montée progressive du palier, de l'ordre de quelques centaines de mètres par semaine.",
          "Des séances intenses maintenues au niveau de la mer, sans compromis sur les allures.",
        ],
      },
      { type: "heading", text: "Le préalable : le fer" },
      {
        type: "paragraph",
        text: "C'est le point que les protocoles sérieux placent en premier et que les présentations commerciales oublient volontiers. La réponse à l'altitude mobilise les réserves de fer de l'organisme. Si ces réserves sont basses au départ, l'adaptation attendue ne se produit pas, et l'exposition devient une contrainte sans bénéfice.",
      },
      {
        type: "paragraph",
        text: "Un bilan de ferritine avant de commencer, puis un contrôle en cours de cycle, font partie du protocole au même titre que les paliers. C'est une discussion à avoir avec un médecin, pas un paramètre à régler soi-même.",
      },
      { type: "heading", text: "La transposition à domicile" },
      {
        type: "paragraph",
        text: "Un générateur d'altitude reproduit ce dispositif sans déménagement : l'appareil alimente une tente posée sur le lit en air appauvri en oxygène, et l'entraînement se déroule normalement le lendemain. L'intérêt principal n'est pas le confort, c'est la régularité. Un protocole d'altitude produit ses effets par l'accumulation de nuits, ce qu'un stage de deux semaines par an ne permet pas.",
      },
      {
        type: "paragraph",
        text: "Reste que la réponse individuelle varie fortement d'un athlète à l'autre. Certains répondent nettement, d'autres peu. C'est une raison de plus pour suivre les séances, ajuster les paliers, et considérer le protocole comme un réglage continu plutôt que comme une recette figée.",
      },
    ],
  },
  {
    slug: "comment-atmos-one-fabrique-air-altitude",
    title: "Comment ATMOS ONE fabrique de l'air d'altitude",
    description:
      "Séparation membranaire, fraction d'oxygène, débit : le fonctionnement d'un générateur d'altitude hypoxique expliqué simplement, et ce que signifient réellement 6 500 mètres simulés.",
    publishedAt: "2026-07-28",
    readingMinutes: 6,
    tags: ["Technologie", "ATMOS ONE"],
    body: [
      {
        type: "paragraph",
        text: "Simuler l'altitude chez soi soulève une question légitime : que fait exactement la machine ? La réponse est plus simple qu'il n'y paraît, et elle tient à une distinction que l'on confond souvent.",
      },
      { type: "heading", text: "Altitude réelle et altitude simulée" },
      {
        type: "paragraph",
        text: "En montagne, l'air contient toujours environ 20,9 % d'oxygène. Ce qui change avec l'altitude, c'est la pression : l'air se raréfie, et chaque inspiration apporte donc moins de molécules d'oxygène. C'est la baisse de pression qui crée la contrainte.",
      },
      {
        type: "paragraph",
        text: "Un générateur d'altitude ne modifie pas la pression de votre chambre. Il agit sur l'autre variable : il abaisse la fraction d'oxygène de l'air, de 20,9 % à 9 % dans le cas d'ATMOS ONE. Le résultat physiologique est comparable, d'où le terme d'altitude équivalente. Dire « 6 500 mètres simulés », c'est dire que l'air délivré apporte autant d'oxygène qu'une inspiration à cette altitude.",
      },
      { type: "heading", text: "La séparation membranaire" },
      {
        type: "paragraph",
        text: "L'air ambiant est composé pour l'essentiel d'azote et d'oxygène. Pour appauvrir l'air en oxygène, il suffit donc d'en enrichir la part d'azote. C'est le rôle de la membrane : traversée par de l'air comprimé, elle laisse passer les deux gaz à des vitesses différentes, ce qui permet de récupérer d'un côté un flux appauvri en oxygène.",
      },
      {
        type: "paragraph",
        text: "Rien n'est ajouté à l'air, aucun gaz n'est stocké : la machine se contente de trier ce qu'elle aspire dans la pièce. Le mélange produit est ensuite dirigé vers un masque ou une tente.",
      },
      { type: "heading", text: "Pourquoi le débit compte autant que le palier" },
      {
        type: "paragraph",
        text: "Un chiffre d'altitude seul ne dit pas grand-chose s'il n'est pas accompagné d'un débit. Un athlète en plein effort ventile beaucoup plus qu'une personne endormie ; si le générateur ne suit pas, l'air appauvri se mélange à l'air ambiant et le palier réellement respiré n'est plus celui affiché.",
      },
      {
        type: "list",
        items: [
          "Fraction d'oxygène réglable de 20,9 % à 9 %, soit 0 à 6 500 mètres simulés.",
          "Débit de 100 litres par minute, dimensionné aussi bien pour un masque en séance que pour une tente sur une nuit.",
          "Niveau sonore inférieur ou égal à 50 dB, l'ordre de grandeur d'un réfrigérateur.",
          "Alarmes intégrées sur la coupure d'alimentation et les pressions haute et basse.",
        ],
      },
      { type: "heading", text: "Deux usages, un seul appareil" },
      {
        type: "paragraph",
        text: "Le même générateur couvre les deux protocoles de référence : l'exposition longue et modérée pendant le sommeil, sous tente, et l'exposition courte et élevée pendant la séance, sous masque. Ce sont deux dosages différents d'une même contrainte, la durée et le palier étant les deux seuls curseurs à régler.",
      },
      {
        type: "paragraph",
        text: "Précisons enfin ce que l'appareil ne fait pas : il ne produit pas d'air enrichi en oxygène et n'a rien d'un caisson hyperbare. Il ne sait faire qu'une chose, raréfier l'oxygène, et c'est ce qui permet de la faire proprement.",
      },
    ],
  },
];

/** Articles du plus récent au plus ancien. */
export function getAllPosts(): Post[] {
  return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((post) => post.slug === slug);
}

/** Date lisible en français, calculée sans dépendre du fuseau du visiteur. */
export function formatPostDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const mois = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  return `${day} ${mois[month - 1]} ${year}`;
}
