# ATMOS ONE

Site de lancement du générateur d'altitude hypoxique ATMOS ONE : page produit,
blog, glossaire, simulateur d'altitude, et capture de la liste d'attente.

Next.js 16 (App Router), React 19, Tailwind CSS 4.

## Développement

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

Le site tourne sur http://localhost:3000.

## Variables d'environnement

Toutes sont décrites dans [`.env.example`](.env.example). En résumé :

| Variable | Rôle | Obligatoire |
| --- | --- | --- |
| `BREVO_API_KEY` | Création des contacts de la liste d'attente | oui |
| `BREVO_LIST_ID` | Liste Brevo du Drop n°1 (identifiant numérique) | oui |
| `BREVO_LOCATION_LIST_ID` | Liste séparée pour les demandes de location | non |
| `STRIPE_SECRET_KEY` | Tunnel de paiement | à l'ouverture des ventes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payment Element du tunnel d'achat intégré | à l'ouverture des ventes |
| `CONFIRM_FUNCTION_URL` | Edge Function Supabase qui enregistre les commandes | à l'ouverture des ventes |
| `CONFIRM_SHARED_SECRET` | Authentifie l'appel à cette fonction | à l'ouverture des ventes |
| `NEXT_PUBLIC_SITE_URL` | Origine publique (URL de retour Stripe, données structurées) | oui en production |

Seules les variables préfixées `NEXT_PUBLIC_` sont exposées au navigateur — l'URL du site et la clé **publiable** de Stripe, qui est faite pour ça. Les autres sont des
secrets serveur : jamais de préfixe `NEXT_PUBLIC_`, jamais dans le dépôt.

## Déploiement (Hostinger « Web Apps », runtime Node)

Le projet est bâti en `output: "standalone"` : le build produit un serveur
autonome dans `.next/standalone`, sans `node_modules` à réinstaller.

```bash
npm ci
npm run build
npm start
```

Rien d'autre à faire : `npm run build` enchaîne `next build` puis la copie de
`public/` et `.next/static/` dans le dossier standalone — deux dossiers que le
build n'y place pas de lui-même, et sans lesquels le site se charge sans
styles, sans polices et sans images.

`npm start` lance `node .next/standalone/server.js`, le seul point d'entrée
valable ici : `next start` ne fonctionne pas avec `output: "standalone"` et
Next le signale explicitement. Le port et l'interface se règlent par
l'environnement (`PORT`, `HOSTNAME`).

### Construire sur le serveur, pas en local

`sharp`, qu'utilise l'optimisation d'images, est une dépendance **native** :
son binaire est compilé pour un couple OS/architecture donné. Un build fait
sur un Mac puis téléversé plante sur le Linux d'Hostinger. Lancer `npm ci &&
npm run build` dans l'environnement cible (ou une CI Linux) règle la question.

### Les variables d'environnement se déclarent côté hébergeur

Le serveur standalone lit ses fichiers `.env` **dans son propre dossier**, pas
à la racine du projet : téléverser un `.env.local` ne suffit pas. Les valeurs
doivent être fournies par l'environnement réel — le panneau d'Hostinger — ou
par un `.env` déposé à côté de `server.js`.

## Ouverture des ventes

`ORDERS_OPEN` et `LEASING_OPEN` dans [`lib/offering.ts`](lib/offering.ts)
pilotent l'ouverture commerciale : tant qu'`ORDERS_OPEN` vaut `false`,
`/api/checkout` refuse toute session de paiement.

**Ce dépôt n'enregistre plus les commandes.** Il crée les paiements, et
c'est tout. Deux Edge Functions de `projet-nexus` s'occupent du reste :

- `stripe-webhook`, appelée directement par Stripe ;
- `confirm-payment`, appelée par la page de confirmation de ce site.

Les deux sont indispensables. Le webhook seul ne suffit pas — mal
configuré, Stripe ne livre **rien** : ni réessai, ni journal, ni ligne, et
la commande est payée sans exister nulle part. L'inverse est vrai aussi, un
client qui ferme son onglet ne verra jamais la page de confirmation. Les
deux chemins convergent sur la référence du paiement (`pi_…` ou `cs_…`),
dont la contrainte d'unicité en base fait l'arbitre.

Le traitement des commandes — liste, statut, expédition — vit dans
`projet-nexus`. Voir `docs/admin-commandes.md` pour l'espace qui a existé
ici, retiré au commit suivant `e1fe113`.
