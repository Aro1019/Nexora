/**
 * Route principale du rendu public d'un site.
 * URL : /s/[siteSlug]/[[...cheminPage]]
 *  - /s/mon-site            → page d'accueil (langue par défaut)
 *  - /s/mon-site/a-propos   → page "/a-propos" (langue par défaut)
 *  - /s/mon-site/en         → accueil en anglais
 *  - /s/mon-site/en/about   → "/about" en anglais
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  resoudreSiteParSlug,
  resoudrePageAccueil,
  resoudrePageParChemin,
} from "@/lib/resoudre-page";
import { resoudreNavigation } from "@/lib/resoudre-navigation";
import { RendreContenuPage, type Bloc } from "@/composants/rendre-bloc";
import { EnTeteSite } from "@/composants/en-tete-site";
import { PiedSite } from "@/composants/pied-site";
import { ResolutionArchive, VueArchive } from "@/composants/archive-taxonomie";
import { TrackerVue } from "@/composants/tracker-vue";

/** Paramètres de la route dynamique (Next 15 : Promise) */
type Params = Promise<{
  siteSlug: string;
  cheminPage?: string[];
}>;

/** ISR : page mise en cache 60s, régénérée à la demande. */
export const revalidate = 60;

/**
 * Sépare la langue (préfixe) du chemin de page parmi les segments d'URL.
 * - Si le premier segment correspond à une langue activée du site (et qu'elle
 *   n'est pas la langue par défaut), il est consommé comme préfixe de langue.
 * - Sinon, on utilise la langue par défaut et tous les segments font partie du chemin.
 */
function extraireLangueEtChemin(
  segments: string[] | undefined,
  langues: string[],
  langueParDefaut: string
): { langue: string; chemin: string | null } {
  if (!segments || segments.length === 0) {
    return { langue: langueParDefaut, chemin: null };
  }
  const premier = segments[0];
  if (langues.includes(premier) && premier !== langueParDefaut) {
    const reste = segments.slice(1);
    return {
      langue: premier,
      chemin: reste.length === 0 ? null : "/" + reste.join("/"),
    };
  }
  return { langue: langueParDefaut, chemin: "/" + segments.join("/") };
}

/** Métadonnées dynamiques (titre + description SEO) */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { siteSlug, cheminPage } = await params;
  const site = await resoudreSiteParSlug(siteSlug);
  if (!site) return { title: "Site introuvable" };

  const { langue, chemin } = extraireLangueEtChemin(
    cheminPage,
    site.langues,
    site.langueParDefaut
  );

  const page = chemin
    ? await resoudrePageParChemin(site.id, chemin, langue)
    : await resoudrePageAccueil(site.id, langue);

  if (!page) {
    return { title: `${site.nom} — page introuvable` };
  }

  const titre =
    page.titreMeta || site.titreMeta
      ? `${page.titreMeta ?? page.titre} — ${site.nom}`
      : `${page.titre} — ${site.nom}`;

  return {
    title: titre,
    description: page.descriptionMeta ?? site.descriptionMeta ?? undefined,
    robots: page.nonIndexe ? { index: false, follow: false } : undefined,
    openGraph: page.urlImageOG
      ? { images: [{ url: page.urlImageOG }] }
      : undefined,
  };
}

