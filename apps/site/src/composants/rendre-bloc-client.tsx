"use client";

/**
 * Renderer client minimal pour le mode aperçu en direct.
 * Couvre les blocs synchrones. Les blocs asynchrones (formulaire, liste-articles)
 * sont remplacés par un placeholder car ils nécessitent des accès base.
 */
import type * as React from "react";
import Link from "next/link";

export interface BlocApercu {
  id: string;
  type: string;
  proprietes?: Record<string, unknown>;
}

function lireChaine(p: Record<string, unknown>, cle: string, defaut = ""): string {
  const v = p[cle];
  return typeof v === "string" ? v : defaut;
}
function lireNombre(p: Record<string, unknown>, cle: string, defaut = 0): number {
  const v = p[cle];
  return typeof v === "number" ? v : defaut;
}
function lire<T>(p: Record<string, unknown>, cle: string, defaut: T): T {
  return p[cle] !== undefined ? (p[cle] as T) : defaut;
}

function RenduTitre({ p }: { p: Record<string, unknown> }) {
  const niveau = lireChaine(p, "niveau", "h2");
  const texte = lireChaine(p, "texte", "Titre");
  const alignement = lireChaine(p, "alignement", "gauche");
  const classes: Record<string, string> = {
    h1: "text-4xl font-bold tracking-tight",
    h2: "text-3xl font-bold",
    h3: "text-2xl font-semibold",
    h4: "text-xl font-semibold",
  };
  const al: Record<string, string> = {
    gauche: "text-left",
    centre: "text-center",
    droite: "text-right",
  };
  const Tag = (niveau as keyof React.JSX.IntrinsicElements) || "h2";
  return (
    <Tag className={`${classes[niveau] ?? classes.h2} ${al[alignement] ?? al.gauche} text-foreground`}>
      {texte}
    </Tag>
  );
}

function RenduParagraphe({ p }: { p: Record<string, unknown> }) {
  const texte = lireChaine(p, "texte", "");
  const alignement = lireChaine(p, "alignement", "gauche");
  const taille = lireChaine(p, "taille", "moyen");
  const al: Record<string, string> = {
    gauche: "text-left",
    centre: "text-center",
    droite: "text-right",
  };
  const t: Record<string, string> = {
    petit: "text-sm",
    moyen: "text-base",
    grand: "text-lg",
  };
  return (
    <p className={`${al[alignement] ?? al.gauche} ${t[taille] ?? t.moyen} text-foreground/80 whitespace-pre-wrap`}>
      {texte}
    </p>
  );
}

function RenduImage({ p }: { p: Record<string, unknown> }) {
  const url = lireChaine(p, "url", "");
  const texteAlt = lireChaine(p, "texteAlt", "");
  const legende = lireChaine(p, "legende", "");
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
      <img src={url} alt={texteAlt} className="w-full rounded-lg object-cover" />
      {legende && <figcaption className="text-sm text-muted-foreground text-center">{legende}</figcaption>}
    </figure>
  );
}

function RenduBouton({ p }: { p: Record<string, unknown> }) {
  const libelle = lireChaine(p, "libelle", "Cliquez ici");
  const url = lireChaine(p, "url", "#");
  const variante = lireChaine(p, "variante", "principal");
  const alignement = lireChaine(p, "alignement", "gauche");
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

function RenduEspacement({ p }: { p: Record<string, unknown> }) {
  return <div style={{ height: `${lireNombre(p, "hauteur", 48)}px` }} />;
}

function RenduSeparateur() {
  return <hr className="border-t border-border" />;
}

function RenduHero({ p }: { p: Record<string, unknown> }) {
  const titre = lireChaine(p, "titre", "Bienvenue");
  const sousTitre = lireChaine(p, "sousTitre", "");
  const libelleBouton = lireChaine(p, "libelleBouton", "");
  const urlBouton = lireChaine(p, "urlBouton", "#");
  const urlImageFond = lireChaine(p, "urlImageFond", "");
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-midnight via-nexora-blue to-sky py-20 px-8 text-center text-white">
      {urlImageFond && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={urlImageFond} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      )}
      <div className="relative space-y-4">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">{titre}</h1>
        {sousTitre && <p className="text-lg sm:text-xl text-frost max-w-2xl mx-auto">{sousTitre}</p>}
        {libelleBouton && (
          <div className="pt-4">
            <Link
              href={urlBouton}
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-midnight hover:bg-frost transition-colors"
            >
              {libelleBouton}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function RenduColonnes({ p }: { p: Record<string, unknown> }) {
  const nombre = lireNombre(p, "nombre", 2);
  const colonnes = lire<string[]>(p, "colonnes", ["", ""]);
  const grilles: Record<number, string> = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };
  return (
    <div className={`grid gap-6 ${grilles[nombre] ?? grilles[2]}`}>
      {Array.from({ length: nombre }).map((_, i) => (
        <div key={i} className="rounded-lg bg-muted/30 p-6 text-foreground/80 whitespace-pre-wrap">
          {colonnes[i] ?? ""}
        </div>
      ))}
    </div>
  );
}

function RenduVideo({ p }: { p: Record<string, unknown> }) {
  const url = lireChaine(p, "url", "");
  if (!url) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Vidéo non définie
      </div>
    );
  }
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
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

function PlaceholderDynamique({ libelle }: { libelle: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-8 text-center text-sm text-amber-900">
      <p className="font-medium">{libelle}</p>
      <p className="text-xs mt-1 opacity-80">
        Disponible après sauvegarde et rechargement de l&apos;aperçu.
      </p>
    </div>
  );
}

function RendreUnBloc({ bloc }: { bloc: BlocApercu }) {
  const p = bloc.proprietes ?? {};
  switch (bloc.type) {
    case "titre":
      return <RenduTitre p={p} />;
    case "paragraphe":
      return <RenduParagraphe p={p} />;
    case "image":
      return <RenduImage p={p} />;
    case "bouton":
      return <RenduBouton p={p} />;
    case "espacement":
      return <RenduEspacement p={p} />;
    case "separateur":
      return <RenduSeparateur />;
    case "hero":
      return <RenduHero p={p} />;
    case "colonnes":
      return <RenduColonnes p={p} />;
    case "video":
      return <RenduVideo p={p} />;
    case "formulaire":
      return <PlaceholderDynamique libelle="Bloc Formulaire" />;
    case "liste-articles":
      return <PlaceholderDynamique libelle="Bloc Liste d'articles" />;
    default:
      return null;
  }
}

export function RendreBlocClient({ blocs }: { blocs: BlocApercu[] }) {
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
        <RendreUnBloc key={bloc.id} bloc={bloc} />
      ))}
    </div>
  );
}
