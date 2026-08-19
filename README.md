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
| `BREVO_LIST_ID` | Liste Brevo du Batch n°1 (identifiant numérique) | oui |
| `BREVO_LOCATION_LIST_ID` | Liste séparée pour les demandes de location | non |
| `STRIPE_SECRET_KEY` | Tunnel de paiement | à l'ouverture des ventes |
| `STRIPE_WEBHOOK_SECRET` | Vérification de signature du webhook | à l'ouverture des ventes |
| `NEXT_PUBLIC_SITE_URL` | Origine publique (URL de retour Stripe, données structurées) | oui en production |

Seule `NEXT_PUBLIC_SITE_URL` est exposée au navigateur. Les autres sont des
secrets serveur : jamais de préfixe `NEXT_PUBLIC_`, jamais dans le dépôt.

## Déploiement (Hostinger « Web Apps », runtime Node)

Le projet est bâti en `output: "standalone"` : le build produit un serveur
autonome dans `.next/standalone`, sans `node_modules` à réinstaller.

```bash
npm ci && npm run build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
```

**La copie de `public/` et `.next/static/` n'est pas optionnelle.** Le
`server.js` généré ne les embarque pas : sans elle, le site se charge sans
styles, sans polices et sans images.

Démarrage :

```bash
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

### Les variables d'environnement se déclarent côté hébergeur

Le serveur standalone lit ses fichiers `.env` **dans son propre dossier**, pas
à la racine du projet : téléverser un `.env.local` ne suffit pas. Les valeurs
doivent être fournies par l'environnement réel — le panneau d'Hostinger — ou
par un `.env` déposé à côté de `server.js`.

## Ouverture des ventes

`ORDERS_OPEN` et `LEASING_OPEN` dans [`lib/offering.ts`](lib/offering.ts)
pilotent l'ouverture commerciale, côté page comme côté API. Tant que
`ORDERS_OPEN` vaut `false`, `/api/checkout` refuse toute session de paiement et
le webhook Stripe accuse réception sans rien enregistrer.

Avant de passer `ORDERS_OPEN` à `true`, remplacer le stockage fichier de
[`lib/orders.ts`](lib/orders.ts) par une vraie base : sur un hébergement sans
disque persistant, une commande payée serait perdue.