/** Composant de page */
export default async function PageSite({ params }: { params: Params }) {
  const { siteSlug, cheminPage } = await params;
  const site = await resoudreSiteParSlug(siteSlug);
  if (!site) notFound();

  const { langue, chemin } = extraireLangueEtChemin(
    cheminPage,
    site.langues,
    site.langueParDefaut
  );

  /* Détecter une route d'archive : /categorie/[slug] ou /etiquette/[slug] */
  const archiveMatch = chemin
    ? /^\/(categorie|etiquette)\/([a-z0-9-]+)\/?$/.exec(chemin)
    : null;

  const [navEntete, navPied] = await Promise.all([
    resoudreNavigation(site.slug, site.id, "ENTETE"),
    resoudreNavigation(site.slug, site.id, "PIED_DE_PAGE"),
  ]);

  /* Couleurs personnalisées du site (variables CSS) */
  const reglages = site.reglages;
  const stylesSite: React.CSSProperties = reglages
    ? ({
        ["--site-couleur-principale" as string]: reglages.couleurPrincipale,
        ["--site-couleur-accent" as string]: reglages.couleurAccent,
        ["--site-rayon-bordure" as string]: reglages.rayonBordure,
      } as React.CSSProperties)
    : {};

  /* Réseaux sociaux pour le pied de page */
  const liensRS = (reglages?.liensReseauxSociaux as Record<string, string> | null) ?? null;
  const reseauxSociaux = liensRS
    ? Object.entries(liensRS)
        .filter(([, url]) => !!url)
        .map(([reseau, url]) => ({ reseau, url }))
    : [];

  /* Cas archive : on rend la liste filtrée à la place de la page */
  if (archiveMatch) {
    const type = archiveMatch[1] as "categorie" | "etiquette";
    const slugTax = archiveMatch[2];
    const donnees = await ResolutionArchive({
      idSite: site.id,
      slugSite: site.slug,
      langue,
      langueParDefaut: site.langueParDefaut,
      type,
      slug: slugTax,
    });
    if (!donnees) notFound();

    return (
      <div style={stylesSite} className="min-h-screen bg-background" lang={langue}>
        <EnTeteSite
          nomSite={site.nom}
          slugSite={site.slug}
          urlLogo={site.urlLogo}
          elements={navEntete?.elements ?? []}
          langues={site.langues}
          langueCourante={langue}
          langueParDefaut={site.langueParDefaut}
          cheminCourant={chemin ?? "/"}
          apparence={navEntete?.apparence as never}
        />
        <main className="mx-auto max-w-5xl px-6 py-12">
          <VueArchive donnees={donnees} type={type} />
        </main>
        <PiedSite
          nomSite={site.nom}
          slugSite={site.slug}
          urlLogo={site.urlLogo}
          elements={navPied?.elements ?? []}
          apparence={navPied?.apparence as never}
          reseauxSociaux={reseauxSociaux}
        />
        <TrackerVue
          siteSlug={site.slug}
          chemin={chemin ?? "/"}
          langue={langue}
        />
      </div>
    );
  }

  const page = chemin
    ? await resoudrePageParChemin(site.id, chemin, langue)
    : await resoudrePageAccueil(site.id, langue);

  if (!page) notFound();

  /* Le contenu est stocké en JSON dans la base. Cast contrôlé. */
  const blocs = (Array.isArray(page.contenu) ? page.contenu : []) as Bloc[];

  return (
    <div style={stylesSite} className="min-h-screen bg-background" lang={langue}>
      <EnTeteSite
        nomSite={site.nom}
        slugSite={site.slug}
        urlLogo={site.urlLogo}
        elements={navEntete?.elements ?? []}
        langues={site.langues}
        langueCourante={langue}
        langueParDefaut={site.langueParDefaut}
        cheminCourant={chemin ?? "/"}
        apparence={navEntete?.apparence as never}
      />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <RendreContenuPage
          blocs={blocs}
          contexte={{
            idSite: site.id,
            slugSite: site.slug,
            langue,
            langueParDefaut: site.langueParDefaut,
          }}
        />
      </main>

      <PiedSite
        nomSite={site.nom}
        slugSite={site.slug}
        urlLogo={site.urlLogo}
        elements={navPied?.elements ?? []}
        apparence={navPied?.apparence as never}
        reseauxSociaux={reseauxSociaux}
      />
      <TrackerVue
        siteSlug={site.slug}
        chemin={chemin ?? "/"}
        langue={langue}
        idPage={page.id}
      />
    </div>
  );
}
