/**
 * Registre des types de blocs disponibles dans l'éditeur.
 * Chaque entrée définit l'icône, le libellé, les propriétés par défaut,
 * le composant de rendu et le composant d'édition des propriétés.
 */
import { useState, type ComponentType, type JSX } from "react";
import {
  Heading,
  Type,
  Image as IconeImage,
  MousePointerClick,
  Minus,
  ArrowsUpFromLine,
  Sparkles,
  Columns2,
  Video,
  Inbox,
  FolderOpen,
  Newspaper,
} from "lucide-react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import type { IdTypeBloc, Bloc } from "./types";
import { SelecteurMedia } from "./selecteur-media";

/** Props passées à un composant de rendu de bloc */
export interface PropsRenduBloc {
  bloc: Bloc;
  enEdition?: boolean;
  /** Si fourni, le bloc supporte l'édition inline (utilisé par titre/paragraphe) */
  surEditionInline?: (proprietes: Record<string, unknown>) => void;
}

/** Props passées au composant d'édition des propriétés */
export interface PropsEditionProprietes {
  bloc: Bloc;
  surChangement: (proprietes: Record<string, unknown>) => void;
}

/** Définition complète d'un type de bloc */
export interface DefinitionBloc {
  id: IdTypeBloc;
  libelle: string;
  description: string;
  icone: ComponentType<{ className?: string }>;
  categorie: "base" | "media" | "structure" | "section";
  proprietesParDefaut: Record<string, unknown>;
  Rendu: ComponentType<PropsRenduBloc>;
  Edition: ComponentType<PropsEditionProprietes>;
}

// ============================================
// BLOC TITRE
// ============================================
const RenduTitre = ({ bloc, surEditionInline }: PropsRenduBloc) => {
  const niveau = (bloc.proprietes.niveau as string) || "h2";
  const texte = (bloc.proprietes.texte as string) || "Titre";
  const alignement = (bloc.proprietes.alignement as string) || "gauche";

  const classesTaille: Record<string, string> = {
    h1: "text-4xl sm:text-5xl font-bold tracking-tight",
    h2: "text-3xl sm:text-4xl font-bold tracking-tight",
    h3: "text-2xl sm:text-3xl font-semibold",
    h4: "text-xl sm:text-2xl font-semibold",
  };
  const classesAlign: Record<string, string> = {
    gauche: "text-left",
    centre: "text-center",
    droite: "text-right",
  };

  const Tag = niveau as keyof JSX.IntrinsicElements;
  const classeBase = `${classesTaille[niveau]} ${classesAlign[alignement]} text-foreground`;

  if (surEditionInline) {
    return (
      <Tag
        contentEditable
        suppressContentEditableWarning
        onBlur={(e: React.FocusEvent<Element>) => {
          const nouveau = (e.currentTarget as HTMLElement).textContent ?? "";
          if (nouveau !== texte) {
            surEditionInline({ ...bloc.proprietes, texte: nouveau });
          }
        }}
        className={`${classeBase} outline-none focus:ring-2 focus:ring-sky/40 rounded-md px-1 -mx-1`}
        spellCheck
      >
        {texte}
      </Tag>
    );
  }

  return <Tag className={classeBase}>{texte}</Tag>;
};

const EditionTitre = ({ bloc, surChangement }: PropsEditionProprietes) => (
  <div className="space-y-4">
    <ChampTexte
      libelle="Texte du titre"
      valeur={(bloc.proprietes.texte as string) || ""}
      surChangement={(v) => surChangement({ ...bloc.proprietes, texte: v })}
    />
    <ChampSelection
      libelle="Niveau"
      valeur={(bloc.proprietes.niveau as string) || "h2"}
      options={[
        { valeur: "h1", libelle: "H1 — Très grand" },
        { valeur: "h2", libelle: "H2 — Grand" },
        { valeur: "h3", libelle: "H3 — Moyen" },
        { valeur: "h4", libelle: "H4 — Petit" },
      ]}
      surChangement={(v) => surChangement({ ...bloc.proprietes, niveau: v })}
    />
    <ChampAlignement
      valeur={(bloc.proprietes.alignement as string) || "gauche"}
      surChangement={(v) => surChangement({ ...bloc.proprietes, alignement: v })}
    />
  </div>
);

