/**
 * Résolution de site et de pages publiées pour le rendu public.
 * Les fonctions sont des Server Components / Server Actions friendly.
 */
import { db } from "@nexora/db";

/** Résultat de la résolution d'un site */
export type SiteResolu = NonNullable<
  Awaited<ReturnType<typeof resoudreSiteParSlug>>
>;

/**
 * Récupère un site publié par son slug.
 * Retourne null si le site n'existe pas ou est en BROUILLON/ARCHIVE.
 */
export async function resoudreSiteParSlug(slug: string) {
  const site = await db.site.findUnique({
    where: { slug },
    include: {
      reglages: true,
    },
  });

  if (!site) return null;
  if (site.statut === "ARCHIVE") return null;

  return site;
}

/**
 * Récupère un site par son domaine personnalisé.
 * Utilisé en production via le hostname de la requête.
 */
export async function resoudreSiteParDomaine(domaine: string) {
  const site = await db.site.findUnique({
    where: { domainePersonnalise: domaine },
    include: { reglages: true },
  });
  if (!site || site.statut === "ARCHIVE") return null;
  return site;
}

/** Type pour le contenu publié d'une page */
export interface ContenuPagePublie {
  id: string;
  titre: string;
  slug: string;
  chemin: string;
  contenu: unknown;
  titreMeta: string | null;
  descriptionMeta: string | null;
  urlImageOG: string | null;
  nonIndexe: boolean;
  langue: string;
  publieLe: Date | null;
}

/**
 * Récupère la page d'accueil publiée d'un site.
 * Recherche par typePage = ACCUEIL en priorité, sinon par slug "accueil".
 */
export async function resoudrePageAccueil(
  idSite: string,
  langue = "fr"
): Promise<ContenuPagePublie | null> {
  const page = await db.page.findFirst({
    where: {
      idSite,
      langue,
      statut: "PUBLIE",
      typePage: "ACCUEIL",
    },
    include: { versionPubliee: true },
  });

  if (!page) return null;
  return formaterPagePubliee(page);
}

/**
 * Récupère une page publiée par son chemin (sans la langue).
 * Le chemin correspond au champ `chemin` de la base, ex: "/a-propos".
 */
export async function resoudrePageParChemin(
  idSite: string,
  chemin: string,
  langue = "fr"
): Promise<ContenuPagePublie | null> {
  const cheminNormalise = chemin.startsWith("/") ? chemin : `/${chemin}`;

  const page = await db.page.findFirst({
    where: {
      idSite,
      langue,
      statut: "PUBLIE",
      chemin: cheminNormalise,
    },
    include: { versionPubliee: true },
  });

  if (!page) return null;
  return formaterPagePubliee(page);
}

/**
 * Construit la représentation de rendu d'une page publiée.
 * Préfère le contenu de la version publiée; bascule sur le brouillon
 * si aucune version publiée n'est attachée (cas des sites en preview).
 */
function formaterPagePubliee(page: {
  id: string;
  titre: string;
  slug: string;
  chemin: string;
  contenu: unknown;
  titreMeta: string | null;
  descriptionMeta: string | null;
  urlImageOG: string | null;
  nonIndexe: boolean;
  langue: string;
  publieLe: Date | null;
  versionPubliee: {
    contenu: unknown;
    titre: string;
    titreMeta: string | null;
    descriptionMeta: string | null;
  } | null;
}): ContenuPagePublie {
  const versionPubliee = page.versionPubliee;
  return {
    id: page.id,
    titre: versionPubliee?.titre ?? page.titre,
    slug: page.slug,
    chemin: page.chemin,
    contenu: versionPubliee?.contenu ?? page.contenu,
    titreMeta: versionPubliee?.titreMeta ?? page.titreMeta,
    descriptionMeta: versionPubliee?.descriptionMeta ?? page.descriptionMeta,
    urlImageOG: page.urlImageOG,
    nonIndexe: page.nonIndexe,
    langue: page.langue,
    publieLe: page.publieLe,
  };
}
