/**
 * Renderer public des blocs Nexora.
 * Implémentation indépendante de l'éditeur (admin) pour permettre
 * un rendu serveur léger, sans icônes ni dépendances d'édition.
 */
import Link from "next/link";
import type { JSX } from "react";
import { db } from "@nexora/db";
import {
  FormulairePublic,
  type ChampPublic,
} from "@/composants/formulaire-public";

/** Représentation d'un bloc tel qu'enregistré en base */
export interface Bloc {
  id: string;
  type: string;
  proprietes: Record<string, unknown>;
}

/** Lit une propriété typée avec valeur de repli */
function lire<T>(
  proprietes: Record<string, unknown>,
  cle: string,
  defaut: T
): T {
  const valeur = proprietes[cle];
  if (valeur === undefined || valeur === null) return defaut;
  return valeur as T;
}

/** Lit une propriété de type chaîne (élargi à string, pas un littéral) */
function lireChaine(
  proprietes: Record<string, unknown>,
  cle: string,
  defaut = ""
): string {
  const valeur = proprietes[cle];
  if (typeof valeur === "string") return valeur;
  return defaut;
}

/** Lit une propriété numérique */
function lireNombre(
  proprietes: Record<string, unknown>,
  cle: string,
  defaut: number
): number {
  const valeur = proprietes[cle];
  if (typeof valeur === "number") return valeur;
  return defaut;
}

const CLASSES_ALIGNEMENT: Record<string, string> = {
  gauche: "text-left",
  centre: "text-center",
  droite: "text-right",
};

// ============================================
// BLOC TITRE
// ============================================
function RenduTitre({ proprietes }: { proprietes: Record<string, unknown> }) {
  const niveau = lireChaine(proprietes, "niveau", "h2");
  const texte = lireChaine(proprietes, "texte", "Titre");
  const alignement = lireChaine(proprietes, "alignement", "gauche");

  const tailles: Record<string, string> = {
    h1: "text-4xl sm:text-5xl font-bold tracking-tight",
    h2: "text-3xl sm:text-4xl font-bold tracking-tight",
    h3: "text-2xl sm:text-3xl font-semibold",
    h4: "text-xl sm:text-2xl font-semibold",
  };

  const Tag = niveau as keyof JSX.IntrinsicElements;
  return (
    <Tag
      className={`${tailles[niveau] ?? tailles.h2} ${
        CLASSES_ALIGNEMENT[alignement] ?? "text-left"
      }`}
    >
      {texte}
    </Tag>
  );
}

// ============================================
// BLOC PARAGRAPHE
// ============================================
function RenduParagraphe({
  proprietes,
}: {
  proprietes: Record<string, unknown>;
}) {
  const texte = lireChaine(proprietes, "texte", "");
  const alignement = lireChaine(proprietes, "alignement", "gauche");
  const taille = lireChaine(proprietes, "taille", "moyen");

  const tailles: Record<string, string> = {
    petit: "text-sm",
    moyen: "text-base",
    grand: "text-lg",
  };

  return (
    <p
      className={`${tailles[taille] ?? tailles.moyen} ${
        CLASSES_ALIGNEMENT[alignement] ?? "text-left"
      } leading-relaxed text-foreground/80 whitespace-pre-wrap`}
    >
      {texte}
    </p>
  );
}

// ============================================
// BLOC IMAGE
// ============================================
function RenduImage({ proprietes }: { proprietes: Record<string, unknown> }) {
  const url = lireChaine(proprietes, "url", "");
  const texteAlt = lireChaine(proprietes, "texteAlt", "");
  const legende = lireChaine(proprietes, "legende", "");

  if (!url) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Image non définie
      </div>
    );
  }

  return (
    <figure className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={texteAlt}
        className="w-full rounded-lg object-cover"
      />
      {legende ? (
        <figcaption className="text-sm text-muted-foreground text-center">
          {legende}
        </figcaption>
      ) : null}
    </figure>
  );
}

