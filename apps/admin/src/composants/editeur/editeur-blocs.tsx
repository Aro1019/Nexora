"use client";

/**
 * EditeurBlocs — composant principal qui orchestre la palette,
 * le canvas et le panneau de propriétés.
 * Gère l'état du contenu (tableau de blocs), l'historique annuler/rétablir
 * et les actions sur les blocs.
 */
import { useCallback, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { Monitor, Tablet, Smartphone, Undo2, Redo2 } from "lucide-react";
import { cn } from "@nexora/ui";
import type { Bloc, ContenuPage, IdTypeBloc } from "./types";
import { obtenirDefinition } from "./registre";
import { PaletteBlocs } from "./palette-blocs";
import { CanvasEditeur } from "./canvas-editeur";
import { PanneauProprietes } from "./panneau-proprietes";

interface PropsEditeur {
  contenuInitial: ContenuPage;
  surChangement: (contenu: ContenuPage) => void;
}

type LargeurApercu = "bureau" | "tablette" | "mobile";

/** Profondeur maximale de l'historique annuler/rétablir */
const MAX_HISTORIQUE = 50;

export function EditeurBlocs({ contenuInitial, surChangement }: PropsEditeur) {
  const [blocs, setBlocs] = useState<ContenuPage>(contenuInitial);
  const [idSelectionne, setIdSelectionne] = useState<string | null>(null);
  const [largeurApercu, setLargeurApercu] = useState<LargeurApercu>("bureau");

  /* Historique pour annuler / rétablir */
  const [passe, setPasse] = useState<ContenuPage[]>([]);
  const [futur, setFutur] = useState<ContenuPage[]>([]);

  /** Met à jour les blocs, empile l'ancien état dans l'historique et notifie le parent */
  const mettreAJour = useCallback(
    (nouveaux: ContenuPage) => {
      setPasse((p) => [...p.slice(-MAX_HISTORIQUE + 1), blocs]);
      setFutur([]);
      setBlocs(nouveaux);
      surChangement(nouveaux);
    },
    [blocs, surChangement]
  );

  /** Annuler la dernière action */
  const annuler = useCallback(() => {
    if (passe.length === 0) return;
    const precedent = passe[passe.length - 1];
    setFutur((f) => [blocs, ...f].slice(0, MAX_HISTORIQUE));
    setPasse((p) => p.slice(0, -1));
    setBlocs(precedent);
    surChangement(precedent);
  }, [passe, blocs, surChangement]);

  /** Rétablir l'action annulée */
  const retablir = useCallback(() => {
    if (futur.length === 0) return;
    const suivant = futur[0];
    setPasse((p) => [...p.slice(-MAX_HISTORIQUE + 1), blocs]);
    setFutur((f) => f.slice(1));
    setBlocs(suivant);
    surChangement(suivant);
  }, [futur, blocs, surChangement]);

  /* Raccourcis clavier Ctrl+Z / Ctrl+Shift+Z (ou Ctrl+Y) */
  useEffect(() => {
    function gererToucheClavier(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null;
      if (
        cible &&
        (cible.tagName === "INPUT" ||
          cible.tagName === "TEXTAREA" ||
          cible.isContentEditable)
      ) {
        return;
      }
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        annuler();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        retablir();
      }
    }
    window.addEventListener("keydown", gererToucheClavier);
    return () => window.removeEventListener("keydown", gererToucheClavier);
  }, [annuler, retablir]);

  /** Construit un nouveau bloc à partir d'un type */
  function creerBloc(type: IdTypeBloc): Bloc | null {
    const definition = obtenirDefinition(type);
    if (!definition) return null;
    return {
      id: nanoid(10),
      type,
      proprietes: { ...definition.proprietesParDefaut },
    };
  }

  /** Ajoute un nouveau bloc à la fin */
  function gererAjout(type: IdTypeBloc) {
    const nouveauBloc = creerBloc(type);
    if (!nouveauBloc) return;
    mettreAJour([...blocs, nouveauBloc]);
    setIdSelectionne(nouveauBloc.id);
  }

  /** Insère un bloc à une position précise (entre les blocs) */
  function gererInsertion(index: number, type: IdTypeBloc) {
    const nouveauBloc = creerBloc(type);
    if (!nouveauBloc) return;
    const i = Math.max(0, Math.min(index, blocs.length));
    mettreAJour([...blocs.slice(0, i), nouveauBloc, ...blocs.slice(i)]);
    setIdSelectionne(nouveauBloc.id);
  }

  /** Modifie les propriétés du bloc sélectionné */
  function gererChangementProprietes(proprietes: Record<string, unknown>) {
    if (!idSelectionne) return;
    const nouveaux = blocs.map((b) =>
      b.id === idSelectionne ? { ...b, proprietes } : b
    );
    mettreAJour(nouveaux);
  }

  /** Modifie les propriétés d'un bloc spécifique (édition inline) */
  function gererEditionInline(id: string, proprietes: Record<string, unknown>) {
    const nouveaux = blocs.map((b) => (b.id === id ? { ...b, proprietes } : b));
    mettreAJour(nouveaux);
  }

  /** Supprime un bloc */
  function gererSuppression(id: string) {
    const nouveaux = blocs.filter((b) => b.id !== id);
    mettreAJour(nouveaux);
    if (idSelectionne === id) setIdSelectionne(null);
  }

  /** Duplique un bloc juste après l'original */
  function gererDuplication(id: string) {
    const index = blocs.findIndex((b) => b.id === id);
    if (index === -1) return;
    const original = blocs[index];
    const copie: Bloc = {
      id: nanoid(10),
      type: original.type,
      proprietes: { ...original.proprietes },
    };
    const nouveaux = [...blocs.slice(0, index + 1), copie, ...blocs.slice(index + 1)];
    mettreAJour(nouveaux);
    setIdSelectionne(copie.id);
  }

  const blocSelectionne = blocs.find((b) => b.id === idSelectionne) ?? null;
  const peutAnnuler = passe.length > 0;
  const peutRetablir = futur.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] min-h-[600px] rounded-2xl border border-border/40 overflow-hidden bg-background">
      {/* ── Barre d'outils ── */}
      <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-card/40 backdrop-blur-sm px-4 py-2">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground/70">
            {blocs.length} bloc{blocs.length > 1 ? "s" : ""}
          </p>

          {/* Annuler / Rétablir */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
            <button
              type="button"
              onClick={annuler}
              disabled={!peutAnnuler}
              className={cn(
                "flex items-center justify-center rounded-md p-1.5 transition-colors",
                peutAnnuler
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  : "text-muted-foreground/30 cursor-not-allowed"
              )}
              title="Annuler (Ctrl+Z)"
              aria-label="Annuler"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={retablir}
              disabled={!peutRetablir}
              className={cn(
                "flex items-center justify-center rounded-md p-1.5 transition-colors",
                peutRetablir
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  : "text-muted-foreground/30 cursor-not-allowed"
              )}
              title="Rétablir (Ctrl+Maj+Z)"
              aria-label="Rétablir"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Sélecteur de largeur d'aperçu */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
          {(
            [
              { valeur: "bureau", icone: Monitor, libelle: "Bureau" },
              { valeur: "tablette", icone: Tablet, libelle: "Tablette" },
              { valeur: "mobile", icone: Smartphone, libelle: "Mobile" },
            ] as const
          ).map((option) => {
            const Icone = option.icone;
            const actif = largeurApercu === option.valeur;
            return (
              <button
                key={option.valeur}
                type="button"
                onClick={() => setLargeurApercu(option.valeur)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  actif
                    ? "bg-sky text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={option.libelle}
              >
                <Icone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{option.libelle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Layout 3 colonnes ── */}
      <div className="flex flex-1 overflow-hidden">
        <PaletteBlocs surAjout={gererAjout} />
        <CanvasEditeur
          blocs={blocs}
          idSelectionne={idSelectionne}
          largeurApercu={largeurApercu}
          surReordonner={mettreAJour}
          surSelection={setIdSelectionne}
          surSuppression={gererSuppression}
          surDuplication={gererDuplication}
          surInsertion={gererInsertion}
          surEditionInline={gererEditionInline}
        />
        <PanneauProprietes
          bloc={blocSelectionne}
          surChangement={gererChangementProprietes}
          surSuppression={() => idSelectionne && gererSuppression(idSelectionne)}
        />
      </div>
    </div>
  );
}
