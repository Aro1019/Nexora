"use client";

/**
 * Page de liste des pages d'un site.
 * Affiche les pages avec filtres par type et statut.
 */
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  FileText,
  Home,
  BookOpen,
  LayoutList,
  Loader2,
  Search,
  Globe,
  FilePen,
  Clock,
  Archive,
  Trash2,
} from "lucide-react";
import { cn, obtenirInfoLangue } from "@nexora/ui";
import { trpc } from "@/lib/trpc";

/** Icônes et libellés par type de page */
const INFO_TYPE: Record<string, { libelle: string; icone: typeof FileText }> = {
  ACCUEIL: { libelle: "Accueil", icone: Home },
  PAGE: { libelle: "Page", icone: FileText },
  ARTICLE: { libelle: "Article", icone: BookOpen },
  INDEX_BLOG: { libelle: "Index blog", icone: LayoutList },
};

/** Libellés et styles des statuts */
const INFO_STATUT: Record<string, { libelle: string; icone: typeof Globe; classe: string }> = {
  BROUILLON: { libelle: "Brouillon", icone: FilePen, classe: "text-muted-foreground bg-muted" },
  PUBLIE: { libelle: "Publié", icone: Globe, classe: "text-emerald-700 bg-emerald-50" },
  PLANIFIE: { libelle: "Planifié", icone: Clock, classe: "text-amber-700 bg-amber-50" },
  ARCHIVE: { libelle: "Archivé", icone: Archive, classe: "text-slate-500 bg-slate-100" },
};

/** Options de filtre par type */
const FILTRES_TYPE = [
  { valeur: undefined, libelle: "Tous" },
  { valeur: "PAGE" as const, libelle: "Pages" },
  { valeur: "ARTICLE" as const, libelle: "Articles" },
  { valeur: "ACCUEIL" as const, libelle: "Accueil" },
];

export default function PageListePages() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [filtreType, setFiltreType] = useState<"ACCUEIL" | "PAGE" | "ARTICLE" | "INDEX_BLOG" | undefined>();
  const [filtreLangue, setFiltreLangue] = useState<string | undefined>();
  const [recherche, setRecherche] = useState("");

  /* Récupérer le site */
  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  /* Récupérer les pages */
  const { data: pages, isLoading } = trpc.pages.lister.useQuery(
    { idSite: site?.id ?? "", typePage: filtreType, langue: filtreLangue },
    { enabled: !!site?.id }
  );

  const utils = trpc.useUtils();

  /* Mutation supprimer */
  const mutationSupprimer = trpc.pages.supprimer.useMutation({
    onSuccess: () => {
      utils.pages.lister.invalidate({ idSite: site?.id ?? "" });
      utils.sites.obtenir.invalidate({ slug: params.slug });
    },
  });

  /** Filtrer par recherche locale */
  const pagesFiltrees = pages?.filter((p) =>
    p.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    p.slug.toLowerCase().includes(recherche.toLowerCase())
  );

  const roleCourant = site?.roleCourant ?? "LECTEUR";
  const peutEditer = ["PROPRIETAIRE", "ADMINISTRATEUR", "EDITEUR"].includes(roleCourant);
  const peutSupprimer = ["PROPRIETAIRE", "ADMINISTRATEUR"].includes(roleCourant);

  return (
    <div>
      {/* Retour */}
      <Link
        href={`/tableau-de-bord/sites/${params.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au site
      </Link>

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight">Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pages?.length ?? 0} page{(pages?.length ?? 0) > 1 ? "s" : ""} sur ce site.
          </p>
        </div>
        {peutEditer && (
          <Link
            href={`/tableau-de-bord/sites/${params.slug}/pages/nouvelle`}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle page
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une page…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full rounded-md border border-input bg-white pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        {/* Filtre langue (visible si plus d'une langue) */}
        {site && site.langues.length > 1 && (
          <select
            value={filtreLangue ?? ""}
            onChange={(e) => setFiltreLangue(e.target.value || undefined)}
            className="rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground"
            aria-label="Filtrer par langue"
          >
            <option value="">Toutes les langues</option>
            {site.langues.map((l) => {
              const info = obtenirInfoLangue(l);
              return (
                <option key={l} value={l}>
                  {info.drapeau} {info.nomNatif}
                </option>
              );
            })}
          </select>
        )}

        {/* Filtres type */}
        <div className="flex gap-1 rounded-md border border-input bg-white p-1">
          {FILTRES_TYPE.map((f) => (
            <button
              key={f.libelle}
              type="button"
              onClick={() => setFiltreType(f.valeur)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                filtreType === f.valeur
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.libelle}
            </button>
          ))}
        </div>
      </div>

      {/* Chargement */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !pagesFiltrees || pagesFiltrees.length === 0 ? (
        /* État vide */
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            {recherche ? "Aucun résultat" : "Aucune page"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {recherche
              ? "Essayez un autre terme de recherche."
              : "Créez votre première page pour commencer."}
          </p>
          {!recherche && peutEditer && (
            <Link
              href={`/tableau-de-bord/sites/${params.slug}/pages/nouvelle`}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouvelle page
            </Link>
          )}
        </div>
      ) : (
        /* ==================== Tableau des pages ==================== */
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* En-tête tableau */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-5">Titre</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Statut</div>
            <div className="col-span-2">Modifiée</div>
            <div className="col-span-1"></div>
          </div>

          {/* Lignes */}
          <div className="divide-y divide-border">
            {pagesFiltrees.map((page) => {
              const type = INFO_TYPE[page.typePage] || INFO_TYPE.PAGE;
              const statut = INFO_STATUT[page.statut] || INFO_STATUT.BROUILLON;
              const IconeType = type.icone;
              const IconeStatut = statut.icone;

              return (
                <div
                  key={page.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/tableau-de-bord/sites/${params.slug}/pages/${page.id}`
                    )
                  }
                >
                  {/* Titre + slug */}
                  <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
                    <IconeType className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                        {page.titre}
                        {site && site.langues.length > 1 && (
                          <span
                            className="text-base shrink-0"
                            title={obtenirInfoLangue(page.langue).nomNatif}
                          >
                            {obtenirInfoLangue(page.langue).drapeau}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {page.chemin}
                      </p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="sm:col-span-2">
                    <span className="text-xs text-muted-foreground">
                      {type.libelle}
                    </span>
                  </div>

                  {/* Statut */}
                  <div className="sm:col-span-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      statut.classe
                    )}>
                      <IconeStatut className="h-3 w-3" />
                      {statut.libelle}
                    </span>
                  </div>

                  {/* Date modification */}
                  <div className="sm:col-span-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(page.misAJourLe).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-1 flex justify-end">
                    {peutSupprimer && page.typePage !== "ACCUEIL" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!site?.id) return;
                          if (confirm(`Supprimer la page « ${page.titre} » ?`)) {
                            mutationSupprimer.mutate({
                              id: page.id,
                              idSite: site.id,
                            });
                          }
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