// ============================================
// BLOC BOUTON
// ============================================
function RenduBouton({ proprietes }: { proprietes: Record<string, unknown> }) {
  const libelle = lireChaine(proprietes, "libelle", "Cliquez ici");
  const url = lireChaine(proprietes, "url", "#");
  const variante = lireChaine(proprietes, "variante", "principal");
  const alignement = lireChaine(proprietes, "alignement", "gauche");

  const variantes: Record<string, string> = {
    principal: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondaire: "bg-muted text-foreground hover:bg-muted/80",
    contour:
      "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  };

  const wrapper: Record<string, string> = {
    gauche: "text-left",
    centre: "text-center",
    droite: "text-right",
  };

  return (
    <div className={wrapper[alignement] ?? "text-left"}>
      <Link
        href={url}
        className={`inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium transition-colors ${
          variantes[variante] ?? variantes.principal
        }`}
      >
        {libelle}
      </Link>
    </div>
  );
}

// ============================================
// BLOC ESPACEMENT
// ============================================
function RenduEspacement({
  proprietes,
}: {
  proprietes: Record<string, unknown>;
}) {
  const hauteur = lireNombre(proprietes, "hauteur", 48);
  return <div style={{ height: `${hauteur}px` }} />;
}

// ============================================
// BLOC SÉPARATEUR
// ============================================
function RenduSeparateur() {
  return <hr className="border-t border-border" />;
}

// ============================================
// BLOC HERO
// ============================================
function RenduHero({ proprietes }: { proprietes: Record<string, unknown> }) {
  const titre = lireChaine(proprietes, "titre", "Bienvenue");
  const sousTitre = lireChaine(proprietes, "sousTitre", "");
  const libelleBouton = lireChaine(proprietes, "libelleBouton", "");
  const urlBouton = lireChaine(proprietes, "urlBouton", "#");
  const urlImageFond = lireChaine(proprietes, "urlImageFond", "");

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-midnight via-nexora-blue to-sky py-20 px-8 text-center text-white">
      {urlImageFond ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlImageFond}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      ) : null}
      <div className="relative space-y-4">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          {titre}
        </h1>
        {sousTitre ? (
          <p className="text-lg sm:text-xl text-frost max-w-2xl mx-auto">
            {sousTitre}
          </p>
        ) : null}
        {libelleBouton ? (
          <div className="pt-4">
            <Link
              href={urlBouton}
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-midnight hover:bg-frost transition-colors"
            >
              {libelleBouton}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ============================================
// BLOC COLONNES
// ============================================
function RenduColonnes({
  proprietes,
}: {
  proprietes: Record<string, unknown>;
}) {
  const nombre = lireNombre(proprietes, "nombre", 2);
  const colonnes = lire<string[]>(proprietes, "colonnes", ["", ""]);

  const grilles: Record<number, string> = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid gap-6 ${grilles[nombre] ?? grilles[2]}`}>
      {Array.from({ length: nombre }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg bg-muted/30 p-6 text-foreground/80 whitespace-pre-wrap"
        >
          {colonnes[i] ?? ""}
        </div>
      ))}
    </div>
  );
}

// ============================================
// BLOC VIDEO
// ============================================
function RenduVideo({ proprietes }: { proprietes: Record<string, unknown> }) {
  const url = lireChaine(proprietes, "url", "");
  if (!url) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Vidéo non définie
      </div>
    );
  }

  /* Détection des fournisseurs courants pour transformer en embed */
  const youtube = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  const vimeo = url.match(/vimeo\.com\/(\d+)/);

  let urlEmbed = url;
  if (youtube) urlEmbed = `https://www.youtube.com/embed/${youtube[1]}`;
  else if (vimeo) urlEmbed = `https://player.vimeo.com/video/${vimeo[1]}`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={urlEmbed}
        title="Vidéo intégrée"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// ============================================
// BLOC FORMULAIRE (chargement async)
// ============================================
async function RenduFormulaire({
  proprietes,
}: {
  proprietes: Record<string, unknown>;
}) {
  const idFormulaire = lireChaine(proprietes, "idFormulaire", "");
  if (!idFormulaire) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Aucun formulaire sélectionné.
      </div>
    );
  }

  const formulaire = await db.formulaire.findUnique({
    where: { id: idFormulaire },
    select: {
      id: true,
      nom: true,
      champs: true,
      libelleEnvoi: true,
      messageSucces: true,
    },
  });

  if (!formulaire) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Formulaire introuvable.
      </div>
    );
  }

  const champs = (formulaire.champs as unknown as ChampPublic[]) ?? [];
  return (
    <FormulairePublic
      formulaire={{
        id: formulaire.id,
        nom: formulaire.nom,
        champs,
        libelleEnvoi: formulaire.libelleEnvoi,
        messageSucces: formulaire.messageSucces,
      }}
    />
  );
}

