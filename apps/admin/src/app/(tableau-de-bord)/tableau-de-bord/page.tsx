"use client";

/**
 * Page principale du tableau de bord.
 * Affiche les statistiques réelles via tRPC et les actions rapides.
 */
import Link from "next/link";
import { Plus, Globe, FileText, Image, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

/** Actions rapides */
const ACTIONS_RAPIDES = [
  {
    libelle: "Créer un site",
    description: "Lancez un nouveau site web en quelques étapes.",
    href: "/tableau-de-bord/sites/nouveau",
    icone: Globe,
  },
  {
    libelle: "Ajouter une page",
    description: "Créez une nouvelle page pour votre site.",
    href: "/tableau-de-bord/pages",
    icone: FileText,
  },
  {
    libelle: "Importer un média",
    description: "Téléversez des images ou fichiers.",
    href: "/tableau-de-bord/medias",
    icone: Image,
  },
];

export default function PageTableauDeBord() {
  const { data: stats } = trpc.sites.compter.useQuery();

  /** Cartes de statistiques avec données réelles */
  const statistiques = [
    { libelle: "Sites", valeur: stats?.nombreSites ?? 0, icone: Globe, href: "/tableau-de-bord/sites" },
    { libelle: "Pages", valeur: stats?.nombrePages ?? 0, icone: FileText, href: "/tableau-de-bord/pages" },
    { libelle: "Médias", valeur: stats?.nombreMedias ?? 0, icone: Image, href: "/tableau-de-bord/medias" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">
        Bienvenue sur Nexora
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Voici un aperçu de votre espace de travail.
      </p>

      {/* ==================== Statistiques ==================== */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {statistiques.map((stat) => {
          const Icone = stat.icone;
          return (
            <Link
              key={stat.libelle}
              href={stat.href}
              className="group rounded-lg border border-border bg-card p-5 hover:border-sky hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-frost/40">
                  <Icone className="h-5 w-5 text-nexora-blue" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="mt-4 text-2xl font-bold text-foreground">
                {stat.valeur}
              </p>
              <p className="text-sm text-muted-foreground">{stat.libelle}</p>
            </Link>
          );
        })}
      </div>

      {/* ==================== Actions rapides ==================== */}
      <h2 className="mt-10 text-lg font-semibold text-foreground">
        Actions rapides
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {ACTIONS_RAPIDES.map((action) => {
          const Icone = action.icone;
          return (
            <Link
              key={action.libelle}
              href={action.href}
              className="group flex flex-col items-start rounded-lg border border-border bg-card p-5 hover:border-sky hover:shadow-md transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-frost/40 group-hover:bg-primary group-hover:text-white transition-colors">
                <Icone className="h-5 w-5 text-nexora-blue group-hover:text-white transition-colors" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">
                {action.libelle}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* ==================== État vide — premier site ==================== */}
      {(!stats || stats.nombreSites === 0) && (
        <div className="mt-10 rounded-lg border-2 border-dashed border-border p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-frost/40 flex items-center justify-center">
            <Plus className="h-6 w-6 text-nexora-blue" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Créer votre premier site
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Choisissez un type de site et commencez à construire votre présence en ligne.
          </p>
          <Link
            href="/tableau-de-bord/sites/nouveau"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau site
          </Link>
        </div>
      )}
    </div>
  );
}
