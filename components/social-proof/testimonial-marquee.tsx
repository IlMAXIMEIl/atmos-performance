import Image from "next/image";

import { Eyebrow } from "@/components/ui/eyebrow";
import {
  TESTIMONIALS,
  TESTIMONIALS_PUBLISHED,
  type Testimonial,
  initials,
} from "@/lib/testimonials";

/**
 * Bandeau de témoignages en défilement continu.
 *
 * **Aucun JavaScript.** Le défilement est une animation CSS, la pause au
 * survol un `animation-play-state`, et le repli en mouvement réduit un rail
 * qui se fait défiler à la main. Rien à hydrater, rien à charger : c'est un
 * composant serveur.
 *
 * La boucle sans couture tient à une contrainte de mise en page. La liste est
 * rendue **deux fois de suite dans une seule rangée**, et la piste glisse de
 * `-50 %` : à l'arrivée, la copie occupe exactement la position de départ de
 * l'original. Pour que le compte tombe juste, l'écart entre les cartes est
 * porté par une marge sur chaque carte, jamais par un `gap` sur la piste — un
 * `gap` ajouterait un écart au milieu que la moitié de la largeur ne
 * rattraperait pas, et la couture se verrait à chaque tour.
 *
 * La copie est `aria-hidden` : un lecteur d'écran lirait sinon les quatre
 * témoignages deux fois.
 */
export function TestimonialMarquee() {
  // Rien tant que les témoignages ne sont pas réels. Voir `lib/testimonials`.
  if (!TESTIMONIALS_PUBLISHED) return null;

  return (
    <section
      aria-labelledby="temoignages-titre"
      className="relative z-20 py-24 sm:py-28"
    >
      <div className="mx-auto w-full max-w-[1240px] px-6 lg:px-10">
        <Eyebrow as="h2" id="temoignages-titre">
          Sur le terrain
        </Eyebrow>

        <p className="mt-6 max-w-[24ch] text-[clamp(1.8rem,3.6vw,2.8rem)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance">
          <span className="text-ink">Ceux qui l&apos;utilisent</span>{" "}
          <span className="text-accent">en parlent mieux que nous.</span>
        </p>
      </div>

      {/*
        `group` porte la pause au survol ; `focus-within` la porte aussi, sans
        quoi une carte atteinte au clavier continuerait de fuir sous le
        curseur de saisie.

        Le masque estompe les deux bords : sans lui, les cartes apparaissent et
        disparaissent d'un coup contre le bord de la fenêtre, ce qui trahit
        l'astuce de la boucle.
      */}
      <div className="group relative mt-14 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]">
        <ul className="atmos-marquee flex w-max group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {TESTIMONIALS.map((person) => (
            <TestimonialCard key={person.handle} person={person} />
          ))}

          {/* La copie qui ferme la boucle. Muette pour les technologies
              d'assistance, et retirée quand le rail se fait défiler à la
              main : elle n'y serait qu'une répétition. */}
          {TESTIMONIALS.map((person) => (
            <TestimonialCard
              key={`${person.handle}-copie`}
              person={person}
              aria-hidden
              className="motion-reduce:hidden"
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function TestimonialCard({
  person,
  className = "",
  ...rest
}: {
  person: Testimonial;
  className?: string;
} & React.LiHTMLAttributes<HTMLLIElement>) {
  return (
    <li
      {...rest}
      className={`mr-6 flex w-[min(24rem,80vw)] flex-none flex-col justify-between rounded-xl border border-line bg-deep p-7 ${className}`}
    >
      {/*
        Pas d'étoiles.

        Une rangée de cinq étoiles jaunes est le vocabulaire du commerce de
        détail : elle note un colis. L'appareil se juge sur ce qu'il change
        dans un plan d'entraînement, et c'est la citation qui le dit. Le guillemet
        d'ouverture tient lieu de signe distinctif.
      */}
      <span aria-hidden className="font-mono text-2xl leading-none text-accent">
        &ldquo;
      </span>

      <blockquote className="mt-5 text-[0.98rem] leading-[1.65] text-ink text-pretty">
        {person.quote}
      </blockquote>

      <figcaption className="mt-7 flex items-center gap-3.5 border-t border-line pt-5">
        {person.avatar ? (
          /*
            Désaturation complète et contraste relevé : un portrait en couleur
            au milieu d'une page monochrome tire l'œil vers le visage plutôt
            que vers ce qui est dit, et les carnations se battent avec le bleu
            d'accent.
          */
          <Image
            src={person.avatar}
            alt=""
            width={80}
            height={80}
            className="h-11 w-11 flex-none rounded-full border border-line object-cover grayscale contrast-[1.08] brightness-90"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line bg-elev font-mono text-[0.7rem] tracking-[0.08em] text-dim"
          >
            {initials(person.name)}
          </span>
        )}

        <span className="min-w-0">
          <span className="block truncate text-[0.9rem] font-semibold tracking-[-0.01em] text-ink">
            {person.name}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[0.66rem] tracking-[0.12em] text-dimmer uppercase">
            {person.role}
          </span>
          <span className="mt-1 block truncate font-mono text-[0.7rem] text-accent/80">
            {person.handle}
          </span>
        </span>
      </figcaption>
    </li>
  );
}
