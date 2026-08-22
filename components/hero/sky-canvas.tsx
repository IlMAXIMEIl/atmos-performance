"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  /** Rayon en pixels physiques. */
  radius: number;
  driftX: number;
  riseY: number;
  alpha: number;
  /** Décalage de phase du scintillement, pour désynchroniser les points. */
  phase: number;
  /** 0 = plan lointain, 1 = plan proche. Pilote taille, vitesse et teinte. */
  depth: number;
};

/** Au-delà de 2, le gain visuel est nul et le coût de remplissage double. */
const MAX_DPR = 2;
/** Une particule pour ~42 000 pixels physiques, plafonnée. */
const PIXELS_PER_PARTICLE = 42000;
const MAX_PARTICLES = 180;

/**
 * Ciel d'altitude peint au `<canvas>` : dégradé de nuit et poussière qui
 * monte lentement.
 *
 * Pourquoi un canvas plutôt que des `<div>` animés : quelques centaines de
 * points en mouvement continu créeraient autant de couches à composer, là où
 * le canvas tient dans un seul calque et un seul appel de peinture par image.
 *
 * Trois garde-fous : la boucle s'arrête quand le hero sort du champ ou que
 * l'onglet passe en arrière-plan, et le mouvement réduit ne peint qu'une
 * image fixe.
 */
export function SkyCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;
    let frame = 0;
    let visible = true;

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
      width = canvas!.width = Math.round(canvas!.offsetWidth * dpr);
      height = canvas!.height = Math.round(canvas!.offsetHeight * dpr);

      const count = Math.min(
        MAX_PARTICLES,
        Math.round((width * height) / PIXELS_PER_PARTICLE),
      );

      particles = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          radius: (depth * 1.9 + 0.35) * dpr,
          driftX: (Math.random() - 0.5) * 0.14 * dpr,
          riseY: (depth * 0.28 + 0.05) * dpr,
          alpha: depth * 0.5 + 0.12,
          phase: Math.random() * Math.PI * 2,
          depth,
        };
      });
    }

    function paint(animate: boolean) {
      if (animate) time += 0.012;

      const sky = context!.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#08111f");
      sky.addColorStop(0.55, "#060c17");
      sky.addColorStop(1, "#04070d");
      context!.fillStyle = sky;
      context!.fillRect(0, 0, width, height);

      for (const particle of particles) {
        if (animate) {
          particle.y -= particle.riseY;
          particle.x +=
            particle.driftX + Math.sin(time + particle.phase) * 0.16 * dpr;

          // Enroulement : une particule sortie par le haut réapparaît en bas.
          if (particle.y < -4) {
            particle.y = height + 4;
            particle.x = Math.random() * width;
          }
          if (particle.x < -4) particle.x = width + 4;
          else if (particle.x > width + 4) particle.x = -4;
        }

        const twinkle = animate
          ? 0.55 + Math.sin(time * 1.4 + particle.phase) * 0.22
          : 0.7;
        // Les points les plus proches virent au blanc froid : la profondeur
        // se lit à la teinte autant qu'à la taille.
        const tint = particle.depth > 0.72 ? "155,205,255" : "59,158,255";

        context!.beginPath();
        context!.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context!.fillStyle = `rgba(${tint},${particle.alpha * twinkle})`;
        context!.fill();
      }
    }

    function loop() {
      paint(true);
      frame = requestAnimationFrame(loop);
    }

    function start() {
      if (frame || reducedMotion.matches || document.hidden || !visible) return;
      frame = requestAnimationFrame(loop);
    }

    function stop() {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    }

    function restart() {
      stop();
      resize();
      if (reducedMotion.matches) paint(false);
      else start();
    }

    restart();

    // Le hero occupe le haut de page : passé le premier écran, la boucle
    // n'a plus rien à montrer.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    function onVisibilityChange() {
      if (document.hidden) stop();
      else start();
    }

    addEventListener("resize", restart);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", restart);

    return () => {
      stop();
      observer.disconnect();
      removeEventListener("resize", restart);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", restart);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // Le fond est peint en CSS aussi : le canvas reste vide jusqu'à
      // l'hydratation, et un rectangle noir vaut mieux qu'un trou clair.
      className={`block h-full w-full bg-void ${className}`}
    />
  );
}
