"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Eyebrow } from "@/components/ui/eyebrow";
import { PREORDER_STEPS } from "@/lib/offering";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Longueur conventionnelle du tracé, en unités de `viewBox`.
 *
 * Le chemin est étiré horizontalement par `preserveAspectRatio="none"`, donc
 * sa longueur réelle à l'écran n'a rien à voir avec celle-ci. On garde une
 * valeur unique pour le pointillé et le décalage : le trait se dessine
 * intégralement, quelle que soit la largeur de la grille.
 */
const PATH_LENGTH = 1000;

/**
 * Le déroulé de la précommande, posé sur un fil qui se trace.
 *
 * Le fil part de la première pastille et court jusqu'à la dernière quand le
 * bloc entre dans le champ. Les pastilles sont opaques et passent au-dessus :
 * c'est ce qui donne l'impression que le trait les traverse plutôt que de
 * passer derrière un fond transparent.
 *
 * Sous `lg`, la grille se replie sur deux colonnes puis une seule ; le fil
 * disparaît alors, faute de rangée unique à relier.
 */
export function PreorderSteps() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia(root);

      media.add(
        "(min-width: 64rem) and (prefers-reduced-motion: no-preference)",
        () => {
          const line = root.current!.querySelector("[data-steps-line] path")!;

          const tween = gsap.fromTo(
            line,
            { strokeDashoffset: PATH_LENGTH },
            {
              strokeDashoffset: 0,
              duration: 1.6,
              ease: "power2.inOut",
              scrollTrigger: {
                trigger: root.current,
                start: "top 80%",
                once: true,
              },
            },
          );

          return () => tween.kill();
        },
      );

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-labelledby="precommande-titre"
      className="mt-16 border-t border-line pt-14"
    >
      <Eyebrow as="h3" id="precommande-titre" data-reveal>
        Comment se passe la précommande
      </Eyebrow>

      <ol className="relative mt-12 grid gap-x-[clamp(1.5rem,3vw,3rem)] gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Le fil, calé sur le centre des pastilles (19 px = la moitié de 38). */}
        <div
          aria-hidden
          data-steps-line
          className="pointer-events-none absolute inset-x-0 top-[19px] hidden h-px lg:block"
        >
          <svg
            viewBox={`0 0 ${PATH_LENGTH} 1`}
            preserveAspectRatio="none"
            className="h-px w-full overflow-visible"
          >
            <path
              d={`M0 .5H${PATH_LENGTH}`}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1"
              strokeDasharray={PATH_LENGTH}
              // Le trait est masqué au départ, y compris sans JavaScript et en
              // mouvement réduit — d'où le rétablissement ci-dessous.
              strokeDashoffset={PATH_LENGTH}
              className="motion-reduce:[stroke-dashoffset:0]"
            />
          </svg>
        </div>

        {PREORDER_STEPS.map((step, index) => (
          <li
            key={step.title}
            data-reveal
            className="relative z-10 flex flex-col gap-3.5"
          >
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line-strong bg-void font-mono text-[0.8rem] text-accent">
              {index + 1}
            </span>

            <h4 className="text-[1.05rem] leading-snug font-semibold tracking-[-0.02em] text-ink text-pretty">
              {step.title}
            </h4>

            <p className="text-[0.9rem] leading-relaxed text-dim text-pretty">
              {step.detail}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
