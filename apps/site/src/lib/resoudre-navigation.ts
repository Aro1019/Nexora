/**
 * Résolution des navigations d'un site pour le rendu public.
 * Convertit les liens internes (page) en URL relatives au site.
 */
import { db } from "@nexora/db";

/** Type d'un élément de menu tel que stocké en base */
interface ElementMenuStocke {
  id: string;
  libelle: string;
  type: "page" | "url" | "categorie";
  idPage?: string;
  url?: string;
  idCategorie?: string;
  ouvrirNouvelOnglet?: boolean;
  enfants?: ElementMenuStocke[];
}

/** Élément résolu prêt à afficher (URL finale calculée) */
export interface ElementMenu {
  id: string;
  libelle: string;
  href: string;
  externe: boolean;
  enfants: ElementMenu[];
}

/** Navigation résolue d'un site */
export interface NavigationResolu {
  libelle: string;
  emplacement: "ENTETE" | "PIED_DE_PAGE" | "BARRE_LATERALE";
  elements: ElementMenu[];
}

/**
 * Résout une navigation pour un emplacement donné.
 * Charge en lot les pages référencées et remplace `idPage` par `chemin`.
 */
export async function resoudreNavigation(
  siteSlug: string,
  idSite: string,
  emplacement: "ENTETE" | "PIED_DE_PAGE" | "BARRE_LATERALE"
): Promise<NavigationResolu | null> {
  const nav = await db.navigation.findUnique({
    where: { idSite_emplacement: { idSite, emplacement } },
  });
  if (!nav) return null;

  const elementsBruts = (
    Array.isArray(nav.elements) ? nav.elements : []
  ) as unknown as ElementMenuStocke[];

  /* Collecte récursive des idPage référencés */
  const idsPages = new Set<string>();
  function collecter(items: ElementMenuStocke[]) {
    for (const item of items) {
      if (item.type === "page" && item.idPage) idsPages.add(item.idPage);
      if (item.enfants && item.enfants.length > 0) collecter(item.enfants);
    }
  }
  collecter(elementsBruts);

  /* Charger les pages en une seule requête */
  const pages =
    idsPages.size > 0
      ? await db.page.findMany({
          where: { id: { in: Array.from(idsPages) } },
          select: {
            id: true,
            chemin: true,
            statut: true,
            typePage: true,
          },
        })
      : [];
  const indexPages = new Map(pages.map((p) => [p.id, p]));

  /* Transformer récursivement les éléments stockés en éléments résolus */
  function resoudre(items: ElementMenuStocke[]): ElementMenu[] {
    return items
      .map((item) => {
        let href = "#";
        let externe = false;

        if (item.type === "url" && item.url) {
          href = item.url;
          externe = item.ouvrirNouvelOnglet ?? /^https?:\/\//.test(item.url);
        } else if (item.type === "page" && item.idPage) {
          const page = indexPages.get(item.idPage);
          if (!page || page.statut !== "PUBLIE") return null;
          /* Page d'accueil → racine du site */
          if (page.typePage === "ACCUEIL") {
            href = `/s/${siteSlug}`;
          } else {
            const chemin = page.chemin.startsWith("/")
              ? page.chemin
              : `/${page.chemin}`;
            href = `/s/${siteSlug}${chemin}`;
          }
        }

        const enfants = item.enfants ? resoudre(item.enfants) : [];
        return {
          id: item.id,
          libelle: item.libelle,
          href,
          externe: !!item.ouvrirNouvelOnglet || externe,
          enfants,
        };
      })
      .filter((e): e is ElementMenu => e !== null);
  }

  return {
    libelle: nav.libelle,
    emplacement: nav.emplacement,
    elements: resoudre(elementsBruts),
  };
}
