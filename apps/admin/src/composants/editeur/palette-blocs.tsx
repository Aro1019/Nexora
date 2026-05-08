"use client";

/**
 * PaletteBlocs — sidebar gauche listant les blocs disponibles à insérer.
 * Cliquer sur un bloc l'ajoute à la fin du canvas.
 */
import { useState } from "react";
import { Search, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LISTE_BLOCS, type DefinitionBloc } from "./registre";
import type { IdTypeBloc } from "./types";

interface PropsPalette {
  surAjout: (type: IdTypeBloc) => void;
}

const LIBELLES_CATEGORIES: Record<DefinitionBloc["categorie"], string> = {
  section: "Sections",
  base: "Contenu de base",
  media: "Média",
  structure: "Structure",
};

const ORDRE_CATEGORIES: DefinitionBloc["categorie"][] = [
  "section",
  "base",
  "media",
  "structure",
];

export function PaletteBlocs({ surAjout }: PropsPalette) {
  const [recherche, setRecherche] = useState("");
  const [pliee, setPliee] = useState(false);

  const blocsFiltres = LISTE_BLOCS.filter(
    (bloc) =>
      bloc.libelle.toLowerCase().includes(recherche.toLowerCase()) ||
      bloc.description.toLowerCase().includes(recherche.toLowerCase())
  );

  /* Grouper par catégorie */
  const blocsParCategorie = ORDRE_CATEGORIES.map((cat) => ({
    categorie: cat,
    blocs: blocsFiltres.filter((b) => b.categorie === cat),
  })).filter((g) => g.blocs.length > 0);

  /* ── Mode plié : barre fine avec icônes des blocs ── */
  if (pliee) {
    return (
      <aside className="w-12 shrink-0 border-r border-border/40 bg-card/40 backdrop-blur-sm flex flex-col h-full">
        <div className="flex justify-center py-2 border-b border-border/40">
          <button
            type="button"
            onClick={() => setPliee(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Afficher les blocs"
            aria-label="Afficher les blocs"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 space-y-3">
          {blocsParCategorie.map(({ categorie, blocs }) => (
            <div key={categorie} className="flex flex-col items-center gap-1">
              {blocs.map((bloc) => {
                const Icone = bloc.icone;
                return (
                  <button
                    key={bloc.id}
                    type="button"
                    onClick={() => surAjout(bloc.id)}
                    className="group flex h-9 w-9 items-center justify-center rounded-lg bg-sky/10 text-sky hover:bg-sky hover:text-white transition-colors"
                    title={`${bloc.libelle} — ${bloc.description}`}
                    aria-label={`Ajouter ${bloc.libelle}`}
                  >
                    <Icone className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 shrink-0 border-r border-border/40 bg-card/40 backdrop-blur-sm flex flex-col h-full">
      {/* En-tête */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Blocs</h3>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              Cliquez pour ajouter un bloc
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPliee(true)}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Masquer les blocs"
            aria-label="Masquer les blocs"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Recherche */}
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un bloc…"
            className="w-full rounded-lg border border-input bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {blocsParCategorie.map(({ categorie, blocs }) => (
          <div key={categorie}>
            <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {LIBELLES_CATEGORIES[categorie]}
            </p>
            <div className="space-y-1">
              {blocs.map((bloc) => {
                const Icone = bloc.icone;
                return (
                  <button
                    key={bloc.id}
                    type="button"
                    onClick={() => surAjout(bloc.id)}
                    className="group w-full flex items-start gap-3 rounded-lg border border-transparent hover:border-sky/30 hover:bg-sky/5 px-2.5 py-2 text-left transition-all"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky group-hover:bg-sky group-hover:text-white transition-colors">
                      <Icone className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        {bloc.libelle}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 leading-tight mt-0.5 line-clamp-2">
                        {bloc.description}
                      </p>
                    </div>
                    <Plus className="mt-1 h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-sky shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {blocsFiltres.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground/60">Aucun bloc trouvé</p>
          </div>
        )}
      </div>
    </aside>
  );
}
