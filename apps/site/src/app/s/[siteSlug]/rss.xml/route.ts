/**
 * Flux RSS 2.0 du site : derniers articles publiés (toutes langues confondues
 * pour une diffusion exhaustive). Encodage XML strict des entités.
 */
import { db } from "@nexora/db";
import { resoudreSiteParSlug } from "@/lib/resoudre-page";

interface ParamsRoute {
  params: Promise<{ siteSlug: string }>;
}

/** Échappe les caractères XML interdits dans le contenu textuel. */
function echapperXml(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Construit l'URL absolue d'un article en respectant le préfixe de langue. */
function urlAbsolue(
  base: string,
  slugSite: string,
  langueParDefaut: string,
  langue: string,
  chemin: string
): string {
  const cheminPropre = chemin.startsWith("/") ? chemin : `/${chemin}`;
  if (langue === langueParDefaut) {
    return `${base}/s/${slugSite}${cheminPropre}`;
  }
  return `${base}/s/${slugSite}/${langue}${cheminPropre}`;
}

export async function GET(_requete: Request, contexte: ParamsRoute) {
  const { siteSlug } = await contexte.params;
  const site = await resoudreSiteParSlug(siteSlug);
  if (!site) {
    return new Response("Site introuvable", { status: 404 });
  }

  const articles = await db.page.findMany({
    where: {
      idSite: site.id,
      typePage: "ARTICLE",
      statut: "PUBLIE",
    },
    orderBy: { publieLe: "desc" },
    take: 50,
    select: {
      id: true,
      titre: true,
      chemin: true,
      langue: true,
      extrait: true,
      publieLe: true,
    },
  });

  /* Base URL : préférer la variable d'environnement, sinon en-tête host. */
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.URL_BASE_SITE ??
    "http://localhost:3001";

  const titreFlux = echapperXml(site.nom);
  const lienAccueil = `${base}/s/${site.slug}`;
  const description = echapperXml(site.description ?? site.nom);

  const items = articles
    .map((a) => {
      const lien = urlAbsolue(base, site.slug, site.langueParDefaut, a.langue, a.chemin);
      const date = (a.publieLe ?? new Date()).toUTCString();
      return [
        "    <item>",
        `      <title>${echapperXml(a.titre)}</title>`,
        `      <link>${echapperXml(lien)}</link>`,
        `      <guid isPermaLink="true">${echapperXml(lien)}</guid>`,
        `      <pubDate>${date}</pubDate>`,
        a.extrait
          ? `      <description>${echapperXml(a.extrait)}</description>`
          : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${titreFlux}</title>
    <link>${echapperXml(lienAccueil)}</link>
    <description>${description}</description>
    <language>${site.langueParDefaut}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
    },
  });
}
