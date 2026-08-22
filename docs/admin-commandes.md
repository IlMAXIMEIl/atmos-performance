# Cahier des charges — espace d'administration des commandes

**État : à construire.** Ce document se suffit à lui-même : il porte le
contexte, les décisions déjà prises et les pièges déjà rencontrés. Le donner
tel quel en début de conversation doit suffire à reprendre le travail.

---

## 1. Le problème

Les commandes sont enregistrées en base (`lib/orders.ts`, table `orders`), mais
**rien ne permet de les consulter ni de les traiter**. Aujourd'hui il faut
ouvrir phpMyAdmin et écrire du SQL.

Le porteur du projet vient de Shopify, où un onglet « Commandes » offre une
liste, un statut et un bouton « marquer comme traitée ». C'est ce niveau de
service qui manque.

## 2. Ce qu'il ne faut PAS construire, et pourquoi

Cette section est la plus importante du document : elle évite des semaines de
travail inutile.

- **Aucun tableau de bord financier.** Chiffre d'affaires, virements,
  remboursements, litiges, exports comptables, TVA : Stripe le fait déjà, et
  mieux. Le dupliquer créerait une seconde source de vérité qui finirait par
  diverger de la première. Le tableau de bord financier du projet, c'est Stripe.
- **Aucune gestion de stock** tant qu'il n'y a qu'un produit sans variante.
- **Aucune étiquette transporteur ni intégration logistique** tant que le
  volume ne le justifie pas. Un champ « numéro de suivi » suffit.

La règle : **l'administration sert au traitement des commandes, pas à la
comptabilité ni à l'analyse.**

## 3. Périmètre à construire

### 3.1 Authentification

- Route `/admin` et tout ce qui vit dessous, inaccessible sans authentification.
- Mot de passe unique dans `ADMIN_PASSWORD` (variable serveur), formulaire de
  connexion, **cookie de session signé** (`httpOnly`, `secure`, `sameSite=lax`).
- Comparaison du mot de passe en **temps constant** — voir le précédent dans
  `app/api/health/db/route.ts`.
- **Limitation de débit sur la connexion** : `lib/rate-limit.ts` existe déjà et
  est utilisé par les autres routes.
- `robots: { index: false }` sur toutes les pages d'administration.

### 3.2 Liste des commandes

Pensée pour **des milliers de lignes**, pas pour vingt-cinq :

- Pagination côté serveur (50 par page), jamais de `SELECT *` intégral.
- Recherche par **email, référence de paiement, nom**.
- Filtres : **statut**, **plan** (achat / location), **plage de dates**.
- Tri par date, par montant.
- Colonnes : date, nom, email, quantité, montant, statut, référence.
- Les index existent déjà (`idx_email`, `idx_received_at`) ; en ajouter un sur
  `status` quand la colonne sera créée.

### 3.3 Fiche commande

- Toutes les coordonnées : nom, email, téléphone, adresse, options.
- Montant, devise, plan, quantité, dates de location le cas échéant.
- **Lien direct vers le paiement dans Stripe** (`https://dashboard.stripe.com/payments/{reference}`),
  pour rembourser ou vérifier sans quitter le poste.
- Champ **numéro de suivi** et champ **note interne**, libres.

### 3.4 Statut et historique

- Colonne `status` sur `orders`, valeurs : `recue`, `en_fabrication`,
  `expediee`, `annulee`.
- Changement de statut par action serveur, **jamais par requête GET**.
- **Table `order_events`** (`id`, `order_id`, `status`, `note`, `created_at`) :
  qui a fait quoi et quand. Sans historique, une erreur de manipulation est
  indétectable.
- Changement de statut **en lot** depuis la liste — indispensable le jour où
  une série entière part à la fabrication.

### 3.5 Export

- **CSV** de la sélection courante (filtres appliqués), séparateur `;` et BOM
  UTF-8 pour qu'Excel français l'ouvre correctement du premier coup.

## 4. Ce qui existe déjà et qu'il faut réutiliser

| Élément | Emplacement |
| --- | --- |
| Accès base, `recordOrder`, `listOrders`, `countOrders` | `lib/orders.ts` |
| Limitation de débit | `lib/rate-limit.ts` |
| Jetons de couleur, `Eyebrow`, `ButtonLink` | `app/globals.css`, `components/ui/` |
| Précédent d'authentification par jeton en temps constant | `app/api/health/db/route.ts` |

### Contraintes techniques à respecter

- **La réserve de connexions s'ouvre à la première requête, jamais à
  l'import** : `next build` exécute les modules sans base à disposition.
- **`overflow-x-clip`, jamais `overflow-hidden`** sur un conteneur de page —
  ce dernier neutralise tout `position: sticky` en dessous.
- Pas de `toLocaleString` ni de `new Date()` dans une valeur rendue : écart
  serveur / client et erreur d'hydratation. Voir les formateurs de
  `lib/altitude.ts`.
- **`reference` est la clé d'idempotence** (identifiant du paiement, jamais
  celui de l'événement Stripe). Ne pas la changer : deux chemins d'écriture
  indépendants convergent dessus.

## 5. Variables d'environnement à ajouter

```
ADMIN_PASSWORD=          # mot de passe de l'espace d'administration
ADMIN_SESSION_SECRET=    # signature du cookie de session — openssl rand -hex 32
```

Variables serveur : un redémarrage suffit, pas de reconstruction.

## 6. Rappel de déploiement

L'hébergement est **Hostinger**, pas Vercel. Le déploiement passe par une
archive des fichiers suivis, construite **sur le serveur** :

```bash
git archive --format=tar.gz -o /tmp/atmos-source.tar.gz HEAD
# puis hosting_deployJsApplication, et purge du cache
```

**Purger le cache après chaque déploiement** : les pages statiques sont
servies par le CDN pendant des heures, en-têtes compris.

## 7. Ordre de construction suggéré

1. Authentification et coquille de l'espace — sans elle, rien ne doit être visible
2. Colonne `status`, table `order_events`, migrations idempotentes
3. Liste paginée, recherche, filtres
4. Fiche commande et changement de statut
5. Actions en lot et export CSV

Chaque étape est déployable seule.
