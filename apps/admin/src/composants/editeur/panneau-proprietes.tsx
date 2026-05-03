"use client";

/**
 * PanneauProprietes — sidebar droite pour éditer les propriétés du bloc sélectionné.
 */
import { Settings2, Trash2 } from "lucide-react";
import type { Bloc } from "./types";
import { obtenirDefinition } from "./registre";

interface PropsPanneau {
  bloc: Bloc | null;
  surChangement: (proprietes: Record<string, unknown>) => void;
  surSuppression: () => void;
}

export function PanneauProprietes({
  bloc,
  surChangement,
  surSuppression,
}: PropsPanneau) {
  if (!bloc) {
    return (
      <aside className="w-72 shrink-0 border-l border-border/40 bg-card/40 backdrop-blur-sm flex flex-col h-full">
        <div className="p-4 border-b border-border/40">
          <h3 className="text-sm font-semibold text-foreground">Propriétés</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <Settings2 className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground/70 max-w-[200px]">
              Sélectionnez un bloc dans le canvas pour modifier ses propriétés
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const definition = obtenirDefinition(bloc.type);
  if (!definition) {
    return null;
  }

  const Edition = definition.Edition;
  const Icone = definition.icone;

  return (
    <aside className="w-72 shrink-0 border-l border-border/40 bg-card/40 backdrop-blur-sm flex flex-col h-full">
      {/* En-tête */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky/10 text-sky">
            <Icone className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {definition.libelle}
            </p>
            <p className="text-[11px] text-muted-foreground/70 leading-tight">
              {definition.description}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire d'édition */}
      <div className="flex-1 overflow-y-auto p-4">
        <Edition bloc={bloc} surChangement={surChangement} />
      </div>

      {/* Footer — supprimer */}
      <div className="border-t border-border/40 p-3">
        <button
          type="button"
          onClick={surSuppression}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Supprimer le bloc
        </button>
      </div>
    </aside>
  );
}
