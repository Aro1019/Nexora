/**
 * Pages d'archive : liste des articles d'une catégorie ou étiquette.
 * Composants serveur sans état utilisés par la route publique.
 */
import Link from "next/link";
import { db } from "@nexora/db";

interface PropsArchive {
  idSite: string;
  slugSite: string;
  langue: string;
  langueParDefaut: string;
  /** "categorie" ou "etiquette" */
  type: "categorie" | "etiquette";
  slug: string;
}

/** Construit l'URL d'un article en respectant le préfixe de langue. */
function urlArticle(
  slugSite: string,
  langueParDefaut: string,
  langue: string,
  chemin: string
): string {
  const cheminPropre = chemin.startsWith("/") ? chemin : `/${chemin}`;
  if (langue === langueParDefaut) return `/s/${slugSite}${cheminPropre}`;
  return `/s/${slugSite}/${langue}${cheminPropre}`;
}

export async function ResolutionArchive(params: PropsArchive) {
  const { idSite, slugSite, langue, langueParDefaut, type, slug } = params;

  /* Charger la taxonomie demandée */
  if (type === "categorie") {
    const cat = await db.categorie.findUnique({
      where: { idSite_slug: { idSite, slug } },
    });
    if (!cat) return null;

    const articles = await db.page.findMany({
      where: {
        idSite,
        typePage: "ARTICLE",
        statut: "PUBLIE",
        langue,
        categoriesPage: { some: { idCategorie: cat.id } },
      },
      orderBy: { publieLe: "desc" },
      select: {
        id: true,
        titre: true,
        chemin: true,
        slug: true,
        langue: true,
        extrait: true,
        imageMiseEnAvant: true,
        publieLe: true,
      },
    });

    return {
      titre: cat.nom,
      description: cat.description,
      articles,
      slugSite,
      langue,
      langueParDefaut,
    };
  }

  const et = await db.etiquette.findUnique({
    where: { idSite_slug: { idSite, slug } },
  });
  if (!et) return null;

  const articles = await db.page.findMany({
    where: {
      idSite,
      typePage: "ARTICLE",
      statut: "PUBLIE",
      langue,
      etiquettesPage: { some: { idEtiquette: et.id } },
    },
    orderBy: { publieLe: "desc" },
    select: {
      id: true,
      titre: true,
      chemin: true,
      slug: true,
      langue: true,
      extrait: true,
      imageMiseEnAvant: true,
      publieLe: true,
    },
  });

  return {
    titre: et.nom,
    description: null as string | null,
    articles,
    slugSite,
    langue,
    langueParDefaut,
  };
}

export function VueArchive({
  donnees,
  type,
}: {
  donnees: NonNullable<Awaited<ReturnType<typeof ResolutionArchive>>>;
  type: "categorie" | "etiquette";
}) {
  return (
    <section className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
          {type === "categorie" ? "Catégorie" : "Étiquette"}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {donnees.titre}
        </h1>
        {donnees.description && (
          <p className="mt-3 text-base text-foreground/70 max-w-2xl">
            {donnees.description}
          </p>
        )}
      </header>

      {donnees.articles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Aucun article publié pour le moment.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {donnees.articles.map((a) => (
            <Link
              key={a.id}
              href={urlArticle(donnees.slugSite, donnees.langueParDefaut, a.langue, a.chemin)}
              className="group rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg"
            >
              {a.imageMiseEnAvant ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={a.imageMiseEnAvant}
                  alt={a.titre}
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : null}
              <div className="p-5">
                {a.publieLe && (
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    {new Date(a.publieLe).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {a.titre}
                </h2>
                {a.extrait && (
                  <p className="mt-2 text-sm text-foreground/70 line-clamp-3">
                    {a.extrait}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
