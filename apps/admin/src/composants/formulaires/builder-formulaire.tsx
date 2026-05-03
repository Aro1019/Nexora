"use client";

/**
 * Builder de formulaire — édition de la définition d'un formulaire.
 * Utilisé pour création et modification.
 */
import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Mail,
  Type,
  AlignLeft,
  Hash,
  Link as LinkIcon,
  CheckSquare,
  ListChecks,
  Phone,
} from "lucide-react";
import { cn } from "@nexora/ui";

/** Types de champs supportés */
export type TypeChamp =
  | "texte"
  | "email"
  | "telephone"
  | "zone-texte"
  | "nombre"
  | "url"
  | "case-a-cocher"
  | "selection";

/** Définition d'un champ tel que stocké */
export interface ChampFormulaire {
  id: string;
  type: TypeChamp;
  libelle: string;
  nom: string;
  placeholder?: string;
  obligatoire: boolean;
  options?: string[];
}

/** Catalogue affiché dans la palette */
const CATALOGUE: Array<{
  type: TypeChamp;
  libelle: string;
  icone: React.ComponentType<{ className?: string }>;
}> = [
  { type: "texte", libelle: "Texte court", icone: Type },
  { type: "email", libelle: "E-mail", icone: Mail },
  { type: "telephone", libelle: "Téléphone", icone: Phone },
  { type: "zone-texte", libelle: "Zone de texte", icone: AlignLeft },
  { type: "nombre", libelle: "Nombre", icone: Hash },
  { type: "url", libelle: "URL", icone: LinkIcon },
  { type: "case-a-cocher", libelle: "Case à cocher", icone: CheckSquare },
  { type: "selection", libelle: "Liste déroulante", icone: ListChecks },
];

/** Génère un identifiant court */
function genererId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Convertit un libellé en nom technique (snake_case) */
function libelleVersNom(libelle: string): string {
  return libelle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50)
    .replace(/^[0-9]/, "_$&");
}

/** Données du formulaire édité */
export interface ValeurBuilder {
  nom: string;
  slug: string;
  champs: ChampFormulaire[];
  libelleEnvoi: string;
  messageSucces: string;
  emailNotification: string;
}

export function BuilderFormulaire({
  valeur,
  surChangement,
}: {
  valeur: ValeurBuilder;
  surChangement: (v: ValeurBuilder) => void;
}) {
  const [champSelectionne, setChampSelectionne] = useState<string | null>(null);

  function ajouterChamp(type: TypeChamp) {
    const def = CATALOGUE.find((c) => c.type === type)!;
    const nouveau: ChampFormulaire = {
      id: genererId(),
      type,
      libelle: def.libelle,
      nom: libelleVersNom(def.libelle) + "_" + genererId().slice(0, 4),
      obligatoire: false,
      placeholder: "",
      options: type === "selection" ? ["Option 1", "Option 2"] : undefined,
    };
    surChangement({ ...valeur, champs: [...valeur.champs, nouveau] });
    setChampSelectionne(nouveau.id);
  }

  function modifierChamp(id: string, partiel: Partial<ChampFormulaire>) {
    surChangement({
      ...valeur,
      champs: valeur.champs.map((c) => (c.id === id ? { ...c, ...partiel } : c)),
    });
  }

  function supprimerChamp(id: string) {
    surChangement({
      ...valeur,
      champs: valeur.champs.filter((c) => c.id !== id),
    });
    if (champSelectionne === id) setChampSelectionne(null);
  }

  function deplacer(index: number, delta: -1 | 1) {
    const nouveau = [...valeur.champs];
    const cible = index + delta;
    if (cible < 0 || cible >= nouveau.length) return;
    [nouveau[index], nouveau[cible]] = [nouveau[cible], nouveau[index]];
    surChangement({ ...valeur, champs: nouveau });
  }

  const champ = valeur.champs.find((c) => c.id === champSelectionne) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr_320px]">
      {/* Palette */}
      <aside className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Ajouter un champ
        </h3>
        {CATALOGUE.map((c) => {
          const Icone = c.icone;
          return (
            <button
              key={c.type}
              type="button"
              onClick={() => ajouterChamp(c.type)}
              className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Icone className="h-4 w-4 text-muted-foreground" />
              {c.libelle}
            </button>
          );
        })}
      </aside>

      {/* Aperçu / liste des champs */}
      <section className="rounded-lg border border-border bg-background p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Aperçu du formulaire
        </h3>

        {valeur.champs.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Ajoutez un champ depuis la palette à gauche.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {valeur.champs.map((c, index) => (
              <div
                key={c.id}
                onClick={() => setChampSelectionne(c.id)}
                className={cn(
                  "group cursor-pointer rounded-lg border bg-card p-4 transition-all",
                  champSelectionne === c.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <ApercuChamp champ={c} />
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deplacer(index, -1);
                      }}
                      disabled={index === 0}
                      className="rounded p-1 hover:bg-muted disabled:opacity-30"
                      aria-label="Monter"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deplacer(index, 1);
                      }}
                      disabled={index === valeur.champs.length - 1}
                      className="rounded p-1 hover:bg-muted disabled:opacity-30"
                      aria-label="Descendre"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        supprimerChamp(c.id);
                      }}
                      className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aperçu du bouton */}
        <div className="mt-6">
          <button
            type="button"
            disabled
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {valeur.libelleEnvoi || "Envoyer"}
          </button>
        </div>
      </section>

      {/* Panneau propriétés */}
      <aside className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {champ ? "Propriétés du champ" : "Réglages du formulaire"}
        </h3>

        {champ ? (
          <ProprietesChamp
            champ={champ}
            surChangement={(p) => modifierChamp(champ.id, p)}
          />
        ) : (
          <ReglagesFormulaire valeur={valeur} surChangement={surChangement} />
        )}
      </aside>
    </div>
  );
}

