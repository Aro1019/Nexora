/**
 * Page publique de recherche full-text.
 * URL : /s/[siteSlug]/recherche?q=...
 *
 * Utilise la colonne tsvector `recherche` sur la table `page` via une requête
 * SQL brute (le routeur tRPC `recherche.lister` n'est pas appelé ici car le site
 * est rendu en Server Component et n'a pas de client tRPC initialisé).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, Prisma } from "@nexora/db";
import { resoudreSiteParSlug } from "@/lib/resoudre-page";
import { resoudreNavigation } from "@/lib/resoudre-navigation";
import { EnTeteSite } from "@/composants/en-tete-site";
import { PiedSite } from "@/composants/pied-site";
import { TrackerVue } from "@/composants/tracker-vue";
import * as React from "react";

export const dynamic = "force-dynamic";

type Params = Promise<{ siteSlug: string }>;
type SearchParams = Promise<{ q?: string; type?: string; lang?: string }>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { siteSlug } = await params;
  const { q } = await searchParams;
  const site = await resoudreSiteParSlug(siteSlug);
  return {
    title: `${q ? `« ${q} » — ` : ""}Recherche · ${site?.nom ?? ""}`,
    robots: { index: false, follow: true },
  };
}

interface ResultatBrut {
  id: string;
  titre: string;
  chemin: string;
  type_page: string;
  langue: string;
  extrait: string | null;
  publie_le: Date | null;
  rang: number;
  fragment: string;
}

function choisirConfig(langue?: string): string {
  if (!langue) return "french";
  if (langue.startsWith("en")) return "english";
  if (langue.startsWith("es")) return "spanish";
  if (langue.startsWith("de")) return "german";
  if (langue.startsWith("it")) return "italian";
  if (langue.startsWith("pt")) return "portuguese";
  return "french";
}

function construireRequete(texte: string): string {
  const mots = texte
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((m) => m.trim())
    .filter((m) => m.length >= 2);
  if (mots.length === 0) return "";
  return mots.map((m) => `${m.replace(/'/g, "''")}:*`).join(" & ");
}

export default async function PageRecherche({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { siteSlug } = await params;
  const sp = await searchParams;
  const requeteUtilisateur = (sp.q ?? "").trim();

  const site = await resoudreSiteParSlug(siteSlug);
  if (!site) notFound();

  const [navEntete, navPied] = await Promise.all([
    resoudreNavigation(site.slug, site.id, "ENTETE"),
    resoudreNavigation(site.slug, site.id, "PIED_DE_PAGE"),
  ]);

  const reglages = site.reglages;
  const stylesSite: React.CSSProperties = reglages
    ? ({
        ["--site-couleur-principale" as string]: reglages.couleurPrincipale,
        ["--site-couleur-accent" as string]: reglages.couleurAccent,
        ["--site-rayon-bordure" as string]: reglages.rayonBordure,
      } as React.CSSProperties)
    : {};

  const liensRS = (reglages?.liensReseauxSociaux as Record<string, string> | null) ?? null;
  const reseauxSociaux = liensRS
    ? Object.entries(liensRS)
        .filter(([, url]) => !!url)
        .map(([reseau, url]) => ({ reseau, url }))
    : [];

  let resultats: ResultatBrut[] = [];
  let total = 0;
  if (requeteUtilisateur.length >= 2) {
    const requete = construireRequete(requeteUtilisateur);
    const config = choisirConfig(sp.lang ?? site.langueParDefaut);
    if (requete) {
      const totalRows = await db.$queryRaw<{ total: bigint }[]>(
        Prisma.sql`
          SELECT COUNT(*)::bigint AS total
          FROM page
          WHERE "idSite" = ${site.id}
            AND statut = 'PUBLIE'
            AND "nonIndexe" = false
            AND recherche @@ to_tsquery(${config}::regconfig, ${requete})
        `
      );
      total = Number(totalRows[0]?.total ?? 0n);

      resultats = await db.$queryRaw<ResultatBrut[]>(
        Prisma.sql`
          SELECT
            id,
            titre,
            chemin,
            "typePage"::text AS type_page,
            langue,
            extrait,
            "publieLe" AS publie_le,
            ts_rank_cd(recherche, to_tsquery(${config}::regconfig, ${requete})) AS rang,
            ts_headline(
              ${config}::regconfig,
              COALESCE(extrait, "descriptionMeta", titre),
              to_tsquery(${config}::regconfig, ${requete}),
              'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=10, ShortWord=2'
            ) AS fragment
          FROM page
          WHERE "idSite" = ${site.id}
            AND statut = 'PUBLIE'
            AND "nonIndexe" = false
            AND recherche @@ to_tsquery(${config}::regconfig, ${requete})
          ORDER BY rang DESC, "publieLe" DESC NULLS LAST
          LIMIT 50
        `
      );
    }
  }

  return (
    <div style={stylesSite} className="min-h-screen bg-background" lang={site.langueParDefaut}>
      <EnTeteSite
        nomSite={site.nom}
        slugSite={site.slug}
        urlLogo={site.urlLogo}
        elements={navEntete?.elements ?? []}
        langues={site.langues}
        langueCourante={site.langueParDefaut}
        langueParDefaut={site.langueParDefaut}
        cheminCourant="/recherche"
        apparence={navEntete?.apparence as never}
      />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-6">Recherche</h1>

        <form method="GET" className="mb-8 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={requeteUtilisateur}
            placeholder="Que cherchez-vous ?"
            autoFocus
            className="flex-1 rounded-md border border-border bg-white px-4 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--site-couleur-accent,#3b82f6)] transition-colors"
          />
          <button
            type="submit"
            className="rounded-md bg-[var(--site-couleur-principale,#1e293b)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Rechercher
          </button>
        </form>

        {requeteUtilisateur.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Saisissez un terme pour lancer la recherche.
          </p>
        ) : requeteUtilisateur.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Au moins 2 caractères requis.
          </p>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun résultat pour <strong>« {requeteUtilisateur} »</strong>.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {total} résultat{total > 1 ? "s" : ""} pour{" "}
              <strong>« {requeteUtilisateur} »</strong>
            </p>
            <ul className="space-y-6">
              {resultats.map((r) => {
                const prefixe =
                  r.langue && r.langue !== site.langueParDefaut
                    ? `/${r.langue}`
                    : "";
                const href = `/s/${site.slug}${prefixe}${r.chemin}`;
                return (
                  <li key={r.id} className="border-b border-border pb-6 last:border-0">
                    <Link
                      href={href}
                      className="text-xl font-semibold text-[var(--site-couleur-accent,#1e293b)] hover:underline"
                    >
                      {r.titre}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-mono">{r.chemin}</span>
                      {r.publie_le && (
                        <>
                          <span>·</span>
                          <time dateTime={new Date(r.publie_le).toISOString()}>
                            {new Date(r.publie_le).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </time>
                        </>
                      )}
                    </div>
                    <p
                      className="mt-2 text-sm text-foreground/90 [&>mark]:bg-yellow-200 [&>mark]:text-foreground [&>mark]:rounded [&>mark]:px-0.5"
                      // Le fragment provient de ts_headline avec balises <mark> contrôlées,
                      // pas de contenu utilisateur brut injecté
                      dangerouslySetInnerHTML={{ __html: r.fragment }}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>

      <PiedSite
        nomSite={site.nom}
        slugSite={site.slug}
        urlLogo={site.urlLogo}
        elements={navPied?.elements ?? []}
        apparence={navPied?.apparence as never}
        reseauxSociaux={reseauxSociaux}
      />
      <TrackerVue siteSlug={site.slug} chemin="/recherche" langue={site.langueParDefaut} />
    </div>
  );
}
