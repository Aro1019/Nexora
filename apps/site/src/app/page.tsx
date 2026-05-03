/**
 * Page d'accueil du moteur de rendu — outil de développement.
 * Liste les sites publiés disponibles avec un lien vers leur prévisualisation.
 */
import Link from "next/link";
import { db } from "@nexora/db";

export const dynamic = "force-dynamic";

export default async function PageIndex() {
  const sites = await db.site.findMany({
    where: { statut: { not: "ARCHIVE" } },
    orderBy: { misAJourLe: "desc" },
    select: {
      id: true,
      nom: true,
      slug: true,
      description: true,
      statut: true,
      typeSite: true,
      domainePersonnalise: true,
    },
  });

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Nexora — Moteur de rendu public
          </h1>
          <p className="mt-3 text-muted-foreground">
            Sites disponibles. Cliquez sur un site pour ouvrir sa version
            publique.
          </p>
        </header>

        {sites.length === 0 ? (
          <div className="rounded-2xl border border-border bg-background p-12 text-center">
            <p className="text-muted-foreground">
              Aucun site n&apos;a encore été créé.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {sites.map((site) => (
              <li key={site.id}>
                <Link
                  href={`/s/${site.slug}`}
                  className="block rounded-2xl border border-border bg-background p-6 transition hover:border-primary hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                      {site.nom}
                    </h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        site.statut === "PUBLIE"
                          ? "bg-teal/20 text-teal"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {site.statut.toLowerCase()}
                    </span>
                  </div>
                  {site.description ? (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {site.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground/70">
                    /s/{site.slug}
                    {site.domainePersonnalise
                      ? ` · ${site.domainePersonnalise}`
                      : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
