# ATMOS PERFORMANCE - Structure du Site

## Positionnement & Brand
- Marque : ATMOS PERFORMANCE (atmos-performance.com)
- Produit phare : **ATMOS ONE**, générateur d'altitude hypoxique. Il abaisse la fraction d'oxygène de 20,9 % à 9,5 %, soit 0 à 6 000 m simulés. Usage : performance sportive, VO2max, acclimatation.
- **L'appareil ne fait que de l'hypoxie.** Ne jamais le présenter comme un générateur d'hyperoxie ni comme un caisson hyperbare.
- Produit à venir, distinct : **ATMOS Chamber**, caisson de régénération hyperbare. Mentionné uniquement en teaser en bas de la section Offres.
- Style : Premium, scientifique, minimaliste (type Apple / Rolex / Canyon).
- Offre : Pré-ventes avec option d'Achat direct et Leasing (Location).

## Arborescence du Site
Toutes les sections sont construites. Une section = un composant dans `components/`, assemblé dans `app/page.tsx`.

1. Header : Logo ATMOS, Liens (Produit, Protocoles, Offres), Bouton Pill 'Précommander'. — `app/page.tsx`
2. Hero Section. — `app/page.tsx`
3. Section Produit : photo du générateur (`public/generator.png`) et pilules interactives. — `product-section.tsx`
4. Section Protocoles d'Altitude : Mode Sommeil / tente d'altitude (Live High, 2 000–3 500 m) et Mode Entraînement sous masque (Train High / IHT, 4 000–6 000 m), situés sur un axe d'altitude 0–6 000 m. — `protocols-section.tsx`
5. Section Science : Chiffres clés et réassurance (études, fer, adaptation). — `science-section.tsx`
6. Section Offres : Toggle interactif Achat vs Leasing, puis teaser ATMOS Chamber. — `offers-section.tsx`
7. Footer : Mentions légales, contact@atmos-performance.com, Instagram (@atmos_performance), Youtube (@atmos_performance), Tiktok (@atmos_performance). — `site-footer.tsx`

Page annexe : `/mentions-legales` — `app/mentions-legales/page.tsx`.

## À compléter avant publication
- Tous les chiffres du site sont des valeurs de remplissage, sauf la plage d'altitude et d'oxygène : specs du générateur (débit, stabilité, niveau sonore), prix Achat et Leasing, chiffres de la section Science, date de livraison.
- Champs `[À COMPLÉTER]` de la page mentions légales (identité de l'éditeur, hébergeur).
- CTA de la section Offres : pointe sur un `mailto:` en attendant un vrai formulaire de pré-réservation.
- Icônes de marque du footer (Instagram, YouTube, TikTok) : redessinées à la main, à remplacer par les marques officielles.

## Instructions pour l'IA
- Travailler section par section.
- Utiliser Tailwind CSS, Framer Motion et Lucide-React.
- Conserver le thème sombre (#0B0C10) sur tout le site.
- Variants d'animation partagés dans `lib/motion.ts` : réutiliser `EASE`, `container` et `rise` plutôt que de les redéclarer.
- Cette version de `lucide-react` ne fournit aucune icône de marque (`Instagram`, `Youtube`… sont absents) : vérifier qu'une icône existe avant de l'importer.
- Ne pas calculer de valeurs de rendu avec `Math.cos`/`Math.sin` ni `new Date()` : les écarts serveur / client provoquent des erreurs d'hydratation. Pré-calculer et arrondir.
