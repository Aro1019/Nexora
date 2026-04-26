"use client";

/**
 * EnTete — barre supérieure du tableau de bord.
 * Affiche le titre de la page, le bouton menu mobile et les actions rapides.
 */
import { BoutonMenuMobile } from "./barre-laterale";
import { Bell } from "lucide-react";

interface PropsEnTete {
  /** Titre affiché dans le header */
  titre: string;
  /** Fonction pour ouvrir la sidebar mobile */
  surOuvrirMenu: () => void;
}

export function EnTete({ titre, surOuvrirMenu }: PropsEnTete) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <BoutonMenuMobile surClick={surOuvrirMenu} />
        <h2 className="text-lg font-semibold text-foreground">{titre}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
