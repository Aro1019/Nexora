"use client";

/**
 * Page "Mes sites" — affiche la liste des sites de l'utilisateur.
 * Utilise tRPC pour charger les données réelles.
 */
import Link from "next/link";
import { Plus, Globe, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

/** Libellés français pour les types de site */
const LIBELLE_TYPE: Record<string, string> = {
  VITRINE: "Vitrine",
  BLOG: "Blog",
  PORTFOLIO: "Portfolio",
  ECOMMERCE: "E-commerce",
};

/** Libellés et couleurs des statuts */
const LIBELLE_STATUT: Record<string, { libelle: string; classe: string }> = {
  BROUILLON: { libelle: "Brouillon", classe: "bg-muted text-muted-foreground" },
  PUBLIE: { libelle: "Publié", classe: "bg-success/20 text-success-foreground" },
  MAINTENANCE: { libelle: "Maintenance", classe: "bg-amber-100 text-amber-800" },
  ARCHIVE: { libelle: "Archivé", classe: "bg-destructive/10 text-destructive" },
};

export default function PageSites() {
  const { data: sites, isLoading } = trpc.sites.lister.useQuery();

  return (
    <div>
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-midnight">Mes sites</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez tous vos sites web depuis un seul endroit.
          </p>
        </div>
        <Link
          href="/tableau-de-bord/sites/nouveau"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau site
        </Link>
      </div>

      {isLoading ? (
        /* ==================== Chargement ==================== */
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !sites || sites.length === 0 ? (
        /* ==================== État vide ==================== */
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-frost/40 flex items-center justify-center">
            <Globe className="h-8 w-8 text-nexora-blue" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-foreground">
            Aucun site pour le moment
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Créez votre premier site web en quelques clics. Choisissez entre
            une vitrine, un blog, un portfolio ou une boutique e-commerce.
          </p>
          <Link
            href="/tableau-de-bord/sites/nouveau"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer mon premier site
          </Link>
        </div>
      ) : (
        /* ==================== Grille de sites ==================== */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const statut = LIBELLE_STATUT[site.statut] || LIBELLE_STATUT.BROUILLON;
            return (
              <Link
                key={site.id}
                href={`/tableau-de-bord/sites/${site.slug}`}
                className="group rounded-lg border border-border bg-card p-5 hover:border-sky hover:shadow-md transition-all"
              >
                {/* Icône et type */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-frost/40">
                    <Globe className="h-5 w-5 text-nexora-blue" />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statut.classe}`}
                  >
                    {statut.libelle}
                  </span>
                </div>

                {/* Nom et slug */}
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                  {site.nom}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {LIBELLE_TYPE[site.typeSite] || site.typeSite} · /{site.slug}
                </p>

                {/* Lien d'accès */}
                <div className="mt-4 flex items-center text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  Gérer le site
                  <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
