"use client";

/**
 * CanvasEditeur — zone centrale qui rend les blocs avec drag & drop.
 * Utilise @dnd-kit/sortable pour la réorganisation et expose des
 * « inserteurs + » entre les blocs pour ajouter à une position précise.
 */
import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Copy, Plus, Layers } from "lucide-react";
import type { Bloc, IdTypeBloc } from "./types";
import { LISTE_BLOCS, obtenirDefinition, type DefinitionBloc } from "./registre";

interface PropsCanvas {
  blocs: Bloc[];
  idSelectionne: string | null;
  largeurApercu: "bureau" | "tablette" | "mobile";
  surReordonner: (blocs: Bloc[]) => void;
  surSelection: (id: string | null) => void;
  surSuppression: (id: string) => void;
  surDuplication: (id: string) => void;
  surInsertion: (index: number, type: IdTypeBloc) => void;
  surEditionInline: (id: string, proprietes: Record<string, unknown>) => void;
}

const LARGEURS_APERCU: Record<PropsCanvas["largeurApercu"], string> = {
  bureau: "max-w-5xl",
  tablette: "max-w-2xl",
  mobile: "max-w-sm",
};

const LIBELLES_CATEGORIES: Record<DefinitionBloc["categorie"], string> = {
  section: "Sections",
  base: "Base",
  media: "Média",
  structure: "Structure",
};

const ORDRE_CATEGORIES: DefinitionBloc["categorie"][] = [
  "section",
  "base",
  "media",
  "structure",
];

