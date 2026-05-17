"use client";

/**
 * SplashBienvenue — écran de bienvenue plein écran joué après
 * une connexion ou inscription réussie.
 *
 * Affiche le logo Nexora animé, le nom de la plateforme, un message
 * personnalisé puis redirige automatiquement vers la destination.
 */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { clientAuth } from "@nexora/auth";

const DUREE_TOTALE_MS = 1400;
const DESTINATION_PAR_DEFAUT = "/tableau-de-bord";

export function SplashBienvenue() {
  const routeur = useRouter();
  const parametres = useSearchParams();
  const suivant = parametres.get("suivant") || DESTINATION_PAR_DEFAUT;

  const [prenom, setPrenom] = useState<string | null>(null);

  // Récupère le prénom depuis la session pour personnaliser le message
  useEffect(() => {
    let actif = true;
    clientAuth
      .getSession()
      .then((res) => {
        if (!actif) return;
        const nom = res?.data?.user?.name;
        if (nom) setPrenom(nom.split(" ")[0]);
      })
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, []);

  // Redirection automatique après l'animation
  useEffect(() => {
    const minuteur = window.setTimeout(() => {
      routeur.replace(suivant);
    }, DUREE_TOTALE_MS);
    return () => window.clearTimeout(minuteur);
  }, [routeur, suivant]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden animate-splash-fade-out">
      {/* Fond gradient statique */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #06182E 0%, #0D2B4A 50%, #185FA5 100%)",
        }}
      />

      {/* Une seule orbe lumineuse légère */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-nexora-blue/30 blur-[80px]" aria-hidden />

      {/* ── Contenu central ── */}
      <div className="relative flex flex-col items-center text-center px-6">
        {/* Logo + halo léger */}
        <div className="relative mb-8">
          {/* Un seul anneau pulsant */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-sky/40 animate-splash-ring"
          />

          {/* Halo lumineux derrière le logo (statique) */}
          <span
            aria-hidden
            className="absolute -inset-6 rounded-full bg-gradient-to-br from-sky via-nexora-blue to-teal opacity-40 blur-2xl"
          />

          {/* Logo */}
          <div className="relative animate-splash-logo">
            <Image
              src="/nexora-officiel.png"
              alt="Nexora"
              width={140}
              height={140}
              priority
              className="h-32 w-32 md:h-36 md:w-36 object-contain drop-shadow-[0_0_30px_rgba(55,138,221,0.6)]"
            />
          </div>
        </div>

        {/* Nom de la plateforme */}
        <h1
          className="text-5xl md:text-6xl font-bold text-white tracking-tight animate-splash-text"
          style={{ textShadow: "0 4px 30px rgba(55, 138, 221, 0.4)" }}
        >
          Nexora
        </h1>

        {/* Message personnalisé */}
        <p className="mt-4 text-lg md:text-xl text-frost/90 font-light animate-splash-tagline">
          {prenom ? (
            <>
              Bienvenue,{" "}
              <span className="font-semibold bg-gradient-to-r from-frost via-white to-teal bg-clip-text text-transparent">
                {prenom}
              </span>
            </>
          ) : (
            "Bienvenue sur votre plateforme"
          )}
        </p>

        <p
          className="mt-2 text-sm text-frost/60 animate-splash-tagline"
          style={{ animationDelay: "1.4s" }}
        >
          Préparation de votre espace de travail…
        </p>

        {/* Barre de progression */}
        <div className="mt-10 h-1 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full origin-left bg-gradient-to-r from-sky via-nexora-blue to-teal animate-splash-progress" />
        </div>
      </div>
    </div>
  );
}