/* ─────────────────────────── Sous-composants ─────────────────────────── */

function ApercuChamp({ champ }: { champ: ChampFormulaire }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {champ.libelle}
        {champ.obligatoire && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {champ.type === "zone-texte" ? (
        <textarea
          disabled
          placeholder={champ.placeholder}
          className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm"
          rows={3}
        />
      ) : champ.type === "case-a-cocher" ? (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" disabled />
          {champ.placeholder || "Cochez la case"}
        </label>
      ) : champ.type === "selection" ? (
        <select disabled className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
          {(champ.options ?? []).map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={
            champ.type === "email"
              ? "email"
              : champ.type === "nombre"
                ? "number"
                : champ.type === "url"
                  ? "url"
                  : champ.type === "telephone"
                    ? "tel"
                    : "text"
          }
          disabled
          placeholder={champ.placeholder}
          className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm"
        />
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        Type : <code className="bg-muted/50 px-1 rounded">{champ.type}</code> ·
        Nom : <code className="bg-muted/50 px-1 rounded">{champ.nom}</code>
      </p>
    </div>
  );
}

function ProprietesChamp({
  champ,
  surChangement,
}: {
  champ: ChampFormulaire;
  surChangement: (p: Partial<ChampFormulaire>) => void;
}) {
  return (
    <div className="space-y-3">
      <Champ
        libelle="Libellé"
        valeur={champ.libelle}
        surChangement={(v) =>
          surChangement({
            libelle: v,
            /* Auto-régénérer le nom technique tant qu'il dérive du libellé */
            nom: libelleVersNom(v) || champ.nom,
          })
        }
      />
      <Champ
        libelle="Nom technique"
        valeur={champ.nom}
        surChangement={(v) => surChangement({ nom: libelleVersNom(v) })}
      />
      <Champ
        libelle="Texte indicatif (placeholder)"
        valeur={champ.placeholder ?? ""}
        surChangement={(v) => surChangement({ placeholder: v })}
      />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={champ.obligatoire}
          onChange={(e) => surChangement({ obligatoire: e.target.checked })}
        />
        Champ obligatoire
      </label>

      {champ.type === "selection" && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Options (une par ligne)
          </label>
          <textarea
            value={(champ.options ?? []).join("\n")}
            onChange={(e) =>
              surChangement({
                options: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      )}
    </div>
  );
}

function ReglagesFormulaire({
  valeur,
  surChangement,
}: {
  valeur: ValeurBuilder;
  surChangement: (v: ValeurBuilder) => void;
}) {
  return (
    <div className="space-y-3">
      <Champ
        libelle="Texte du bouton d'envoi"
        valeur={valeur.libelleEnvoi}
        surChangement={(v) => surChangement({ ...valeur, libelleEnvoi: v })}
      />
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Message de succès
        </label>
        <textarea
          value={valeur.messageSucces}
          onChange={(e) =>
            surChangement({ ...valeur, messageSucces: e.target.value })
          }
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <Champ
        libelle="E-mail de notification (facultatif)"
        valeur={valeur.emailNotification}
        surChangement={(v) =>
          surChangement({ ...valeur, emailNotification: v })
        }
        type="email"
      />
      <p className="text-xs text-muted-foreground">
        Sélectionnez un champ dans l&apos;aperçu pour le modifier.
      </p>
    </div>
  );
}

function Champ({
  libelle,
  valeur,
  surChangement,
  type = "text",
}: {
  libelle: string;
  valeur: string;
  surChangement: (v: string) => void;
  type?: "text" | "email";
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {libelle}
      </label>
      <input
        type={type}
        value={valeur}
        onChange={(e) => surChangement(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