export function CanvasEditeur({
  blocs,
  idSelectionne,
  largeurApercu,
  surReordonner,
  surSelection,
  surSuppression,
  surDuplication,
  surInsertion,
  surEditionInline,
}: PropsCanvas) {
  const capteurs = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function gererFinDrag(evenement: DragEndEvent) {
    const { active, over } = evenement;
    if (!over || active.id === over.id) return;

    const indexAncien = blocs.findIndex((b) => b.id === active.id);
    const indexNouveau = blocs.findIndex((b) => b.id === over.id);
    if (indexAncien === -1 || indexNouveau === -1) return;

    surReordonner(arrayMove(blocs, indexAncien, indexNouveau));
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background/40">
      <div className="min-h-full p-6 sm:p-10">
        <div className={`mx-auto ${LARGEURS_APERCU[largeurApercu]} transition-all duration-300`}>
          {/* Carte canvas */}
          <div
            className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden"
            onClick={() => surSelection(null)}
          >
            {blocs.length === 0 ? (
              <EtatVide />
            ) : (
              <DndContext
                sensors={capteurs}
                collisionDetection={closestCenter}
                onDragEnd={gererFinDrag}
              >
                <SortableContext items={blocs.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="p-6 sm:p-10">
                    {/* Inserteur tout en haut */}
                    <InserteurBloc
                      onInserer={(type) => surInsertion(0, type)}
                    />

                    {blocs.map((bloc, index) => (
                      <div key={bloc.id}>
                        <BlocTriable
                          bloc={bloc}
                          selectionne={bloc.id === idSelectionne}
                          surSelection={(e) => {
                            e.stopPropagation();
                            surSelection(bloc.id);
                          }}
                          surSuppression={() => surSuppression(bloc.id)}
                          surDuplication={() => surDuplication(bloc.id)}
                          surEditionInline={(props) =>
                            surEditionInline(bloc.id, props)
                          }
                        />
                        {/* Inserteur entre chaque bloc et après le dernier */}
                        <InserteurBloc
                          onInserer={(type) => surInsertion(index + 1, type)}
                        />
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Hint sous le canvas */}
          {blocs.length > 0 && (
            <p className="mt-4 text-center text-xs text-muted-foreground/50">
              Cliquez sur un bloc pour le modifier · Glissez la poignée pour réorganiser
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// INSERTEUR ENTRE BLOCS
// ============================================
function InserteurBloc({
  onInserer,
}: {
  onInserer: (type: IdTypeBloc) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const referencePopover = useRef<HTMLDivElement | null>(null);

  /* Fermer au clic extérieur ou Échap */
  useEffect(() => {
    if (!ouvert) return;
    function gererClicExterieur(e: MouseEvent) {
      if (
        referencePopover.current &&
        !referencePopover.current.contains(e.target as Node)
      ) {
        setOuvert(false);
      }
    }
    function gererEchap(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", gererClicExterieur);
    document.addEventListener("keydown", gererEchap);
    return () => {
      document.removeEventListener("mousedown", gererClicExterieur);
      document.removeEventListener("keydown", gererEchap);
    };
  }, [ouvert]);

  const blocsParCategorie = ORDRE_CATEGORIES.map((cat) => ({
    categorie: cat,
    blocs: LISTE_BLOCS.filter((b) => b.categorie === cat),
  })).filter((g) => g.blocs.length > 0);

  return (
    <div
      className="relative group/inserteur h-2 my-1"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Ligne fine au survol */}
      <div
        className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-sky/40 transition-opacity ${
          ouvert ? "opacity-100" : "opacity-0 group-hover/inserteur:opacity-100"
        }`}
      />

      {/* Bouton + centré */}
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-sky text-white shadow-md transition-all ${
          ouvert
            ? "opacity-100 scale-100"
            : "opacity-0 scale-75 group-hover/inserteur:opacity-100 group-hover/inserteur:scale-100"
        }`}
        title="Insérer un bloc ici"
        aria-label="Insérer un bloc ici"
      >
        <Plus className="h-3 w-3" />
      </button>

      {/* Popover */}
      {ouvert && (
        <div
          ref={referencePopover}
          className="absolute left-1/2 top-full -translate-x-1/2 mt-1 z-30 w-72 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl p-2"
        >
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Insérer un bloc
          </p>
          {blocsParCategorie.map(({ categorie, blocs }) => (
            <div key={categorie} className="mt-1">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                {LIBELLES_CATEGORIES[categorie]}
              </p>
              <div className="space-y-0.5">
                {blocs.map((b) => {
                  const Icone = b.icone;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        onInserer(b.id);
                        setOuvert(false);
                      }}
                      className="w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-sky/10 transition-colors"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky/10 text-sky">
                        <Icone className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {b.libelle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// BLOC TRIABLE
// ============================================
interface PropsBlocTriable {
  bloc: Bloc;
  selectionne: boolean;
  surSelection: (e: React.MouseEvent) => void;
  surSuppression: () => void;
  surDuplication: () => void;
  surEditionInline: (proprietes: Record<string, unknown>) => void;
}

function BlocTriable({
  bloc,
  selectionne,
  surSelection,
  surSuppression,
  surDuplication,
  surEditionInline,
}: PropsBlocTriable) {
  const definition = obtenirDefinition(bloc.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bloc.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (!definition) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Bloc inconnu : {bloc.type}
      </div>
    );
  }

  const Rendu = definition.Rendu;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={surSelection}
      className={`group relative rounded-lg transition-all ${
        selectionne
          ? "ring-2 ring-sky shadow-lg shadow-sky/10"
          : "ring-1 ring-transparent hover:ring-sky/30"
      }`}
    >
      {/* Barre d'actions au survol/sélection */}
      <div
        className={`absolute -top-3 right-2 z-10 flex items-center gap-1 rounded-lg border border-border/60 bg-card px-1 py-0.5 shadow-md transition-opacity ${
          selectionne ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Glisser pour réorganiser"
          aria-label="Réorganiser"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="text-[10px] font-medium text-muted-foreground px-1">
          {definition.libelle}
        </span>
        <div className="w-px h-4 bg-border" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            surDuplication();
          }}
          className="p-1 text-muted-foreground hover:text-sky transition-colors"
          title="Dupliquer"
          aria-label="Dupliquer"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            surSuppression();
          }}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          title="Supprimer"
          aria-label="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Contenu du bloc — l'édition inline n'est activée que pour le bloc sélectionné
          afin d'éviter les contentEditable concurrents */}
      <div className={`p-3 cursor-pointer ${selectionne ? "bg-sky/[0.02]" : ""}`}>
        <Rendu
          bloc={bloc}
          enEdition
          surEditionInline={selectionne ? surEditionInline : undefined}
        />
      </div>
    </div>
  );
}

// ============================================
// ÉTAT VIDE
// ============================================
function EtatVide() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky/10 to-nexora-blue/10 border border-sky/20">
          <Layers className="h-8 w-8 text-sky" />
        </div>
        <div className="absolute -inset-2 rounded-2xl bg-sky/10 blur-xl opacity-50" />
      </div>
      <h3 className="mt-6 text-base font-semibold text-foreground">Page vierge</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Commencez par ajouter un bloc depuis la palette de gauche.
        Construisez votre page en mélangeant titres, textes, images et plus encore.
      </p>
      <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
        <Plus className="h-3 w-3" />
        Ajoutez votre premier bloc
      </div>
    </div>
  );
}
