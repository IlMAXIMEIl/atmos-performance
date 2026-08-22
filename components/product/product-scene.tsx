"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { GeneratorDrawing } from "@/components/product/generator-drawing";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PRODUCT_ANNOTATIONS, PRODUCT_CHAPTERS } from "@/lib/product";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Part de défilement attribuée à chaque chapitre. */
const SLICE = 1 / PRODUCT_CHAPTERS.length;

/**
 * La traversée du générateur : le dessin reste à l'écran, le texte se
 * substitue sur place, et les annotations s'allument une à une.
 *
 * Même mécanique que la scène d'ascension, et pour les mêmes raisons :
 * l'épinglage est un `position: sticky`, ScrollTrigger ne fait que lire
 * l'avancement, et rien ne repasse par l'état React pendant le défilement.
 *
 * Sous `lg`, la scène se déplie : le dessin en haut, les chapitres à la suite,
 * les annotations retirées. Épingler sur téléphone donnerait un long
 * défilement mort où l'on pousse l'écran sans que rien n'avance — c'est
 * exactement le travers qu'on vient de retirer de cette page.
 */
export function ProductScene() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia(stage);

      // Deux conditions à la fois : la scène ne s'anime qu'au-dessus de `lg`
      // et hors mouvement réduit. Partout ailleurs, le CSS la sert dépliée.
      media.add(
        "(min-width: 64rem) and (prefers-reduced-motion: no-preference)",
        () => {
          const slides = gsap.utils.toArray<HTMLElement>("[data-chapter]");
          const notes = gsap.utils.toArray<HTMLElement>("[data-annotation]");
          const figure =
            stage.current!.querySelector<HTMLElement>("[data-figure]")!;

          const setFigure = gsap.quickSetter(figure, "css");

          let shown = -1;

          const render = (progress: number) => {
            const index = Math.min(
              PRODUCT_CHAPTERS.length - 1,
              Math.max(0, Math.floor(progress / SLICE)),
            );

            if (index !== shown) {
              shown = index;

              slides.forEach((slide, i) => {
                gsap.to(slide, {
                  opacity: i === index ? 1 : 0,
                  y: i === index ? 0 : 16,
                  duration: 0.5,
                  ease: "power3.out",
                  overwrite: true,
                });
                // Les chapitres se superposent : sans cela, un lecteur
                // d'écran les lirait tous les cinq d'affilée.
                slide.setAttribute(
                  "aria-hidden",
                  i === index ? "false" : "true",
                );
              });

              // Les annotations s'accumulent : une fois allumée, une légende
              // ne s'éteint plus. Au dernier chapitre le dessin est
              // entièrement légendé.
              notes.forEach((note) => {
                const on = index >= Number(note.dataset.from);
                gsap.to(note, {
                  opacity: on ? 1 : 0,
                  x: on ? 0 : note.dataset.side === "right" ? 8 : -8,
                  duration: 0.45,
                  ease: "power3.out",
                  overwrite: true,
                });
              });
            }

            // Lente poussée vers l'avant : l'appareil se rapproche pendant
            // qu'on le détaille.
            setFigure({
              transform: `scale(${1 + progress * 0.12}) translateY(${-progress * 3}%)`,
            });
          };

          const trigger = ScrollTrigger.create({
            trigger: track.current,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => render(self.progress),
            onRefresh: (self) => render(self.progress),
          });

          return () => trigger.kill();
        },
      );

      return () => media.revert();
    },
    { scope: stage },
  );

  return (
    <section
      id="produit"
      aria-labelledby="produit-titre"
      className="relative z-20 scroll-mt-24"
    >
      {/* 350 svh de piste moins la fenêtre épinglée : 250 vh de course pour
          cinq chapitres, soit 450 px chacun — la cadence de la scène
          d'ascension. Voir le commentaire de course qui y est détaillé. */}
      <div
        ref={track}
        data-reveal-scope
        className="relative max-lg:h-auto motion-reduce:h-auto lg:h-[350svh]"
      >
        <div
          ref={stage}
          className="max-lg:static max-lg:h-auto max-lg:py-24 motion-reduce:static motion-reduce:h-auto lg:sticky lg:top-0 lg:h-[100svh] lg:overflow-hidden"
        >
          <div className="mx-auto grid h-full w-full max-w-[1240px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
            {/* ── Le dessin ────────────────────────────────────────────── */}
            <div className="relative flex items-center justify-center max-lg:h-[52vh] lg:h-[78vh]">
              {/* Halo froid : détache le trait du fond sans l'encadrer. */}
              <div
                aria-hidden
                className="pointer-events-none absolute aspect-square w-[70%] rounded-full bg-[radial-gradient(circle,rgba(59,158,255,0.17),transparent_68%)] blur-[18px]"
              />

              <GeneratorDrawing
                data-figure
                className="relative h-full w-auto max-w-full will-change-transform"
              />

              {PRODUCT_ANNOTATIONS.map((note) => (
                <span
                  key={note.id}
                  data-annotation
                  data-from={note.from}
                  data-side={note.side}
                  aria-hidden
                  className={[
                    "absolute z-10 flex items-center gap-2 font-mono text-[0.66rem] tracking-[0.11em] whitespace-nowrap text-ink uppercase",
                    // Dépliée, la scène n'a plus de place pour les légendes —
                    // et les chapitres disent déjà la même chose.
                    "opacity-0 max-lg:hidden motion-reduce:hidden",
                    note.side === "right" ? "flex-row-reverse" : "",
                    note.position,
                  ].join(" ")}
                >
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-accent shadow-[0_0_0_4px_var(--accent-soft)]" />
                  <span className="h-px w-9 flex-none bg-line-strong" />
                  {note.label}
                </span>
              ))}
            </div>

            {/* ── Les chapitres ────────────────────────────────────────── */}
            <div className="relative max-lg:flex max-lg:flex-col max-lg:gap-14 motion-reduce:flex motion-reduce:flex-col motion-reduce:gap-14">
              {PRODUCT_CHAPTERS.map((chapter, index) => (
                <article
                  key={chapter.eyebrow}
                  data-chapter
                  className={[
                    "flex flex-col gap-4",
                    // Le chapitre d'ouverture tient la place dans le flux ;
                    // les suivants se calent dessus.
                    index === 0
                      ? "relative"
                      : "opacity-0 max-lg:relative max-lg:opacity-100 motion-reduce:relative motion-reduce:opacity-100 lg:absolute lg:inset-x-0 lg:top-0",
                  ].join(" ")}
                >
                  <Eyebrow>{chapter.eyebrow}</Eyebrow>

                  {index === 0 ? (
                    <h2
                      id="produit-titre"
                      className="text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.03] font-semibold tracking-[-0.035em] text-ink"
                    >
                      {chapter.title}
                    </h2>
                  ) : (
                    <p className="text-[clamp(1.3rem,2.2vw,1.9rem)] leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-ink">
                      {chapter.title}
                    </p>
                  )}

                  <p className="max-w-[34em] leading-[1.65] text-dim text-pretty">
                    {chapter.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
