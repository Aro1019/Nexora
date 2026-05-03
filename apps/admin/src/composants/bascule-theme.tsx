"use client";

/**
 * BasculeTheme — bouton à 3 états (clair / sombre / système)
 * avec animation fluide entre les icônes soleil et lune.
 */
import { useEffect, useRef, useState } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, type Theme } from "./fournisseur-theme";
import { cn } from "@nexora/ui";

const OPTIONS: { valeur: Theme; libelle: string; icone: typeof Sun }[] = [
  { valeur: "clair", libelle: "Clair", icone: Sun },
  { valeur: "sombre", libelle: "Sombre", icone: Moon },
  { valeur: "systeme", libelle: "Système", icone: Monitor },
];

export function BasculeTheme() {
  const { theme, themeResolu, definirTheme } = useTheme();
  const [ouvert, setOuvert] = useState(false);
  const refContainer = useRef<HTMLDivElement>(null);

  /* Fermer le menu au clic extérieur */
  useEffect(() => {
    if (!ouvert) return;
    function gererClicExterieur(e: MouseEvent) {
      if (refContainer.current && !refContainer.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", gererClicExterieur);
    return () => document.removeEventListener("mousedown", gererClicExterieur);
  }, [ouvert]);

  return (
    <div ref={refContainer} className="relative">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        className="group relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        aria-label="Changer le thème"
        title="Changer le thème"
      >
        {/* Icône avec rotation/échange fluide */}
        <div className="relative h-5 w-5">
          <Sun
            className={cn(
              "absolute inset-0 h-5 w-5 transition-all duration-500",
              themeResolu === "clair"
                ? "rotate-0 scale-100 opacity-100"
                : "rotate-90 scale-0 opacity-0"
            )}
          />
          <Moon
            className={cn(
              "absolute inset-0 h-5 w-5 transition-all duration-500",
              themeResolu === "sombre"
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0"
            )}
          />
        </div>
      </button>

      {/* Menu déroulant */}
      {ouvert && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border/60 bg-white/95 dark:bg-card/95 backdrop-blur-xl shadow-xl shadow-midnight/10 p-1.5 z-50 animate-scale-in origin-top-right">
          {OPTIONS.map((option) => {
            const Icone = option.icone;
            const actif = theme === option.valeur;
            return (
              <button
                key={option.valeur}
                type="button"
                onClick={() => {
                  definirTheme(option.valeur);
                  setOuvert(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  actif
                    ? "bg-sky/10 text-sky"
                    : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icone className="h-4 w-4" />
                <span className="flex-1 text-left">{option.libelle}</span>
                {actif && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