// ============================================
// BLOC LISTE D'ARTICLES
// ============================================
async function RenduListeArticles({
  proprietes,
  contexte,
}: {
  proprietes: Record<string, unknown>;
  contexte: { idSite: string; slugSite: string; langue: string; langueParDefaut: string };
}) {
  const limite = lireNombre(proprietes, "limite", 6);
  const idCategorie = lireChaine(proprietes, "idCategorie", "") || undefined;
  const idEtiquette = lireChaine(proprietes, "idEtiquette", "") || undefined;
  const ordre = lireChaine(proprietes, "ordre", "recent");
  const afficherImage = lire<boolean>(proprietes, "afficherImage", true);
  const afficherExtrait = lire<boolean>(proprietes, "afficherExtrait", true);

  const filtres: Record<string, unknown> = {
    idSite: contexte.idSite,
    typePage: "ARTICLE",
    statut: "PUBLIE",
    langue: contexte.langue,
  };
  if (idCategorie) {
    filtres.categoriesPage = { some: { idCategorie } };
  }
  if (idEtiquette) {
    filtres.etiquettesPage = { some: { idEtiquette } };
  }

  const orderBy =
    ordre === "alphabetique"
      ? { titre: "asc" as const }
      : ordre === "ancien"
        ? { publieLe: "asc" as const }
        : { publieLe: "desc" as const };

  const articles = await db.page.findMany({
    where: filtres,
    orderBy,
    take: Math.min(Math.max(limite, 1), 50),
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

  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Aucun article publié pour le moment.
      </div>
    );
  }

  /** Construit l'URL d'un article en respectant le préfixe de langue. */
  function urlArticle(chemin: string, langue: string): string {
    const cheminPropre = chemin.startsWith("/") ? chemin : `/${chemin}`;
    if (langue === contexte.langueParDefaut) {
      return `/s/${contexte.slugSite}${cheminPropre}`;
    }
    return `/s/${contexte.slugSite}/${langue}${cheminPropre}`;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {articles.map((a) => (
        <Link
          key={a.id}
          href={urlArticle(a.chemin, a.langue)}
          className="group rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg"
        >
          {afficherImage && a.imageMiseEnAvant ? (
            // eslint-disable-next-line @next/next/no-img-element
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
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {a.titre}
            </h3>
            {afficherExtrait && a.extrait && (
              <p className="mt-2 text-sm text-foreground/70 line-clamp-3">
                {a.extrait}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Contexte du site rendu (utile aux blocs dynamiques comme la liste d'articles). */
export interface ContexteRenduSite {
  idSite: string;
  slugSite: string;
  langue: string;
  langueParDefaut: string;
}

/** Rend un bloc selon son type. Renvoie null pour les types inconnus. */
export function RendreBloc({
  bloc,
  contexte,
}: {
  bloc: Bloc;
  contexte?: ContexteRenduSite;
}) {
  const proprietes = bloc.proprietes ?? {};
  switch (bloc.type) {
    case "titre":
      return <RenduTitre proprietes={proprietes} />;
    case "paragraphe":
      return <RenduParagraphe proprietes={proprietes} />;
    case "image":
      return <RenduImage proprietes={proprietes} />;
    case "bouton":
      return <RenduBouton proprietes={proprietes} />;
    case "espacement":
      return <RenduEspacement proprietes={proprietes} />;
    case "separateur":
      return <RenduSeparateur />;
    case "hero":
      return <RenduHero proprietes={proprietes} />;
    case "colonnes":
      return <RenduColonnes proprietes={proprietes} />;
    case "video":
      return <RenduVideo proprietes={proprietes} />;
    case "formulaire":
      return <RenduFormulaire proprietes={proprietes} />;
    case "liste-articles":
      if (!contexte) return null;
      return <RenduListeArticles proprietes={proprietes} contexte={contexte} />;
    default:
      return null;
  }
}

/** Rend une suite de blocs avec un espacement vertical cohérent. */
export function RendreContenuPage({
  blocs,
  contexte,
}: {
  blocs: Bloc[];
  contexte?: ContexteRenduSite;
}) {
  if (!Array.isArray(blocs) || blocs.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Cette page n&apos;a pas encore de contenu.
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {blocs.map((bloc) => (
        <RendreBloc key={bloc.id} bloc={bloc} contexte={contexte} />
      ))}
    </div>
  );
}