// ============================================
// BLOC PARAGRAPHE
// ============================================
const RenduParagraphe = ({ bloc, surEditionInline }: PropsRenduBloc) => {
  const texte = (bloc.proprietes.texte as string) || "Tapez votre texte ici…";
  const alignement = (bloc.proprietes.alignement as string) || "gauche";
  const taille = (bloc.proprietes.taille as string) || "moyen";

  const classesAlign: Record<string, string> = {
    gauche: "text-left",
    centre: "text-center",
    droite: "text-right",
  };
  const classesTaille: Record<string, string> = {
    petit: "text-sm",
    moyen: "text-base",
    grand: "text-lg",
  };
  const classeBase = `${classesAlign[alignement]} ${classesTaille[taille]} text-foreground/85 leading-relaxed`;

  if (surEditionInline) {
    return (
      <p
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const nouveau = e.currentTarget.textContent ?? "";
          if (nouveau !== texte) {
            surEditionInline({ ...bloc.proprietes, texte: nouveau });
          }
        }}
        className={`${classeBase} outline-none focus:ring-2 focus:ring-sky/40 rounded-md px-1 -mx-1 whitespace-pre-wrap`}
        spellCheck
      >
        {texte}
      </p>
    );
  }

  return <p className={classeBase}>{texte}</p>;
};

const EditionParagraphe = ({ bloc, surChangement }: PropsEditionProprietes) => (
  <div className="space-y-4">
    <ChampZoneTexte
      libelle="Texte"
      valeur={(bloc.proprietes.texte as string) || ""}
      surChangement={(v) => surChangement({ ...bloc.proprietes, texte: v })}
    />
    <ChampSelection
      libelle="Taille"
      valeur={(bloc.proprietes.taille as string) || "moyen"}
      options={[
        { valeur: "petit", libelle: "Petit" },
        { valeur: "moyen", libelle: "Moyen" },
        { valeur: "grand", libelle: "Grand" },
      ]}
      surChangement={(v) => surChangement({ ...bloc.proprietes, taille: v })}
    />
    <ChampAlignement
      valeur={(bloc.proprietes.alignement as string) || "gauche"}
      surChangement={(v) => surChangement({ ...bloc.proprietes, alignement: v })}
    />
  </div>
);

// ============================================
// BLOC IMAGE
// ============================================
const RenduImage = ({ bloc }: PropsRenduBloc) => {
  const url = (bloc.proprietes.url as string) || "";
  const alt = (bloc.proprietes.alt as string) || "";
  const arrondi = (bloc.proprietes.arrondi as string) || "moyen";
  const largeur = (bloc.proprietes.largeur as string) || "complete";

  const classesArrondi: Record<string, string> = {
    aucun: "rounded-none",
    petit: "rounded-md",
    moyen: "rounded-xl",
    grand: "rounded-2xl",
    cercle: "rounded-full aspect-square object-cover",
  };
  const classesLargeur: Record<string, string> = {
    complete: "w-full",
    grande: "w-full max-w-2xl mx-auto",
    moyenne: "w-full max-w-md mx-auto",
    petite: "w-full max-w-xs mx-auto",
  };

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-12 text-muted-foreground">
        <IconeImage className="h-10 w-10 mb-2 opacity-40" />
        <p className="text-sm">Image non définie</p>
        <p className="text-xs opacity-70">Ouvrez le panneau de droite pour ajouter une URL</p>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={alt}
      className={`${classesArrondi[arrondi]} ${classesLargeur[largeur]} h-auto`}
    />
  );
};

const EditionImage = ({ bloc, surChangement }: PropsEditionProprietes) => (
  <div className="space-y-4">
    <ChampImage
      libelle="Image"
      valeur={(bloc.proprietes.url as string) || ""}
      surChangement={(url, alt) =>
        surChangement({
          ...bloc.proprietes,
          url,
          alt: alt ?? (bloc.proprietes.alt as string) ?? "",
        })
      }
    />
    <ChampTexte
      libelle="Texte alternatif"
      valeur={(bloc.proprietes.alt as string) || ""}
      placeholder="Description de l'image"
      surChangement={(v) => surChangement({ ...bloc.proprietes, alt: v })}
    />
    <ChampSelection
      libelle="Largeur"
      valeur={(bloc.proprietes.largeur as string) || "complete"}
      options={[
        { valeur: "complete", libelle: "Pleine largeur" },
        { valeur: "grande", libelle: "Grande" },
        { valeur: "moyenne", libelle: "Moyenne" },
        { valeur: "petite", libelle: "Petite" },
      ]}
      surChangement={(v) => surChangement({ ...bloc.proprietes, largeur: v })}
    />
    <ChampSelection
      libelle="Arrondi"
      valeur={(bloc.proprietes.arrondi as string) || "moyen"}
      options={[
        { valeur: "aucun", libelle: "Aucun" },
        { valeur: "petit", libelle: "Petit" },
        { valeur: "moyen", libelle: "Moyen" },
        { valeur: "grand", libelle: "Grand" },
        { valeur: "cercle", libelle: "Cercle" },
      ]}
      surChangement={(v) => surChangement({ ...bloc.proprietes, arrondi: v })}
    />
  </div>
);

