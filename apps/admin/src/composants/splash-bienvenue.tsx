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

const DUREE_TOTALE_MS = 2900;
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
      routeur.refresh();
    }, DUREE_TOTALE_MS);
    return () => window.clearTimeout(minuteur);
  }, [routeur, suivant]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden animate-splash-fade-out">
      {/* Fond gradient animé */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background:
            "linear-gradient(135deg, #06182E 0%, #0D2B4A 25%, #185FA5 50%, #0D2B4A 75%, #06182E 100%)",
          backgroundSize: "400% 400%",
        }}
      />

      {/* Bruit subtil */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      {/* Orbes lumineuses */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-nexora-blue/30 blur-[100px] animate-glow-pulse" aria-hidden />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-sky/25 blur-[80px] animate-glow-pulse"
        style={{ animationDelay: "1s" }}
        aria-hidden
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-teal/20 blur-[60px] animate-glow-pulse"
        style={{ animationDelay: "2s" }}
        aria-hidden
      />

      {/* Lignes orbitales */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden>
        <div className="w-[500px] h-[500px] rounded-full border border-white/[0.05] animate-orbit" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden>
        <div className="w-[700px] h-[700px] rounded-full border border-white/[0.03] animate-orbit-reverse" />
      </div>

      {/* ── Contenu central ── */}
      <div className="relative flex flex-col items-center text-center px-6">
        {/* Logo + halos animés */}
        <div className="relative mb-8">
          {/* Anneaux concentriques pulsants */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-sky/40 animate-splash-ring"
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-teal/30 animate-splash-ring"
            style={{ animationDelay: "0.6s" }}
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border border-frost/40 animate-splash-ring"
            style={{ animationDelay: "1.2s" }}
          />

          {/* Halo lumineux derrière le logo */}
          <span
            aria-hidden
            className="absolute -inset-6 rounded-full bg-gradient-to-br from-sky via-nexora-blue to-teal opacity-50 blur-2xl animate-glow-pulse"
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
