"use client";

/**
 * Panneaux de personnalisation visuelle des emplacements de navigation.
 * Permet de configurer l'apparence de l'en-tête et du pied de page :
 * couleurs, position, sticky, CTA, colonnes, newsletter, etc.
 */
import {
  type ApparenceEntete,
  type ApparencePied,
  APPARENCE_ENTETE_DEFAUT,
  APPARENCE_PIED_DEFAUT,
} from "@nexora/types";
import { Plus, Trash2 } from "lucide-react";

// ─────────────────────────────────────────
// Helpers UI
// ─────────────────────────────────────────

function Etiquette({ texte, htmlFor }: { texte: string; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-muted-foreground mb-1.5"
    >
      {texte}
    </label>
  );
}

function ChampCouleur({
  id,
  valeur,
  onChange,
}: {
  id: string;
  valeur?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={valeur ?? "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 rounded border border-input cursor-pointer"
      />
      <input
        id={id}
        type="text"
        value={valeur ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder="auto"
        className="flex-1 rounded-md border border-input bg-white px-2.5 py-1.5 text-sm font-mono"
      />
      {valeur && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Réinit.
        </button>
      )}
    </div>
  );
}

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input mt-0.5"
      />
    </div>
  );
}

// ─────────────────────────────────────────
// Apparence en-tête
// ─────────────────────────────────────────

