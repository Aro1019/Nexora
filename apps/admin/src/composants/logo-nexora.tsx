/**
 * LogoNexora — composant réutilisable pour afficher le logo officiel.
 *
 * Variantes :
 *  - `taille` : pixels (carré). Défaut 32.
 *  - `avecHalo` : ajoute un halo lumineux derrière le logo.
 *  - `avecTexte` : affiche "Nexora" à droite du logo.
 *  - `couleurTexte` : classe Tailwind appliquée au texte.
 */
import Image from "next/image";

interface PropsLogoNexora {
  taille?: number;
  avecHalo?: boolean;
  avecTexte?: boolean;
  couleurTexte?: string;
  classeTexte?: string;
  prioritaire?: boolean;
  className?: string;
}

export function LogoNexora({
  taille = 32,
  avecHalo = false,
  avecTexte = false,
  couleurTexte = "text-midnight",
  classeTexte = "text-lg font-bold tracking-tight",
  prioritaire = false,
  className = "",
}: PropsLogoNexora) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="relative inline-block shrink-0"
        style={{ width: taille, height: taille }}
      >
        {avecHalo && (
          <span
            aria-hidden
            className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-sky to-nexora-blue opacity-40 blur-md"
          />
        )}
        <Image
          src="/nexora-officiel.png"
          alt="Nexora"
          width={taille}
          height={taille}
          priority={prioritaire}
          className="relative h-full w-full object-contain"
        />
      </span>
      {avecTexte && (
        <span className={`${classeTexte} ${couleurTexte}`}>Nexora</span>
      )}
    </span>
  );
}
