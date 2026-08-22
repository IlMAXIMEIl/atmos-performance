"use client";

import { AscensionSection } from "@/components/ascension/ascension-section";
import { JsonLd } from "@/components/json-ld";
import { FAQ, FaqSection } from "@/components/faq-section";
import { HeroSection } from "@/components/hero/hero-section";
import { NextProductSection } from "@/components/next-product-section";
import { OffersSection } from "@/components/offers-section";
import { DatasheetPanel } from "@/components/product/datasheet-panel";
import { ProductScene } from "@/components/product/product-scene";
import { ProtocolsSection } from "@/components/protocols-section";
import { ScrollRevealController } from "@/components/scroll-reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TestimonialMarquee } from "@/components/social-proof/testimonial-marquee";
import { faqPageSchema, productSchema } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

export default function Home() {
  return (
    /*
      `overflow-x-clip`, et non `overflow-hidden`.

      `overflow: hidden` fait de l'élément un conteneur de défilement : tout
      `position: sticky` placé dessous se cale sur *lui* — un conteneur qui ne
      défile jamais — et n'adhère donc nulle part. C'est ce qui laissait la
      scène produit se dérouler dans le vide. `clip` rogne les débordements
      horizontaux sans créer ce conteneur, et les épinglages redeviennent
      possibles — ceux d'aujourd'hui comme ceux des scènes à venir.
    */
    <div className="relative min-h-screen w-full overflow-x-clip bg-void text-ink">
      {/* Le générateur et les questions fréquentes, tels que cette page les
          présente. `FAQ` est le tableau qui alimente l'accordéon plus bas :
          balisage et affichage sortent de la même source. */}
      <JsonLd data={[productSchema(), faqPageSchema(FAQ, SITE_URL)]} />

      {/* Anime tout ce qui porte `data-reveal` dans la page, hors scènes
          qui orchestrent elles-mêmes leurs entrées. */}
      <ScrollRevealController />

      {/*
        Atmosphère de page, sous les sections qui suivent le hero.

        Les halos qui occupaient le haut de la page ont été retirés : le ciel
        peint au canvas du hero les remplace, et deux dégradés superposés se
        seraient battus sur le même écran. Ce qui reste vaut pour le bas du
        document, là où le canvas ne va pas.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Voile bleu froid en pied de page */}
        <div className="absolute inset-x-0 bottom-0 h-[26rem] bg-[radial-gradient(ellipse_at_bottom,rgba(30,64,175,0.18),transparent_70%)]" />
        {/* Grille technique */}
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_75%,black,transparent)]" />
      </div>

      <SiteHeader />

      <main className="relative z-20">
        <HeroSection />

        {/*
          L'ascension avant le produit.

          Le visiteur vient d'apprendre que l'appareil monte à 6 500 mètres ;
          il n'a aucune raison de savoir ce que ce chiffre lui ferait. La
          traversée le lui montre palier par palier, avec les plages exactes
          des trois protocoles défendus plus bas — après quoi la fiche
          technique du générateur se lit toute seule.
        */}
        <AscensionSection />

        {/* ── Scène produit et fiche technique ─────────────────────────
            La traversée annotée du générateur, puis le volet qui donne le
            détail chiffré à qui le cherche. */}
        <ProductScene />
        <DatasheetPanel />

        {/* Preuve sociale, juste après la fiche technique : le visiteur
            vient de lire les chiffres, il veut savoir ce qu'ils donnent
            entre les mains de quelqu'un. Ne rend rien tant que
            `TESTIMONIALS_PUBLISHED` est à `false`. */}
        <TestimonialMarquee />

        {/* ── Section Protocoles ───────────────────────────────────────── */}
        <ProtocolsSection />

        {/*
          Le prix arrive ici, et pas trois sections plus bas.

          À ce point le visiteur sait ce qu'est l'appareil et ce qu'on en fait :
          il a de quoi vouloir le tarif. Le laisser descendre encore trois
          écrans avant de le lui montrer ne le convainc pas davantage, ça
          l'épuise. Ce qui vient après — la gamme, la science, la FAQ — sert
          celui qui hésite encore, pas celui qui est déjà décidé.
        */}
        <OffersSection />

        {/*
          La gamme, juste après le prix.

          Elle répond au doute qui suit précisément l'annonce d'un tarif chez
          une marque qu'on ne connaît pas : est-ce une maison qui construit une
          gamme, ou un produit isolé ?
        */}
        <NextProductSection />

        {/*
          La science a quitté cette page pour `/la-science`.

          Elle occupait l'écran juste avant les questions fréquentes,
          c'est-à-dire juste avant l'endroit où tombent les dernières
          objections. Le visiteur décidé la traversait sans la lire, l'hésitant
          y arrivait fatigué. Elle reste écrite, entière, à un clic du volet de
          navigation et du pied de page — mais elle ne retarde plus la FAQ.
        */}
        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <FaqSection />
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
}