export function PanneauApparenceEntete({
  valeur,
  onChange,
}: {
  valeur: ApparenceEntete;
  onChange: (v: ApparenceEntete) => void;
}) {
  const a = valeur ?? APPARENCE_ENTETE_DEFAUT;
  const set = <K extends keyof ApparenceEntete>(k: K, v: ApparenceEntete[K]) =>
    onChange({ ...a, [k]: v });

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-5">
      <h3 className="text-sm font-semibold text-foreground">Apparence de l’en-tête</h3>

      {/* Position des liens */}
      <div>
        <Etiquette texte="Position des liens" />
        <div className="flex gap-2">
          {(["gauche", "centre", "droite"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => set("positionLiens", p)}
              className={`flex-1 rounded-md border-2 px-3 py-2 text-xs font-medium capitalize transition-colors ${
                a.positionLiens === p
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-ring"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Hauteur */}
      <div>
        <Etiquette texte="Hauteur" />
        <div className="flex gap-2">
          {(["compact", "normal", "grand"] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => set("hauteur", h)}
              className={`flex-1 rounded-md border-2 px-3 py-2 text-xs font-medium capitalize transition-colors ${
                a.hauteur === h
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-ring"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Couleurs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Etiquette texte="Couleur de fond" htmlFor="ent-fond" />
          <ChampCouleur
            id="ent-fond"
            valeur={a.couleurFond}
            onChange={(v) => set("couleurFond", v)}
          />
        </div>
        <div>
          <Etiquette texte="Couleur du texte" htmlFor="ent-texte" />
          <ChampCouleur
            id="ent-texte"
            valeur={a.couleurTexte}
            onChange={(v) => set("couleurTexte", v)}
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="divide-y divide-border border-y border-border">
        <Toggle
          id="ent-sticky"
          label="En-tête sticky"
          description="Reste visible au scroll"
          checked={a.sticky}
          onChange={(v) => set("sticky", v)}
        />
        <Toggle
          id="ent-transparent"
          label="Fond transparent"
          description="Au-dessus du hero ; couleur ignorée tant qu’on n’a pas scrollé"
          checked={a.transparent}
          onChange={(v) => set("transparent", v)}
        />
        <Toggle
          id="ent-logo"
          label="Afficher le logo"
          checked={a.afficherLogo}
          onChange={(v) => set("afficherLogo", v)}
        />
        <Toggle
          id="ent-recherche"
          label="Barre de recherche intégrée"
          description="Champ de recherche affiché dans l’en-tête"
          checked={a.afficherRecherche}
          onChange={(v) => set("afficherRecherche", v)}
        />
      </div>

      {/* CTA */}
      <div className="rounded-md bg-muted/40 p-4 space-y-3">
        <Toggle
          id="ent-cta-active"
          label="Bouton d’appel à l’action"
          description="Affiche un bouton mis en avant à droite des liens"
          checked={a.cta.active}
          onChange={(v) => set("cta", { ...a.cta, active: v })}
        />

        {a.cta.active && (
          <div className="space-y-3 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Etiquette texte="Texte du bouton" htmlFor="cta-texte" />
                <input
                  id="cta-texte"
                  type="text"
                  value={a.cta.texte}
                  onChange={(e) => set("cta", { ...a.cta, texte: e.target.value })}
                  className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-sm"
                />
              </div>
              <div>
                <Etiquette texte="Lien (URL ou /chemin)" htmlFor="cta-url" />
                <input
                  id="cta-url"
                  type="text"
                  value={a.cta.url}
                  onChange={(e) => set("cta", { ...a.cta, url: e.target.value })}
                  className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Etiquette texte="Couleur de fond CTA" htmlFor="cta-fond" />
                <ChampCouleur
                  id="cta-fond"
                  valeur={a.cta.couleurFond}
                  onChange={(v) => set("cta", { ...a.cta, couleurFond: v })}
                />
              </div>
              <div>
                <Etiquette texte="Couleur du texte CTA" htmlFor="cta-texte-c" />
                <ChampCouleur
                  id="cta-texte-c"
                  valeur={a.cta.couleurTexte}
                  onChange={(v) => set("cta", { ...a.cta, couleurTexte: v })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Apparence pied de page
// ─────────────────────────────────────────

export function PanneauApparencePied({
  valeur,
  onChange,
}: {
  valeur: ApparencePied;
  onChange: (v: ApparencePied) => void;
}) {
  const a = valeur ?? APPARENCE_PIED_DEFAUT;
  const set = <K extends keyof ApparencePied>(k: K, v: ApparencePied[K]) =>
    onChange({ ...a, [k]: v });

  function ajouterLien() {
    set("liensSecondaires", [
      ...a.liensSecondaires,
      { id: Math.random().toString(36).slice(2, 10), libelle: "Mentions légales", url: "/mentions-legales" },
    ]);
  }

  function modifierLien(id: string, champs: Partial<{ libelle: string; url: string }>) {
    set(
      "liensSecondaires",
      a.liensSecondaires.map((l) => (l.id === id ? { ...l, ...champs } : l))
    );
  }

  function supprimerLien(id: string) {
    set("liensSecondaires", a.liensSecondaires.filter((l) => l.id !== id));
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-5">
      <h3 className="text-sm font-semibold text-foreground">Apparence du pied de page</h3>

      {/* Colonnes */}
      <div>
        <Etiquette texte="Nombre de colonnes" />
        <div className="flex gap-2">
          {([1, 2, 3, 4] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set("nbColonnes", n)}
              className={`flex-1 rounded-md border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                a.nbColonnes === n
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-ring"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Couleurs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Etiquette texte="Couleur de fond" htmlFor="pp-fond" />
          <ChampCouleur
            id="pp-fond"
            valeur={a.couleurFond}
            onChange={(v) => set("couleurFond", v)}
          />
        </div>
        <div>
          <Etiquette texte="Couleur du texte" htmlFor="pp-texte" />
          <ChampCouleur
            id="pp-texte"
            valeur={a.couleurTexte}
            onChange={(v) => set("couleurTexte", v)}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Etiquette texte="Description / baseline" htmlFor="pp-desc" />
        <textarea
          id="pp-desc"
          value={a.description ?? ""}
          onChange={(e) => set("description", e.target.value || undefined)}
          rows={2}
          placeholder="Quelques mots qui résument votre site…"
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
        />
      </div>

      {/* Toggles */}
      <div className="divide-y divide-border border-y border-border">
        <Toggle
          id="pp-logo"
          label="Afficher le logo"
          checked={a.afficherLogo}
          onChange={(v) => set("afficherLogo", v)}
        />
        <Toggle
          id="pp-rs"
          label="Afficher les réseaux sociaux"
          description="Liens issus des réglages du site"
          checked={a.afficherReseauxSociaux}
          onChange={(v) => set("afficherReseauxSociaux", v)}
        />
        <Toggle
          id="pp-langue"
          label="Sélecteur de langue"
          checked={a.selecteurLangue}
          onChange={(v) => set("selecteurLangue", v)}
        />
      </div>

      {/* Copyright */}
      <div>
        <Etiquette texte="Texte de copyright" htmlFor="pp-cp" />
        <input
          id="pp-cp"
          type="text"
          value={a.texteCopyright ?? ""}
          onChange={(e) => set("texteCopyright", e.target.value || undefined)}
          placeholder="© 2025 Mon site. Tous droits réservés."
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
        />
      </div>

      {/* Newsletter */}
      <div className="rounded-md bg-muted/40 p-4 space-y-3">
        <Toggle
          id="pp-nl-active"
          label="Inscription newsletter"
          description="Affiche un champ email dans le pied de page"
          checked={a.newsletter.active}
          onChange={(v) => set("newsletter", { ...a.newsletter, active: v })}
        />
        {a.newsletter.active && (
          <div className="grid gap-3 sm:grid-cols-2 pt-1">
            <div>
              <Etiquette texte="Titre" htmlFor="nl-titre" />
              <input
                id="nl-titre"
                type="text"
                value={a.newsletter.titre ?? ""}
                onChange={(e) =>
                  set("newsletter", { ...a.newsletter, titre: e.target.value || undefined })
                }
                className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <Etiquette texte="Placeholder" htmlFor="nl-ph" />
              <input
                id="nl-ph"
                type="text"
                value={a.newsletter.placeholder ?? ""}
                onChange={(e) =>
                  set("newsletter", { ...a.newsletter, placeholder: e.target.value || undefined })
                }
                className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Liens secondaires */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Etiquette texte="Liens secondaires (mentions légales, etc.)" />
          <button
            type="button"
            onClick={ajouterLien}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        </div>
        {a.liensSecondaires.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Aucun lien secondaire.</p>
        ) : (
          <div className="space-y-2">
            {a.liensSecondaires.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={l.libelle}
                  onChange={(e) => modifierLien(l.id, { libelle: e.target.value })}
                  placeholder="Libellé"
                  className="flex-1 rounded-md border border-input bg-white px-2.5 py-1.5 text-sm"
                />
                <input
                  type="text"
                  value={l.url}
                  onChange={(e) => modifierLien(l.id, { url: e.target.value })}
                  placeholder="/url"
                  className="flex-1 rounded-md border border-input bg-white px-2.5 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => supprimerLien(l.id)}
                  className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