// ============================================
// BLOC BOUTON
// ============================================
const RenduBouton = ({ bloc }: PropsRenduBloc) => {
  const texte = (bloc.proprietes.texte as string) || "Cliquez ici";
  const url = (bloc.proprietes.url as string) || "#";
  const variante = (bloc.proprietes.variante as string) || "principal";
  const alignement = (bloc.proprietes.alignement as string) || "gauche";

  const classesVariante: Record<string, string> = {
    principal:
      "bg-gradient-to-r from-nexora-blue to-sky text-white shadow-lg shadow-nexora-blue/25 hover:shadow-xl hover:shadow-nexora-blue/35",
    secondaire:
      "border border-input bg-card text-foreground hover:bg-muted/50",
    fantome: "text-sky hover:text-nexora-blue hover:bg-sky/5",
  };
  const classesAlign: Record<string, string> = {
    gauche: "justify-start",
    centre: "justify-center",
    droite: "justify-end",
  };

  return (
    <div className={`flex ${classesAlign[alignement]}`}>
      <a
        href={url}
        className={`inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${classesVariante[variante]}`}
      >
        {texte}
      </a>
    </div>
  );
};

const EditionBouton = ({ bloc, surChangement }: PropsEditionProprietes) => (
  <div className="space-y-4">
    <ChampTexte
      libelle="Texte du bouton"
      valeur={(bloc.proprietes.texte as string) || ""}
      surChangement={(v) => surChangement({ ...bloc.proprietes, texte: v })}
    />
    <ChampTexte
      libelle="Lien (URL)"
      valeur={(bloc.proprietes.url as string) || ""}
      placeholder="https://... ou /chemin"
      surChangement={(v) => surChangement({ ...bloc.proprietes, url: v })}
    />
    <ChampSelection
      libelle="Style"
      valeur={(bloc.proprietes.variante as string) || "principal"}
      options={[
        { valeur: "principal", libelle: "Principal" },
        { valeur: "secondaire", libelle: "Secondaire" },
        { valeur: "fantome", libelle: "Fantôme" },
      ]}
      surChangement={(v) => surChangement({ ...bloc.proprietes, variante: v })}
    />
    <ChampAlignement
      valeur={(bloc.proprietes.alignement as string) || "gauche"}
      surChangement={(v) => surChangement({ ...bloc.proprietes, alignement: v })}
    />
  </div>
);

// ============================================
// BLOC ESPACEMENT
// ============================================
const RenduEspacement = ({ bloc, enEdition }: PropsRenduBloc) => {
  const hauteur = (bloc.proprietes.hauteur as number) || 48;
  return (
    <div
      style={{ height: `${hauteur}px` }}
      className={
        enEdition
          ? "bg-sky/5 border border-dashed border-sky/30 rounded-md flex items-center justify-center text-xs text-sky/60"
          : ""
      }
    >
      {enEdition && <span>Espacement {hauteur}px</span>}
    </div>
  );
};

const EditionEspacement = ({ bloc, surChangement }: PropsEditionProprietes) => (
  <div className="space-y-4">
    <ChampNombre
      libelle="Hauteur (px)"
      valeur={(bloc.proprietes.hauteur as number) || 48}
      min={8}
      max={400}
      surChangement={(v) => surChangement({ ...bloc.proprietes, hauteur: v })}
    />
  </div>
);

