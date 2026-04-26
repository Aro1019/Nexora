"use client";

/**
 * Page de détail d'un site — affiche les infos, stats et navigation.
 */
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  FileText,
  Image,
  Users,
  Settings,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Menu,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

/** Libellés des types de site */
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

/** Onglets de navigation du site */
const ONGLETS = [
  { libelle: "Pages", suffixe: "pages", icone: FileText },
  { libelle: "Médias", suffixe: "medias", icone: Image },
  { libelle: "Navigation", suffixe: "navigation", icone: Menu },
  { libelle: "Membres", suffixe: "membres", icone: Users },
  { libelle: "Réglages", suffixe: "reglages", icone: Settings },
] as const;

export default function PageDetailSite() {
  const params = useParams<{ slug: string }>();
  const { data: site, isLoading } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-foreground">Site introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce site n&apos;existe pas ou vous n&apos;y avez pas accès.
        </p>
        <Link
          href="/tableau-de-bord/sites"
          className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux sites
        </Link>
      </div>
    );
  }

  const statut = LIBELLE_STATUT[site.statut] || LIBELLE_STATUT.BROUILLON;

  return (
    <div>
      {/* Retour */}
      <Link
        href="/tableau-de-bord/sites"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Mes sites
      </Link>

      {/* En-tête du site */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-frost/40 shrink-0">
            <Globe className="h-6 w-6 text-nexora-blue" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-midnight">{site.nom}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statut.classe}`}>
                {statut.libelle}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {LIBELLE_TYPE[site.typeSite]} · /{site.slug}
            </p>
            {site.description && (
              <p className="mt-2 text-sm text-foreground">{site.description}</p>
            )}
          </div>
        </div>

        {site.statut === "PUBLIE" && (
          <a
            href={`https://${site.domainePersonnalise || site.slug + ".nexora.app"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Voir le site
          </a>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-8">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{site._count.pages}</p>
          <p className="text-xs text-muted-foreground">Pages</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{site._count.medias}</p>
          <p className="text-xs text-muted-foreground">Médias</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{site.membres.length}</p>
          <p className="text-xs text-muted-foreground">Membres</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{site._count.navigations}</p>
          <p className="text-xs text-muted-foreground">Menus</p>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-6 -mb-px">
          {ONGLETS.map((onglet) => {
            const Icone = onglet.icone;
            return (
              <Link
                key={onglet.suffixe}
                href={`/tableau-de-bord/sites/${params.slug}/${onglet.suffixe}`}
                className="flex items-center gap-2 border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                <Icone className="h-4 w-4" />
                {onglet.libelle}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Contenu par défaut — aperçu */}
      <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Sélectionnez un onglet ci-dessus pour gérer votre site.
        </p>
      </div>
    </div>
  );
}
