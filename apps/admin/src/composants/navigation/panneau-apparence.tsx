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
import { Plus, Trash2, LayoutDashboard, Link2, Sparkles, MousePointer2, Megaphone, ImageIcon, Type } from "lucide-react";

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

/** Sélecteur visuel à boutons (segmented control). */
function SegmentedControl<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: ReadonlyArray<{ valeur: T; libelle: string }>;
  valeur: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          onClick={() => onChange(o.valeur)}
          className={`flex-1 min-w-[80px] rounded-md border-2 px-3 py-2 text-xs font-medium capitalize transition-colors ${
            valeur === o.valeur
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-ring"
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

/** En-tête de sous-section avec icône. */
function SousSection({
  icone: Icone,
  titre,
  description,
  children,
}: {
  icone: React.ComponentType<{ className?: string }>;
  titre: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icone className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground leading-tight">{titre}</h4>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/**
 * Grille d'options visuelles : chaque option rend un aperçu graphique
 * (mini-swatch) en plus de son libellé. Utilisé pour styles de liens,
 * indicateurs, ombres, etc.
 */
function GrilleOptionsVisuelles<T extends string>({
  options,
  valeur,
  onChange,
  colonnes = 4,
}: {
  options: ReadonlyArray<{
    valeur: T;
    libelle: string;
    rendu: React.ReactNode;
  }>;
  valeur: T | undefined;
  onChange: (v: T) => void;
  colonnes?: 2 | 3 | 4 | 5;
}) {
  const gridClass =
    colonnes === 2
      ? "grid-cols-2"
      : colonnes === 3
        ? "grid-cols-3"
        : colonnes === 5
          ? "grid-cols-5"
          : "grid-cols-2 sm:grid-cols-4";
  return (
    <div className={`grid gap-2 ${gridClass}`}>
      {options.map((o) => {
        const actif = valeur === o.valeur;
        return (
          <button
            key={o.valeur}
            type="button"
            onClick={() => onChange(o.valeur)}
            className={`group relative flex flex-col items-center justify-end gap-2 rounded-lg border-2 p-3 transition-all ${
              actif
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-background hover:border-ring hover:bg-muted/40"
            }`}
          >
            <div className="grid h-12 w-full place-items-center overflow-hidden rounded-md bg-muted/40">
              {o.rendu}
            </div>
            <span
              className={`text-[11px] font-medium leading-none ${
                actif ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {o.libelle}
            </span>
            {actif && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
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
        <SegmentedControl
          options={[
            { valeur: "gauche", libelle: "gauche" },
            { valeur: "centre", libelle: "centre" },
            { valeur: "droite", libelle: "droite" },
          ]}
          valeur={a.positionLiens}
          onChange={(v) => set("positionLiens", v)}
        />
      </div>

      {/* Hauteur */}
      <div>
        <Etiquette texte="Hauteur" />
        <SegmentedControl
          options={[
            { valeur: "compact", libelle: "compact" },
            { valeur: "normal", libelle: "normal" },
            { valeur: "grand", libelle: "grand" },
          ]}
          valeur={a.hauteur}
          onChange={(v) => set("hauteur", v)}
        />
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

      {/* ===================================================== */}
      {/* V1 : Mise en page, style des liens & finitions         */}
      {/* ===================================================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
            Mise en page & style
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* ===== Conteneur ===== */}
        <SousSection
          icone={LayoutDashboard}
          titre="Conteneur"
          description="Largeur de la barre et espacement des liens."
        >
          <div>
            <Etiquette texte="Largeur" />
            <GrilleOptionsVisuelles
              colonnes={4}
              valeur={a.largeurConteneur ?? "normale"}
              onChange={(v) => set("largeurConteneur", v)}
              options={[
                {
                  valeur: "etroite",
                  libelle: "Étroite",
                  rendu: <div className="h-1.5 w-6 rounded-full bg-foreground/40" />,
                },
                {
                  valeur: "normale",
                  libelle: "Normale",
                  rendu: <div className="h-1.5 w-9 rounded-full bg-foreground/50" />,
                },
                {
                  valeur: "large",
                  libelle: "Large",
                  rendu: <div className="h-1.5 w-12 rounded-full bg-foreground/60" />,
                },
                {
                  valeur: "pleine",
                  libelle: "Pleine",
                  rendu: <div className="h-1.5 w-14 rounded-full bg-foreground" />,
                },
              ]}
            />
          </div>

          <div>
            <Etiquette texte="Espacement entre les liens" />
            <GrilleOptionsVisuelles
              colonnes={3}
              valeur={a.espacementLiens ?? "normal"}
              onChange={(v) => set("espacementLiens", v)}
              options={[
                {
                  valeur: "compact",
                  libelle: "Compact",
                  rendu: (
                    <div className="flex gap-0.5">
                      <span className="h-2 w-3 rounded bg-foreground/60" />
                      <span className="h-2 w-3 rounded bg-foreground/60" />
                      <span className="h-2 w-3 rounded bg-foreground/60" />
                    </div>
                  ),
                },
                {
                  valeur: "normal",
                  libelle: "Normal",
                  rendu: (
                    <div className="flex gap-1.5">
                      <span className="h-2 w-3 rounded bg-foreground/60" />
                      <span className="h-2 w-3 rounded bg-foreground/60" />
                      <span className="h-2 w-3 rounded bg-foreground/60" />
                    </div>
                  ),
                },
                {
                  valeur: "aere",
                  libelle: "Aéré",
                  rendu: (
                    <div className="flex gap-3">
                      <span className="h-2 w-3 rounded bg-foreground/60" />
                      <span className="h-2 w-3 rounded bg-foreground/60" />
                      <span className="h-2 w-3 rounded bg-foreground/60" />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </SousSection>

        {/* ===== Apparence des liens ===== */}
        <SousSection
          icone={Link2}
          titre="Apparence des liens"
          description="Style des éléments du menu et indication de la page courante."
        >
          <div>
            <Etiquette texte="Style des liens" />
            <GrilleOptionsVisuelles
              colonnes={4}
              valeur={a.styleLiens ?? "minimal"}
              onChange={(v) => set("styleLiens", v)}
              options={[
                {
                  valeur: "minimal",
                  libelle: "Minimal",
                  rendu: <span className="text-xs font-medium text-foreground/80">Lien</span>,
                },
                {
                  valeur: "souligne",
                  libelle: "Souligné",
                  rendu: (
                    <span className="text-xs font-medium text-foreground/80 border-b-2 border-foreground/60 pb-0.5">
                      Lien
                    </span>
                  ),
                },
                {
                  valeur: "pilule",
                  libelle: "Pilule",
                  rendu: (
                    <span className="text-[10px] font-medium text-foreground/80 rounded-full border border-border bg-background px-2.5 py-0.5">
                      Lien
                    </span>
                  ),
                },
                {
                  valeur: "fantome",
                  libelle: "Fantôme",
                  rendu: (
                    <span className="text-[10px] font-medium text-foreground/80 rounded-md border border-border/70 bg-background px-2 py-0.5">
                      Lien
                    </span>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <Etiquette texte="Indicateur de page active" />
            <GrilleOptionsVisuelles
              colonnes={5}
              valeur={a.indicateurActif ?? "souligne"}
              onChange={(v) => set("indicateurActif", v)}
              options={[
                {
                  valeur: "aucun",
                  libelle: "Aucun",
                  rendu: <span className="text-[10px] font-semibold text-foreground">Aa</span>,
                },
                {
                  valeur: "souligne",
                  libelle: "Souligné",
                  rendu: (
                    <span className="text-[10px] font-semibold text-foreground border-b-2 border-primary pb-0.5">
                      Aa
                    </span>
                  ),
                },
                {
                  valeur: "point",
                  libelle: "Point",
                  rendu: (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-semibold text-foreground leading-none">Aa</span>
                      <span className="h-1 w-1 rounded-full bg-primary" />
                    </div>
                  ),
                },
                {
                  valeur: "barre-haut",
                  libelle: "Barre",
                  rendu: (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="h-0.5 w-4 rounded-full bg-primary" />
                      <span className="text-[10px] font-semibold text-foreground leading-none">Aa</span>
                    </div>
                  ),
                },
                {
                  valeur: "fond",
                  libelle: "Fond",
                  rendu: (
                    <span className="text-[10px] font-semibold text-foreground bg-primary/15 rounded px-1.5 py-0.5">
                      Aa
                    </span>
                  ),
                },
              ]}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Etiquette texte="Couleur au survol" htmlFor="ent-hover" />
              <ChampCouleur
                id="ent-hover"
                valeur={a.couleurLienHover}
                onChange={(v) => set("couleurLienHover", v)}
              />
            </div>
            <div>
              <Etiquette texte="Couleur du lien actif" htmlFor="ent-actif" />
              <ChampCouleur
                id="ent-actif"
                valeur={a.couleurLienActif}
                onChange={(v) => set("couleurLienActif", v)}
              />
            </div>
          </div>
        </SousSection>

        {/* ===== Finitions ===== */}
        <SousSection
          icone={Sparkles}
          titre="Finitions"
          description="Ombre, bordure et touches visuelles finales."
        >
          <div>
            <Etiquette texte="Ombre portée" />
            <GrilleOptionsVisuelles
              colonnes={4}
              valeur={a.ombre ?? "aucune"}
              onChange={(v) => set("ombre", v)}
              options={[
                {
                  valeur: "aucune",
                  libelle: "Aucune",
                  rendu: <div className="h-3 w-10 rounded bg-background border border-border" />,
                },
                {
                  valeur: "fine",
                  libelle: "Fine",
                  rendu: <div className="h-3 w-10 rounded bg-background shadow-sm border border-border" />,
                },
                {
                  valeur: "moyenne",
                  libelle: "Moyenne",
                  rendu: <div className="h-3 w-10 rounded bg-background shadow-md border border-border" />,
                },
                {
                  valeur: "forte",
                  libelle: "Forte",
                  rendu: <div className="h-3 w-10 rounded bg-background shadow-lg border border-border" />,
                },
              ]}
            />
          </div>

          <div>
            <Etiquette texte="Bordure inférieure" />
            <GrilleOptionsVisuelles
              colonnes={3}
              valeur={a.bordureBas ?? "fine"}
              onChange={(v) => set("bordureBas", v)}
              options={[
                {
                  valeur: "aucune",
                  libelle: "Aucune",
                  rendu: <div className="h-3 w-10 rounded bg-background" />,
                },
                {
                  valeur: "fine",
                  libelle: "Fine",
                  rendu: (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-3 w-10 rounded bg-background" />
                      <div className="h-px w-12 bg-foreground/60" />
                    </div>
                  ),
                },
                {
                  valeur: "epaisse",
                  libelle: "Épaisse",
                  rendu: (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-3 w-10 rounded bg-background" />
                      <div className="h-0.5 w-12 bg-foreground/70" />
                    </div>
                  ),
                },
              ]}
            />
            {a.bordureBas && a.bordureBas !== "aucune" && (
              <div className="mt-3">
                <Etiquette texte="Couleur de la bordure" htmlFor="ent-bord-c" />
                <ChampCouleur
                  id="ent-bord-c"
                  valeur={a.couleurBordureBas}
                  onChange={(v) => set("couleurBordureBas", v)}
                />
              </div>
            )}
          </div>
        </SousSection>
      </div>

      {/* ===================================================== */}
      {/* V2 : Comportement au scroll & Bandeau d'annonce        */}
      {/* ===================================================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
            Comportement & annonces
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* ===== Comportement au scroll ===== */}
        <SousSection
          icone={MousePointer2}
          titre="Comportement au scroll"
          description={
            a.sticky
              ? "Réaction de l'en-tête quand on fait défiler la page."
              : "Active « En-tête sticky » plus bas pour profiter de ces options."
          }
        >
          <div className={a.sticky ? "" : "opacity-50 pointer-events-none"}>
            <Etiquette texte="Comportement" />
            <GrilleOptionsVisuelles
              colonnes={3}
              valeur={a.comportementScroll ?? "fixe"}
              onChange={(v) => set("comportementScroll", v)}
              options={[
                {
                  valeur: "fixe",
                  libelle: "Fixe",
                  rendu: (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-2 w-12 rounded-sm bg-foreground/70" />
                      <div className="h-0.5 w-12 bg-border" />
                      <div className="h-1 w-10 rounded-sm bg-foreground/20" />
                    </div>
                  ),
                },
                {
                  valeur: "reduit",
                  libelle: "Réduit",
                  rendu: (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-1 w-12 rounded-sm bg-foreground/70" />
                      <div className="h-0.5 w-12 bg-border" />
                      <div className="h-1 w-10 rounded-sm bg-foreground/20" />
                    </div>
                  ),
                },
                {
                  valeur: "auto-cache",
                  libelle: "Auto-cache",
                  rendu: (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-2 w-12 rounded-sm bg-foreground/30 border border-dashed border-foreground/40" />
                      <div className="h-0.5 w-12 bg-border" />
                      <div className="h-1 w-10 rounded-sm bg-foreground/20" />
                    </div>
                  ),
                },
              ]}
            />

            <div className="mt-4">
              <Etiquette texte="Seuil de déclenchement (px)" htmlFor="ent-seuil" />
              <div className="flex items-center gap-3">
                <input
                  id="ent-seuil"
                  type="range"
                  min={0}
                  max={400}
                  step={4}
                  value={a.seuilScroll ?? 8}
                  onChange={(e) => set("seuilScroll", Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-12 text-right font-mono text-xs text-muted-foreground">
                  {a.seuilScroll ?? 8}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Distance défilée avant que le comportement ne s’active.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Etiquette texte="Fond une fois scrollé" htmlFor="ent-fond-s" />
                <ChampCouleur
                  id="ent-fond-s"
                  valeur={a.couleurFondScroll}
                  onChange={(v) => set("couleurFondScroll", v)}
                />
              </div>
              <div>
                <Etiquette texte="Texte une fois scrollé" htmlFor="ent-texte-s" />
                <ChampCouleur
                  id="ent-texte-s"
                  valeur={a.couleurTexteScroll}
                  onChange={(v) => set("couleurTexteScroll", v)}
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Couleurs appliquées au-delà du seuil. Idéal avec « transparent » ou « réduit ».
            </p>
          </div>
        </SousSection>

        {/* ===== Bandeau d'annonce ===== */}
        <SousSection
          icone={Megaphone}
          titre="Bandeau d’annonce"
          description="Petit bandeau affiché juste au-dessus de l’en-tête."
        >
          <Toggle
            id="ent-bandeau-active"
            label="Activer le bandeau"
            description="Parfait pour une promo, une info importante ou un lien spécial."
            checked={a.bandeau?.active ?? false}
            onChange={(v) =>
              set("bandeau", {
                texte: "",
                fermable: true,
                ...(a.bandeau ?? {}),
                active: v,
              })
            }
          />

          {a.bandeau?.active && (
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div>
                <Etiquette texte="Texte du bandeau" htmlFor="ent-band-texte" />
                <input
                  id="ent-band-texte"
                  type="text"
                  value={a.bandeau.texte}
                  maxLength={280}
                  placeholder="🎉 Livraison gratuite ce week-end !"
                  onChange={(e) =>
                    set("bandeau", { ...a.bandeau!, texte: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-sm"
                />
              </div>

              <div>
                <Etiquette texte="Lien (optionnel)" htmlFor="ent-band-lien" />
                <input
                  id="ent-band-lien"
                  type="text"
                  value={a.bandeau.lien ?? ""}
                  placeholder="/promo ou https://…"
                  onChange={(e) =>
                    set("bandeau", { ...a.bandeau!, lien: e.target.value || undefined })
                  }
                  className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Etiquette texte="Couleur de fond" htmlFor="ent-band-fond" />
                  <ChampCouleur
                    id="ent-band-fond"
                    valeur={a.bandeau.couleurFond}
                    onChange={(v) =>
                      set("bandeau", { ...a.bandeau!, couleurFond: v })
                    }
                  />
                </div>
                <div>
                  <Etiquette texte="Couleur du texte" htmlFor="ent-band-texte-c" />
                  <ChampCouleur
                    id="ent-band-texte-c"
                    valeur={a.bandeau.couleurTexte}
                    onChange={(v) =>
                      set("bandeau", { ...a.bandeau!, couleurTexte: v })
                    }
                  />
                </div>
              </div>

              <Toggle
                id="ent-band-fermable"
                label="Bouton de fermeture"
                description="Permet au visiteur de masquer le bandeau (mémorisé localement)."
                checked={a.bandeau.fermable ?? true}
                onChange={(v) =>
                  set("bandeau", { ...a.bandeau!, fermable: v })
                }
              />

              {/* Aperçu live */}
              <div>
                <Etiquette texte="Aperçu" />
                <div
                  className="flex items-center justify-center rounded-md px-4 py-2 text-xs font-medium"
                  style={{
                    background: a.bandeau.couleurFond ?? "var(--color-primary)",
                    color: a.bandeau.couleurTexte ?? "#ffffff",
                  }}
                >
                  {a.bandeau.texte || "Votre message s’affichera ici"}
                </div>
              </div>
            </div>
          )}
        </SousSection>
      </div>

      {/* ===================================================== */}
      {/* V3 : Logo & typographie                                */}
      {/* ===================================================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
            Logo & typographie
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* ===== Logo & nom du site ===== */}
        <SousSection
          icone={ImageIcon}
          titre="Logo & nom du site"
          description="Position, taille et présentation du logo et du nom."
        >
          <div>
            <Etiquette texte="Position du logo" />
            <GrilleOptionsVisuelles
              colonnes={3}
              valeur={a.positionLogo ?? "gauche"}
              onChange={(v) => set("positionLogo", v)}
              options={[
                {
                  valeur: "gauche",
                  libelle: "Gauche",
                  rendu: (
                    <div className="flex w-full items-center justify-start gap-1 px-2">
                      <span className="h-3 w-3 rounded bg-primary/80" />
                      <span className="h-1 w-2 rounded bg-foreground/30" />
                    </div>
                  ),
                },
                {
                  valeur: "centre",
                  libelle: "Centre",
                  rendu: (
                    <div className="flex w-full items-center justify-center gap-1 px-2">
                      <span className="h-3 w-3 rounded bg-primary/80" />
                    </div>
                  ),
                },
                {
                  valeur: "droite",
                  libelle: "Droite",
                  rendu: (
                    <div className="flex w-full items-center justify-end gap-1 px-2">
                      <span className="h-1 w-2 rounded bg-foreground/30" />
                      <span className="h-3 w-3 rounded bg-primary/80" />
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <Etiquette texte="Taille du logo" />
            <GrilleOptionsVisuelles
              colonnes={4}
              valeur={a.tailleLogo ?? "M"}
              onChange={(v) => set("tailleLogo", v)}
              options={[
                {
                  valeur: "S",
                  libelle: "S",
                  rendu: <span className="h-4 w-4 rounded bg-primary/80" />,
                },
                {
                  valeur: "M",
                  libelle: "M",
                  rendu: <span className="h-6 w-6 rounded bg-primary/80" />,
                },
                {
                  valeur: "L",
                  libelle: "L",
                  rendu: <span className="h-8 w-8 rounded bg-primary/80" />,
                },
                {
                  valeur: "XL",
                  libelle: "XL",
                  rendu: <span className="h-10 w-10 rounded bg-primary/80" />,
                },
              ]}
            />
          </div>

          <Toggle
            id="ent-afficher-nom"
            label="Afficher le nom du site"
            description="Affiche le nom à côté du logo."
            checked={a.afficherNomSite ?? true}
            onChange={(v) => set("afficherNomSite", v)}
          />

          {(a.afficherNomSite ?? true) && (
            <div>
              <Etiquette texte="Police du nom" />
              <GrilleOptionsVisuelles
                colonnes={4}
                valeur={a.policeNomSite ?? "heritee"}
                onChange={(v) => set("policeNomSite", v)}
                options={[
                  {
                    valeur: "heritee",
                    libelle: "Auto",
                    rendu: <span className="text-sm font-semibold text-foreground">Aa</span>,
                  },
                  {
                    valeur: "sans",
                    libelle: "Sans",
                    rendu: <span className="text-sm font-semibold font-sans text-foreground">Aa</span>,
                  },
                  {
                    valeur: "serif",
                    libelle: "Serif",
                    rendu: <span className="text-sm font-semibold font-serif text-foreground">Aa</span>,
                  },
                  {
                    valeur: "mono",
                    libelle: "Mono",
                    rendu: <span className="text-sm font-semibold font-mono text-foreground">Aa</span>,
                  },
                ]}
              />
            </div>
          )}

          <div>
            <Etiquette texte="URL d’un logo alternatif (optionnel)" htmlFor="ent-logo-alt" />
            <input
              id="ent-logo-alt"
              type="url"
              value={a.urlLogoAlt ?? ""}
              placeholder="https://… (utilisé une fois scrollé)"
              onChange={(e) => set("urlLogoAlt", e.target.value || undefined)}
              className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-sm"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Utile en mode transparent : un logo blanc visible sur le hero, un logo foncé une fois scrollé.
            </p>
          </div>
        </SousSection>

        {/* ===== Typographie des liens ===== */}
        <SousSection
          icone={Type}
          titre="Typographie des liens"
          description="Police, casse et graisse appliquées aux liens du menu."
        >
          <div>
            <Etiquette texte="Police" />
            <GrilleOptionsVisuelles
              colonnes={4}
              valeur={a.policeLiens ?? "heritee"}
              onChange={(v) => set("policeLiens", v)}
              options={[
                {
                  valeur: "heritee",
                  libelle: "Auto",
                  rendu: <span className="text-xs font-medium text-foreground">Lien</span>,
                },
                {
                  valeur: "sans",
                  libelle: "Sans",
                  rendu: <span className="text-xs font-medium font-sans text-foreground">Lien</span>,
                },
                {
                  valeur: "serif",
                  libelle: "Serif",
                  rendu: <span className="text-xs font-medium font-serif text-foreground">Lien</span>,
                },
                {
                  valeur: "mono",
                  libelle: "Mono",
                  rendu: <span className="text-xs font-medium font-mono text-foreground">Lien</span>,
                },
              ]}
            />
          </div>

          <div>
            <Etiquette texte="Graisse" />
            <GrilleOptionsVisuelles
              colonnes={4}
              valeur={a.graisseLiens ?? "medium"}
              onChange={(v) => set("graisseLiens", v)}
              options={[
                {
                  valeur: "normale",
                  libelle: "Normale",
                  rendu: <span className="text-xs font-normal text-foreground">Lien</span>,
                },
                {
                  valeur: "medium",
                  libelle: "Medium",
                  rendu: <span className="text-xs font-medium text-foreground">Lien</span>,
                },
                {
                  valeur: "semi",
                  libelle: "Semi",
                  rendu: <span className="text-xs font-semibold text-foreground">Lien</span>,
                },
                {
                  valeur: "bold",
                  libelle: "Bold",
                  rendu: <span className="text-xs font-bold text-foreground">Lien</span>,
                },
              ]}
            />
          </div>

          <Toggle
            id="ent-maj"
            label="Liens en MAJUSCULES"
            description="Met les liens en capitales avec un léger espacement."
            checked={a.liensMajuscules ?? false}
            onChange={(v) => set("liensMajuscules", v)}
          />
        </SousSection>
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
