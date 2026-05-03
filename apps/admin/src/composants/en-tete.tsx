"use client";

/**
 * EnTete — barre supérieure du tableau de bord.
 * Design glassmorphism avec barre de recherche/commandes,
 * notifications animées et indicateurs visuels.
 */
import { useEffect, useState } from "react";
import { BoutonMenuMobile } from "./barre-laterale";
import { BasculeTheme } from "./bascule-theme";
import { Bell, Search, Sparkles } from "lucide-react";

interface PropsEnTete {
  titre: string;
  surOuvrirMenu: () => void;
}

export function EnTete({ titre, surOuvrirMenu }: PropsEnTete) {
  const [scrollee, setScrollee] = useState(false);

  /** Détecte le scroll pour ajouter une ombre subtile */
  useEffect(() => {
    function gererScroll() {
      setScrollee(window.scrollY > 4);
    }
    window.addEventListener("scroll", gererScroll, { passive: true });
    return () => window.removeEventListener("scroll", gererScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/40 bg-white/70 dark:bg-card/70 backdrop-blur-xl px-4 sm:px-6 transition-shadow duration-300 ${
        scrollee ? "shadow-sm" : ""
      }`}
    >
      {/* Bord lumineux subtil en bas */}
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-sky/20 to-transparent" />

      {/* ── Section gauche : menu mobile + titre ── */}
      <div className="flex items-center gap-3 min-w-0">
        <BoutonMenuMobile surClick={surOuvrirMenu} />
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-sky shrink-0 hidden sm:block" />
          <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
            {titre}
          </h2>
        </div>
      </div>

      {/* ── Section centre : barre de recherche (desktop) ── */}
      <div className="hidden md:flex flex-1 max-w-md mx-auto">
        <button
          type="button"
          className="group flex items-center gap-2.5 w-full rounded-xl border border-border/60 bg-white/60 dark:bg-muted/30 hover:bg-white dark:hover:bg-muted/50 hover:border-sky/30 px-3.5 py-2 text-sm text-muted-foreground transition-all duration-300"
        >
          <Search className="h-4 w-4 text-muted-foreground/60 group-hover:text-sky transition-colors" />
          <span className="flex-1 text-left">Rechercher ou exécuter…</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Section droite : actions ── */}
      <div className="flex items-center gap-1.5">
        {/* Recherche mobile */}
        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          aria-label="Rechercher"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Bascule de thème */}
        <BasculeTheme />

        {/* Notifications avec badge animé */}
        <button
          type="button"
          className="group relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 group-hover:animate-[wiggle_0.5s_ease-in-out]" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-teal opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
          </span>
        </button>

        {/* Séparateur */}
        <div className="hidden sm:block h-6 w-px bg-border/60 mx-1" />

        {/* Indicateur de statut */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-teal opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal" />
          </span>
          <span className="text-xs font-medium text-teal">En ligne</span>
        </div>
      </div>
    </header>
  );
}