// ============================================
// BLOC SÉPARATEUR
// ============================================
const RenduSeparateur = ({ bloc }: PropsRenduBloc) => {
  const style = (bloc.proprietes.style as string) || "ligne";
  if (style === "points") {
    return (
      <div className="flex justify-center gap-2 py-4">
        <span className="w-1.5 h-1.5 rounded-full bg-border" />
        <span className="w-1.5 h-1.5 rounded-full bg-border" />
        <span className="w-1.5 h-1.5 rounded-full bg-border" />
      </div>
    );
  }
  if (style === "gradient") {
    return <hr className="border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />;
  }
  return <hr className="border-0 h-px bg-border" />;
};

const EditionSeparateur = ({ bloc, surChangement }: PropsEditionProprietes) => (
  <div className="space-y-4">
    <ChampSelection
      libelle="Style"
      valeur={(bloc.proprietes.style as string) || "ligne"}
      options={[
        { valeur: "ligne", libelle: "Ligne" },
        { valeur: "gradient", libelle: "Gradient" },
        { valeur: "points", libelle: "Points" },
      ]}
      surChangement={(v) => surChangement({ ...bloc.proprietes, style: v })}
    />
  </div>
);

// ============================================
// BLOC HERO
// ============================================
const RenduHero = ({ bloc }: PropsRenduBloc) => {
  const titre = (bloc.proprietes.titre as string) || "Un titre captivant";
  const sousTitre = (bloc.proprietes.sousTitre as string) || "Description percutante de votre offre.";
  const texteBouton = (bloc.proprietes.texteBouton as string) || "Découvrir";
  const urlBouton = (bloc.proprietes.urlBouton as string) || "#";
  const imageFond = (bloc.proprietes.imageFond as string) || "";

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-nexora-blue via-sky to-teal py-16 sm:py-20 lg:py-24 px-6 sm:px-10 text-center"
      style={
        imageFond
          ? {
              backgroundImage: `linear-gradient(rgba(6,24,46,0.6), rgba(6,24,46,0.4)), url(${imageFond})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
      <div className="relative max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">{titre}</h1>
        <p className="mt-5 text-base sm:text-lg text-white/80 leading-relaxed">{sousTitre}</p>
        <a
          href={urlBouton}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white text-nexora-blue px-7 py-3 text-sm font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
        >
          {texteBouton}
        </a>
      </div>
    </section>
  );
};

const EditionHero = ({ bloc, surChangement }: PropsEditionProprietes) => (
  <div className="space-y-4">
    <ChampTexte
      libelle="Titre principal"
      valeur={(bloc.proprietes.titre as string) || ""}
      surChangement={(v) => surChangement({ ...bloc.proprietes, titre: v })}
    />
    <ChampZoneTexte
      libelle="Sous-titre"
      valeur={(bloc.proprietes.sousTitre as string) || ""}
      surChangement={(v) => surChangement({ ...bloc.proprietes, sousTitre: v })}
    />
    <ChampTexte
      libelle="Texte du bouton"
      valeur={(bloc.proprietes.texteBouton as string) || ""}
      surChangement={(v) => surChangement({ ...bloc.proprietes, texteBouton: v })}
    />
    <ChampTexte
      libelle="Lien du bouton"
      valeur={(bloc.proprietes.urlBouton as string) || ""}
      placeholder="https://..."
      surChangement={(v) => surChangement({ ...bloc.proprietes, urlBouton: v })}
    />
    <ChampImage
      libelle="Image de fond (optionnel)"
      valeur={(bloc.proprietes.imageFond as string) || ""}
      surChangement={(url) => surChangement({ ...bloc.proprietes, imageFond: url })}
    />
  </div>
);

// ============================================
// BLOC COLONNES (2 colonnes simples)
// ============================================
const RenduColonnes = ({ bloc }: PropsRenduBloc) => {
  const colonneGauche = (bloc.proprietes.colonneGauche as string) || "Contenu de la colonne de gauche.";
  const colonneDroite = (bloc.proprietes.colonneDroite as string) || "Contenu de la colonne de droite.";

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-6 text-foreground/85 leading-relaxed">
        {colonneGauche}
      </div>
      <div className="rounded-xl border border-border bg-card p-6 text-foreground/85 leading-relaxed">
        {colonneDroite}
      </div>
    </div>
  );
};

const EditionColonnes = ({ bloc, surChangement }: PropsEditionProprietes) => (
  <div className="space-y-4">
    <ChampZoneTexte
      libelle="Colonne de gauche"
      valeur={(bloc.proprietes.colonneGauche as string) || ""}
      surChangement={(v) => surChangement({ ...bloc.proprietes, colonneGauche: v })}
    />
    <ChampZoneTexte
      libelle="Colonne de droite"
      valeur={(bloc.proprietes.colonneDroite as string) || ""}
      surChangement={(v) => surChangement({ ...bloc.proprietes, colonneDroite: v })}
    />
  </div>
);

// ============================================
// BLOC VIDÉO (embed YouTube/Vimeo)
// ============================================
const RenduVideo = ({ bloc }: PropsRenduBloc) => {
  const url = (bloc.proprietes.url as string) || "";

  // Conversion YouTube watch → embed
  let urlEmbed = url;
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (youtubeMatch) {
    urlEmbed = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-12 text-muted-foreground">
        <Video className="h-10 w-10 mb-2 opacity-40" />
        <p className="text-sm">Vidéo non définie</p>
        <p className="text-xs opacity-70">Ajoutez une URL YouTube ou Vimeo</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black">
      <iframe
        src={urlEmbed}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Vidéo intégrée"
      />
    </div>
  );
};

const EditionVideo = ({ bloc, surChangement }: PropsEditionProprietes) => (
  <div className="space-y-4">
    <ChampTexte
      libelle="URL de la vidéo"
      valeur={(bloc.proprietes.url as string) || ""}
      placeholder="https://www.youtube.com/watch?v=..."
      surChangement={(v) => surChangement({ ...bloc.proprietes, url: v })}
    />
  </div>
);

// ============================================
// BLOC FORMULAIRE (référence à un formulaire du site)
// ============================================
const RenduFormulaire = ({ bloc }: PropsRenduBloc) => {
  const params = useParams<{ slug?: string }>();
  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug }
  );
  const idFormulaire = (bloc.proprietes.idFormulaire as string) || "";
  const { data: formulaire } = trpc.formulaires.obtenir.useQuery(
    { id: idFormulaire },
    { enabled: !!idFormulaire }
  );

  if (!idFormulaire) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-12 text-muted-foreground">
        <Inbox className="h-10 w-10 mb-2 opacity-40" />
        <p className="text-sm">Aucun formulaire sélectionné</p>
        <p className="text-xs opacity-70">Choisissez un formulaire dans le panneau de droite</p>
      </div>
    );
  }

  if (!formulaire) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        Chargement du formulaire…
      </div>
    );
  }

  /* Aperçu désactivé reflétant la définition du formulaire */
  void site;
  const champs = (formulaire.champs as unknown as Array<{
    id: string;
    type: string;
    libelle: string;
    placeholder?: string;
    obligatoire?: boolean;
    options?: string[];
  }>) ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">
        Formulaire : {formulaire.nom}
      </p>
      <div className="space-y-3">
        {champs.map((c) => (
          <div key={c.id}>
            <label className="block text-sm font-medium text-foreground mb-1">
              {c.libelle}
              {c.obligatoire && <span className="text-destructive ml-0.5">*</span>}
            </label>
            {c.type === "zone-texte" ? (
              <textarea disabled placeholder={c.placeholder} rows={3}
                className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm" />
            ) : c.type === "case-a-cocher" ? (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" disabled />
                {c.placeholder || "Cochez la case"}
              </label>
            ) : c.type === "selection" ? (
              <select disabled className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                {(c.options ?? []).map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={c.type === "email" ? "email" : c.type === "nombre" ? "number" : c.type === "url" ? "url" : c.type === "telephone" ? "tel" : "text"}
                disabled
                placeholder={c.placeholder}
                className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm"
              />
            )}
          </div>
        ))}
      </div>
      <button disabled className="mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground opacity-80">
        {formulaire.libelleEnvoi}
      </button>
    </div>
  );
};

const EditionFormulaire = ({ bloc, surChangement }: PropsEditionProprietes) => {
  const params = useParams<{ slug?: string }>();
  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug }
  );
  const { data: formulaires } = trpc.formulaires.lister.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );
  const idFormulaire = (bloc.proprietes.idFormulaire as string) || "";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-foreground/80 mb-1.5">
          Formulaire à afficher
        </label>
        <select
          value={idFormulaire}
          onChange={(e) =>
            surChangement({ ...bloc.proprietes, idFormulaire: e.target.value })
          }
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
        >
          <option value="">— Sélectionner —</option>
          {(formulaires ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </select>
        {(!formulaires || formulaires.length === 0) && (
          <p className="mt-2 text-xs text-muted-foreground">
            Aucun formulaire disponible. Créez-en un dans l&apos;onglet « Formulaires ».
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================
// BLOC LISTE D'ARTICLES (aperçu admin + sélection)
// ============================================
const RenduListeArticles = ({ bloc }: PropsRenduBloc) => {
  const params = useParams<{ slug?: string }>();
  const limite = (bloc.proprietes.limite as number) || 6;
  const idCategorie = (bloc.proprietes.idCategorie as string) || undefined;
  const idEtiquette = (bloc.proprietes.idEtiquette as string) || undefined;

  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug }
  );
  const { data: pages } = trpc.pages.lister.useQuery(
    {
      idSite: site?.id ?? "",
      typePage: "ARTICLE",
      statut: "PUBLIE",
      idCategorie,
      idEtiquette,
    },
    { enabled: !!site?.id }
  );

  const articles = (pages ?? []).slice(0, limite);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
        Liste d&apos;articles
        {idCategorie && " · catégorie filtrée"}
        {idEtiquette && " · étiquette filtrée"}
        {" "}· {articles.length} article(s)
      </p>
      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Aucun article publié ne correspond aux filtres. La liste sera vide tant
          qu&apos;aucun article ne sera publié.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {articles.map((a) => (
            <li key={a.id} className="py-2">
              <p className="text-sm font-medium text-foreground">{a.titre}</p>
              <p className="text-xs text-muted-foreground font-mono">{a.chemin}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const EditionListeArticles = ({ bloc, surChangement }: PropsEditionProprietes) => {
  const params = useParams<{ slug?: string }>();
  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug }
  );
  const { data: categories } = trpc.categories.lister.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );
  const { data: etiquettes } = trpc.etiquettes.lister.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );

  const limite = (bloc.proprietes.limite as number) || 6;
  const idCategorie = (bloc.proprietes.idCategorie as string) || "";
  const idEtiquette = (bloc.proprietes.idEtiquette as string) || "";
  const ordre = (bloc.proprietes.ordre as string) || "recent";
  const afficherImage = (bloc.proprietes.afficherImage as boolean) ?? true;
  const afficherExtrait = (bloc.proprietes.afficherExtrait as boolean) ?? true;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-foreground/80 mb-1.5">
          Nombre d&apos;articles
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={limite}
          onChange={(e) =>
            surChangement({ ...bloc.proprietes, limite: Number(e.target.value) || 6 })
          }
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground/80 mb-1.5">
          Catégorie
        </label>
        <select
          value={idCategorie}
          onChange={(e) =>
            surChangement({
              ...bloc.proprietes,
              idCategorie: e.target.value || undefined,
            })
          }
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
        >
          <option value="">Toutes les catégories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground/80 mb-1.5">
          Étiquette
        </label>
        <select
          value={idEtiquette}
          onChange={(e) =>
            surChangement({
              ...bloc.proprietes,
              idEtiquette: e.target.value || undefined,
            })
          }
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
        >
          <option value="">Toutes les étiquettes</option>
          {(etiquettes ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground/80 mb-1.5">
          Ordre
        </label>
        <select
          value={ordre}
          onChange={(e) =>
            surChangement({ ...bloc.proprietes, ordre: e.target.value })
          }
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
        >
          <option value="recent">Plus récents d&apos;abord</option>
          <option value="ancien">Plus anciens d&apos;abord</option>
          <option value="alphabetique">Alphabétique</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={afficherImage}
          onChange={(e) =>
            surChangement({ ...bloc.proprietes, afficherImage: e.target.checked })
          }
          className="h-3.5 w-3.5 rounded border-input"
        />
        Afficher l&apos;image à la une
      </label>
      <label className="flex items-center gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={afficherExtrait}
          onChange={(e) =>
            surChangement({ ...bloc.proprietes, afficherExtrait: e.target.checked })
          }
          className="h-3.5 w-3.5 rounded border-input"
        />
        Afficher l&apos;extrait
      </label>
    </div>
  );
};

// ============================================
// CHAMPS RÉUTILISABLES (panneau propriétés)
// ============================================
function ChampTexte({
  libelle,
  valeur,
  placeholder,
  surChangement,
}: {
  libelle: string;
  valeur: string;
  placeholder?: string;
  surChangement: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground/80 mb-1.5">{libelle}</label>
      <input
        type="text"
        value={valeur}
        placeholder={placeholder}
        onChange={(e) => surChangement(e.target.value)}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
      />
    </div>
  );
}

function ChampZoneTexte({
  libelle,
  valeur,
  surChangement,
}: {
  libelle: string;
  valeur: string;
  surChangement: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground/80 mb-1.5">{libelle}</label>
      <textarea
        value={valeur}
        onChange={(e) => surChangement(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all resize-none"
      />
    </div>
  );
}

function ChampNombre({
  libelle,
  valeur,
  min,
  max,
  surChangement,
}: {
  libelle: string;
  valeur: number;
  min?: number;
  max?: number;
  surChangement: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground/80 mb-1.5">{libelle}</label>
      <input
        type="number"
        value={valeur}
        min={min}
        max={max}
        onChange={(e) => surChangement(Number(e.target.value))}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
      />
    </div>
  );
}

function ChampSelection({
  libelle,
  valeur,
  options,
  surChangement,
}: {
  libelle: string;
  valeur: string;
  options: { valeur: string; libelle: string }[];
  surChangement: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground/80 mb-1.5">{libelle}</label>
      <select
        value={valeur}
        onChange={(e) => surChangement(e.target.value)}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
      >
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {option.libelle}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChampAlignement({
  valeur,
  surChangement,
}: {
  valeur: string;
  surChangement: (v: string) => void;
}) {
  return (
    <ChampSelection
      libelle="Alignement"
      valeur={valeur}
      options={[
        { valeur: "gauche", libelle: "Gauche" },
        { valeur: "centre", libelle: "Centre" },
        { valeur: "droite", libelle: "Droite" },
      ]}
      surChangement={surChangement}
    />
  );
}

/** Champ image avec aperçu + bouton « Choisir un média » + saisie URL libre */
function ChampImage({
  libelle,
  valeur,
  surChangement,
}: {
  libelle: string;
  valeur: string;
  surChangement: (url: string, alt?: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div>
      <label className="block text-xs font-medium text-foreground/80 mb-1.5">
        {libelle}
      </label>

      {valeur ? (
        <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={valeur} alt="" className="w-full h-24 object-cover" />
          <button
            type="button"
            onClick={() => surChangement("")}
            className="absolute top-1 right-1 rounded-md bg-black/60 text-white p-1 hover:bg-black/80 transition-colors"
            title="Retirer"
            aria-label="Retirer l'image"
          >
            <Minus className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="w-full mb-2 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-muted/20 p-4 text-muted-foreground hover:border-sky/40 hover:bg-sky/5 hover:text-sky transition-all"
        >
          <FolderOpen className="h-5 w-5" />
          <span className="text-xs font-medium">Choisir depuis la médiathèque</span>
        </button>
      )}

      <div className="flex gap-1.5">
        <input
          type="text"
          value={valeur}
          placeholder="ou collez une URL"
          onChange={(e) => surChangement(e.target.value)}
          className="flex-1 min-w-0 rounded-lg border border-input bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
        />
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="rounded-lg border border-input bg-card px-2.5 text-muted-foreground hover:text-sky hover:border-sky/40 transition-colors"
          title="Parcourir la médiathèque"
          aria-label="Parcourir la médiathèque"
        >
          <FolderOpen className="h-3.5 w-3.5" />
        </button>
      </div>

      <SelecteurMedia
        ouvert={ouvert}
        surFermeture={() => setOuvert(false)}
        surSelection={(url, alt) => surChangement(url, alt)}
      />
    </div>
  );
}

// ============================================
// REGISTRE PRINCIPAL
// ============================================

export const REGISTRE_BLOCS: Record<IdTypeBloc, DefinitionBloc> = {
  hero: {
    id: "hero",
    libelle: "Section héro",
    description: "Grande section d'accroche avec titre et bouton",
    icone: Sparkles,
    categorie: "section",
    proprietesParDefaut: {
      titre: "Un titre captivant",
      sousTitre: "Description percutante de votre offre.",
      texteBouton: "Découvrir",
      urlBouton: "#",
      imageFond: "",
    },
    Rendu: RenduHero,
    Edition: EditionHero,
  },
  titre: {
    id: "titre",
    libelle: "Titre",
    description: "Titre H1, H2, H3 ou H4",
    icone: Heading,
    categorie: "base",
    proprietesParDefaut: {
      texte: "Nouveau titre",
      niveau: "h2",
      alignement: "gauche",
    },
    Rendu: RenduTitre,
    Edition: EditionTitre,
  },
  paragraphe: {
    id: "paragraphe",
    libelle: "Paragraphe",
    description: "Bloc de texte simple",
    icone: Type,
    categorie: "base",
    proprietesParDefaut: {
      texte: "Tapez votre texte ici. Vous pouvez modifier ce texte dans le panneau de droite.",
      taille: "moyen",
      alignement: "gauche",
    },
    Rendu: RenduParagraphe,
    Edition: EditionParagraphe,
  },
  image: {
    id: "image",
    libelle: "Image",
    description: "Image avec options de taille et arrondi",
    icone: IconeImage,
    categorie: "media",
    proprietesParDefaut: {
      url: "",
      alt: "",
      largeur: "complete",
      arrondi: "moyen",
    },
    Rendu: RenduImage,
    Edition: EditionImage,
  },
  video: {
    id: "video",
    libelle: "Vidéo",
    description: "Embed YouTube ou Vimeo",
    icone: Video,
    categorie: "media",
    proprietesParDefaut: {
      url: "",
    },
    Rendu: RenduVideo,
    Edition: EditionVideo,
  },
  bouton: {
    id: "bouton",
    libelle: "Bouton",
    description: "Bouton d'appel à l'action",
    icone: MousePointerClick,
    categorie: "base",
    proprietesParDefaut: {
      texte: "Cliquez ici",
      url: "#",
      variante: "principal",
      alignement: "gauche",
    },
    Rendu: RenduBouton,
    Edition: EditionBouton,
  },
  colonnes: {
    id: "colonnes",
    libelle: "Deux colonnes",
    description: "Mise en page sur deux colonnes",
    icone: Columns2,
    categorie: "structure",
    proprietesParDefaut: {
      colonneGauche: "Contenu de la colonne de gauche.",
      colonneDroite: "Contenu de la colonne de droite.",
    },
    Rendu: RenduColonnes,
    Edition: EditionColonnes,
  },
  espacement: {
    id: "espacement",
    libelle: "Espacement",
    description: "Espace vertical configurable",
    icone: ArrowsUpFromLine,
    categorie: "structure",
    proprietesParDefaut: {
      hauteur: 48,
    },
    Rendu: RenduEspacement,
    Edition: EditionEspacement,
  },
  separateur: {
    id: "separateur",
    libelle: "Séparateur",
    description: "Ligne de séparation visuelle",
    icone: Minus,
    categorie: "structure",
    proprietesParDefaut: {
      style: "ligne",
    },
    Rendu: RenduSeparateur,
    Edition: EditionSeparateur,
  },
  formulaire: {
    id: "formulaire",
    libelle: "Formulaire",
    description: "Insérer un formulaire de contact ou autre",
    icone: Inbox,
    categorie: "section",
    proprietesParDefaut: {
      idFormulaire: "",
    },
    Rendu: RenduFormulaire,
    Edition: EditionFormulaire,
  },
  "liste-articles": {
    id: "liste-articles",
    libelle: "Liste d'articles",
    description: "Affiche les articles publiés du blog (catégorie, étiquette, limite)",
    icone: Newspaper,
    categorie: "section",
    proprietesParDefaut: {
      limite: 6,
      idCategorie: undefined,
      idEtiquette: undefined,
      ordre: "recent",
      afficherImage: true,
      afficherExtrait: true,
    },
    Rendu: RenduListeArticles,
    Edition: EditionListeArticles,
  },
};

/** Liste ordonnée des blocs pour la palette */
export const LISTE_BLOCS: DefinitionBloc[] = [
  REGISTRE_BLOCS.hero,
  REGISTRE_BLOCS.titre,
  REGISTRE_BLOCS.paragraphe,
  REGISTRE_BLOCS.image,
  REGISTRE_BLOCS.video,
  REGISTRE_BLOCS.bouton,
  REGISTRE_BLOCS.formulaire,
  REGISTRE_BLOCS["liste-articles"],
  REGISTRE_BLOCS.colonnes,
  REGISTRE_BLOCS.espacement,
  REGISTRE_BLOCS.separateur,
];

/** Récupère une définition de bloc à partir de son type */
export function obtenirDefinition(type: IdTypeBloc): DefinitionBloc | undefined {
  return REGISTRE_BLOCS[type];
}
