/**
 * Middleware Next.js : routage par domaine personnalisé.
 *
 * - Si l'hôte de la requête correspond à un `Site.domainePersonnalise`,
 *   réécrit l'URL vers `/s/{slug}{pathname}` en interne.
 * - Sinon (localhost, *.vercel.app, IP directe), laisse la requête passer
 *   et continue d'utiliser le routage `/s/[siteSlug]/...` existant.
 *
 * Runtime : Node.js (nécessaire pour Prisma).
 */
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@nexora/db";

export const config = {
  runtime: "nodejs",
  /* Exclut les assets statiques pour éviter les requêtes DB inutiles */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};

/** Hôtes considérés comme "natifs" — ne déclenchent pas la résolution par domaine */
const HOTES_NATIFS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

/** Cache mémoire local : domaine → slug (60 s) */
type EntreeCache = { slug: string | null; expire: number };
const cache = new Map<string, EntreeCache>();
const TTL_MS = 60_000;

function estHoteNatif(hote: string): boolean {
  /* Retire le port éventuel pour la comparaison */
  const sansPort = hote.split(":")[0]?.toLowerCase() ?? "";
  if (HOTES_NATIFS.has(sansPort)) return true;
  if (sansPort.endsWith(".localhost")) return true;
  if (sansPort.endsWith(".vercel.app")) return true;
  return false;
}

async function resoudreSlugDepuisDomaine(domaine: string): Promise<string | null> {
  const maintenant = Date.now();
  const enCache = cache.get(domaine);
  if (enCache && enCache.expire > maintenant) {
    return enCache.slug;
  }
  try {
    const site = await db.site.findUnique({
      where: { domainePersonnalise: domaine },
      select: { slug: true, statut: true },
    });
    const slug = site && site.statut !== "ARCHIVE" ? site.slug : null;
    cache.set(domaine, { slug, expire: maintenant + TTL_MS });
    return slug;
  } catch (err) {
    console.error("[middleware] Erreur de résolution du domaine :", err);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const hote = (req.headers.get("host") ?? "").toLowerCase();
  if (!hote || estHoteNatif(hote)) {
    return NextResponse.next();
  }

  const cheminCourant = req.nextUrl.pathname;

  /* Si l'utilisateur a déjà tapé /s/... directement, on ne fait rien */
  if (cheminCourant.startsWith("/s/")) {
    return NextResponse.next();
  }

  const domaine = hote.split(":")[0];
  const slug = await resoudreSlugDepuisDomaine(domaine);
  if (!slug) {
    return NextResponse.next();
  }

  /* Réécriture interne vers la route /s/[siteSlug]/[[...cheminPage]] */
  const url = req.nextUrl.clone();
  const cheminCible =
    cheminCourant === "/" ? `/s/${slug}` : `/s/${slug}${cheminCourant}`;
  url.pathname = cheminCible;
  return NextResponse.rewrite(url);
}
