"use client";

/**
 * Gestion des catégories et étiquettes d'un site.
 * Deux sections sur la même page — utilisée principalement pour les blogs.
 */
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Tag,
  FolderTree,
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { cn } from "@nexora/ui";
import { trpc } from "@/lib/trpc";

/** Génère un slug à partir d'un nom */
function genererSlug(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const COULEURS_PRESET = [
  "#06182E",
  "#185FA5",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export default function PageTaxonomies() {
  const params = useParams<{ slug: string }>();
  const utils = trpc.useUtils();

  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const { data: categories, isLoading: chargementCats } =
    trpc.categories.lister.useQuery(
      { idSite: site?.id ?? "" },
      { enabled: !!site?.id }
    );

  const { data: etiquettes, isLoading: chargementEts } =
    trpc.etiquettes.lister.useQuery(
      { idSite: site?.id ?? "" },
      { enabled: !!site?.id }
    );

  const roleCourant = site?.roleCourant ?? "LECTEUR";
  const peutEditer = ["PROPRIETAIRE", "ADMINISTRATEUR", "EDITEUR"].includes(roleCourant);
  const peutSupprimer = ["PROPRIETAIRE", "ADMINISTRATEUR"].includes(roleCourant);

  /* ─────── Catégories ─────── */
  const [nouvelleCat, setNouvelleCat] = useState({ nom: "", slug: "", couleur: "" });
  const [editionCat, setEditionCat] = useState<string | null>(null);
  const [edCat, setEdCat] = useState({ nom: "", slug: "", couleur: "" });
  const [erreurCat, setErreurCat] = useState("");

  const mutCreerCat = trpc.categories.creer.useMutation({
    onSuccess: () => {
      utils.categories.lister.invalidate({ idSite: site?.id ?? "" });
      setNouvelleCat({ nom: "", slug: "", couleur: "" });
      setErreurCat("");
    },
    onError: (e) => setErreurCat(e.message),
  });
  const mutModifCat = trpc.categories.modifier.useMutation({
    onSuccess: () => {
      utils.categories.lister.invalidate({ idSite: site?.id ?? "" });
      setEditionCat(null);
      setErreurCat("");
    },
    onError: (e) => setErreurCat(e.message),
  });
  const mutSupprCat = trpc.categories.supprimer.useMutation({
    onSuccess: () => utils.categories.lister.invalidate({ idSite: site?.id ?? "" }),
  });

  /* ─────── Étiquettes ─────── */
  const [nouvelleEt, setNouvelleEt] = useState({ nom: "", slug: "", couleur: "" });
  const [editionEt, setEditionEt] = useState<string | null>(null);
  const [edEt, setEdEt] = useState({ nom: "", slug: "", couleur: "" });
  const [erreurEt, setErreurEt] = useState("");

  const mutCreerEt = trpc.etiquettes.creer.useMutation({
    onSuccess: () => {
      utils.etiquettes.lister.invalidate({ idSite: site?.id ?? "" });
      setNouvelleEt({ nom: "", slug: "", couleur: "" });
      setErreurEt("");
    },
    onError: (e) => setErreurEt(e.message),
  });
  const mutModifEt = trpc.etiquettes.modifier.useMutation({
    onSuccess: () => {
      utils.etiquettes.lister.invalidate({ idSite: site?.id ?? "" });
      setEditionEt(null);
      setErreurEt("");
    },
    onError: (e) => setErreurEt(e.message),
  });
  const mutSupprEt = trpc.etiquettes.supprimer.useMutation({
    onSuccess: () => utils.etiquettes.lister.invalidate({ idSite: site?.id ?? "" }),
  });

  return (
    <div>
      <Link
        href={`/tableau-de-bord/sites/${params.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au site
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-midnight">Taxonomies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catégories et étiquettes pour organiser vos pages et articles.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ════════════════ Catégories ════════════════ */}
        <section>
          <header className="flex items-center gap-2 mb-4">
            <FolderTree className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Catégories</h2>
            <span className="text-xs text-muted-foreground">
              ({categories?.length ?? 0})
            </span>
          </header>

          {peutEditer && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!site?.id || !nouvelleCat.nom) return;
                mutCreerCat.mutate({
                  idSite: site.id,
                  nom: nouvelleCat.nom,
                  slug: nouvelleCat.slug || genererSlug(nouvelleCat.nom),
                  couleur: nouvelleCat.couleur || null,
                });
              }}
              className="rounded-lg border border-border bg-card p-4 mb-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nom de la catégorie"
                  value={nouvelleCat.nom}
                  onChange={(e) =>
                    setNouvelleCat({
                      ...nouvelleCat,
                      nom: e.target.value,
                      slug: nouvelleCat.slug || genererSlug(e.target.value),
                    })
                  }
                  className="rounded-md border border-input bg-white px-3 py-2 text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="slug-url"
                  value={nouvelleCat.slug}
                  onChange={(e) =>
                    setNouvelleCat({ ...nouvelleCat, slug: e.target.value })
                  }
                  className="rounded-md border border-input bg-white px-3 py-2 text-sm font-mono"
                />
              </div>
              <SelecteurCouleur
                valeur={nouvelleCat.couleur}
                surChangement={(c) => setNouvelleCat({ ...nouvelleCat, couleur: c })}
              />
              <button
                type="submit"
                disabled={mutCreerCat.isPending || !nouvelleCat.nom}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {mutCreerCat.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Ajouter
              </button>
            </form>
          )}

          {erreurCat && (
            <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {erreurCat}
            </div>
          )}

          {chargementCats ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Aucune catégorie pour le moment.
            </div>
          ) : (
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  {editionCat === cat.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edCat.nom}
                          onChange={(e) => setEdCat({ ...edCat, nom: e.target.value })}
                          className="rounded-md border border-input bg-white px-2.5 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          value={edCat.slug}
                          onChange={(e) => setEdCat({ ...edCat, slug: e.target.value })}
                          className="rounded-md border border-input bg-white px-2.5 py-1.5 text-sm font-mono"
                        />
                      </div>
                      <SelecteurCouleur
                        valeur={edCat.couleur}
                        surChangement={(c) => setEdCat({ ...edCat, couleur: c })}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!site?.id) return;
                            mutModifCat.mutate({
                              id: cat.id,
                              idSite: site.id,
                              nom: edCat.nom,
                              slug: edCat.slug,
                              couleur: edCat.couleur || null,
                            });
                          }}
                          disabled={mutModifCat.isPending}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditionCat(null)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ background: cat.couleur ?? "#94a3b8" }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {cat.nom}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          /{cat.slug} · {cat._count.pages} page
                          {cat._count.pages > 1 ? "s" : ""}
                        </p>
                      </div>
                      {peutEditer && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditionCat(cat.id);
                            setEdCat({
                              nom: cat.nom,
                              slug: cat.slug,
                              couleur: cat.couleur ?? "",
                            });
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Modifier"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {peutSupprimer && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!site?.id) return;
                            if (
                              confirm(
                                `Supprimer la catégorie « ${cat.nom} » ? Les pages associées ne seront pas supprimées.`
                              )
                            ) {
                              mutSupprCat.mutate({ id: cat.id, idSite: site.id });
                            }
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Supprimer"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ════════════════ Étiquettes ════════════════ */}
        <section>
          <header className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Étiquettes</h2>
            <span className="text-xs text-muted-foreground">
              ({etiquettes?.length ?? 0})
            </span>
          </header>

          {peutEditer && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!site?.id || !nouvelleEt.nom) return;
                mutCreerEt.mutate({
                  idSite: site.id,
                  nom: nouvelleEt.nom,
                  slug: nouvelleEt.slug || genererSlug(nouvelleEt.nom),
                  couleur: nouvelleEt.couleur || null,
                });
              }}
              className="rounded-lg border border-border bg-card p-4 mb-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nom de l'étiquette"
                  value={nouvelleEt.nom}
                  onChange={(e) =>
                    setNouvelleEt({
                      ...nouvelleEt,
                      nom: e.target.value,
                      slug: nouvelleEt.slug || genererSlug(e.target.value),
                    })
                  }
                  className="rounded-md border border-input bg-white px-3 py-2 text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="slug-url"
                  value={nouvelleEt.slug}
                  onChange={(e) =>
                    setNouvelleEt({ ...nouvelleEt, slug: e.target.value })
                  }
                  className="rounded-md border border-input bg-white px-3 py-2 text-sm font-mono"
                />
              </div>
              <SelecteurCouleur
                valeur={nouvelleEt.couleur}
                surChangement={(c) => setNouvelleEt({ ...nouvelleEt, couleur: c })}
              />
              <button
                type="submit"
                disabled={mutCreerEt.isPending || !nouvelleEt.nom}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {mutCreerEt.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Ajouter
              </button>
            </form>
          )}

          {erreurEt && (
            <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {erreurEt}
            </div>
          )}

          {chargementEts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !etiquettes || etiquettes.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Aucune étiquette pour le moment.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {etiquettes.map((et) => (
                <div
                  key={et.id}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card pl-3 pr-1 py-1"
                >
                  {editionEt === et.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={edEt.nom}
                        onChange={(e) => setEdEt({ ...edEt, nom: e.target.value })}
                        className="rounded border border-input bg-white px-2 py-0.5 text-xs w-24"
                      />
                      <input
                        type="text"
                        value={edEt.slug}
                        onChange={(e) => setEdEt({ ...edEt, slug: e.target.value })}
                        className="rounded border border-input bg-white px-2 py-0.5 text-xs font-mono w-20"
                      />
                      <input
                        type="color"
                        value={edEt.couleur || "#94a3b8"}
                        onChange={(e) => setEdEt({ ...edEt, couleur: e.target.value })}
                        className="h-5 w-5 cursor-pointer rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!site?.id) return;
                          mutModifEt.mutate({
                            id: et.id,
                            idSite: site.id,
                            nom: edEt.nom,
                            slug: edEt.slug,
                            couleur: edEt.couleur || null,
                          });
                        }}
                        disabled={mutModifEt.isPending}
                        className="rounded p-0.5 hover:bg-muted"
                        aria-label="Enregistrer"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditionEt(null)}
                        className="rounded p-0.5 hover:bg-muted"
                        aria-label="Annuler"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: et.couleur ?? "#94a3b8" }}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {et.nom}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({et._count.pages})
                      </span>
                      {peutEditer && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditionEt(et.id);
                            setEdEt({
                              nom: et.nom,
                              slug: et.slug,
                              couleur: et.couleur ?? "",
                            });
                          }}
                          className="rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                          title="Modifier"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      {peutSupprimer && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!site?.id) return;
                            if (confirm(`Supprimer l'étiquette « ${et.nom} » ?`)) {
                              mutSupprEt.mutate({ id: et.id, idSite: site.id });
                            }
                          }}
                          className="rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                          title="Supprimer"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** Sélecteur de couleur avec presets + picker libre */
function SelecteurCouleur({
  valeur,
  surChangement,
}: {
  valeur: string;
  surChangement: (couleur: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Couleur :</span>
      {COULEURS_PRESET.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => surChangement(c)}
          className={cn(
            "h-5 w-5 rounded-full border-2 transition-all",
            valeur === c ? "border-foreground scale-110" : "border-transparent"
          )}
          style={{ background: c }}
          title={c}
          aria-label={`Couleur ${c}`}
        />
      ))}
      <input
        type="color"
        value={valeur || "#94a3b8"}
        onChange={(e) => surChangement(e.target.value)}
        className="h-6 w-6 cursor-pointer rounded"
        aria-label="Choisir une couleur libre"
      />
      {valeur && (
        <button
          type="button"
          onClick={() => surChangement("")}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Aucune
        </button>
      )}
    </div>
  );
}
