/**
 * Ouverture commerciale des formules.
 *
 * Le lancement ne propose que l'achat ferme. La location reste présentée sur
 * le site mais son tunnel de paiement est fermé : passer cette constante à
 * `true` le rouvre partout à la fois, côté page comme côté serveur.
 */
export const LEASING_OPEN = false;
