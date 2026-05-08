// ============================================
// TYPES DE BLOCS
// ============================================

/** Bloc de contenu dans une page */
export interface Bloc {
  id: string;
  type: TypeBloc;
  proprietes: Record<string, unknown>;
  enfants?: Bloc[];
  style?: StyleBloc;
}

/** Style personnalisé d'un bloc */
export interface StyleBloc {
  marge?: string;
  espacement?: string;
  couleurFond?: string;
  alignementTexte?: "gauche" | "centre" | "droite";
  largeurMax?: string;
  classeCSS?: string;
}

/** Types de blocs disponibles dans l'éditeur */
export type TypeBloc =
  | "hero"
  | "texte-riche"
  | "image"
  | "colonnes"
  | "carte"
  | "appel-action"
  | "espacement"
  | "separateur"
  | "video"
  | "galerie"
  | "temoignage"
  | "tarification"
  | "faq"
  | "formulaire-integre"
  | "ref-bloc-global"
  | "html";

// ============================================
// TYPES DE NAVIGATION
// ============================================

/** Élément d'un menu de navigation */
export interface ElementNavigation {
  id: string;
  libelle: string;
  type: "page" | "url" | "categorie";
  idPage?: string;
  url?: string;
  idCategorie?: string;
  ouvrirNouvelOnglet: boolean;
  enfants?: ElementNavigation[];
}

/** Bouton d'appel à l'action affiché dans l'en-tête */
export interface BoutonCTA {
  active: boolean;
  texte: string;
  url: string;
  couleurFond?: string;
  couleurTexte?: string;
}

/** Apparence visuelle d'un en-tête de site */
export interface ApparenceEntete {
  positionLiens: "gauche" | "centre" | "droite";
  sticky: boolean;
  transparent: boolean;
  couleurFond?: string;
  couleurTexte?: string;
  hauteur: "compact" | "normal" | "grand";
  afficherLogo: boolean;
  afficherRecherche: boolean;
  cta: BoutonCTA;
}

/** Apparence visuelle d'un pied de page de site */
export interface ApparencePied {
  nbColonnes: 1 | 2 | 3 | 4;
  couleurFond?: string;
  couleurTexte?: string;
  afficherLogo: boolean;
  description?: string;
  afficherReseauxSociaux: boolean;
  texteCopyright?: string;
  newsletter: {
    active: boolean;
    titre?: string;
    placeholder?: string;
  };
  selecteurLangue: boolean;
  liensSecondaires: Array<{ id: string; libelle: string; url: string }>;
}

/** Apparence d'une barre latérale (placeholder pour évolution future) */
export interface ApparenceBarreLaterale {
  cote: "gauche" | "droite";
  couleurFond?: string;
  couleurTexte?: string;
  largeur: "etroite" | "normale" | "large";
}

/**
 * Apparence d'une navigation. Le contenu effectif dépend de l'emplacement
 * (ENTETE => ApparenceEntete, PIED_DE_PAGE => ApparencePied, etc.).
 */
export type ApparenceNavigation =
  | ({ emplacement: "ENTETE" } & ApparenceEntete)
  | ({ emplacement: "PIED_DE_PAGE" } & ApparencePied)
  | ({ emplacement: "BARRE_LATERALE" } & ApparenceBarreLaterale);

/** Valeurs par défaut pour l'apparence d'un en-tête */
export const APPARENCE_ENTETE_DEFAUT: ApparenceEntete = {
  positionLiens: "droite",
  sticky: true,
  transparent: false,
  hauteur: "normal",
  afficherLogo: true,
  afficherRecherche: false,
  cta: {
    active: false,
    texte: "Commencer",
    url: "/",
  },
};

/** Valeurs par défaut pour l'apparence d'un pied de page */
export const APPARENCE_PIED_DEFAUT: ApparencePied = {
  nbColonnes: 3,
  afficherLogo: true,
  afficherReseauxSociaux: true,
  newsletter: { active: false, titre: "Newsletter", placeholder: "votre@email.com" },
  selecteurLangue: false,
  liensSecondaires: [],
};

// ============================================
// TYPES DE FORMULAIRES
// ============================================

/** Champ configurable d'un formulaire */
export interface ChampFormulaire {
  id: string;
  nom: string;
  libelle: string;
  type:
    | "texte"
    | "email"
    | "zone-texte"
    | "selection"
    | "case-cocher"
    | "nombre"
    | "telephone"
    | "date";
  placeholder?: string;
  requis: boolean;
  options?: string[];
  validation?: {
    longueurMin?: number;
    longueurMax?: number;
    motif?: string;
  };
}

// ============================================
// TYPES D'AUDIT
// ============================================

/** Actions traçables dans le journal d'audit */
export type ActionAudit =
  | "site.cree"
  | "site.modifie"
  | "site.publie"
  | "site.archive"
  | "page.creee"
  | "page.modifiee"
  | "page.publiee"
  | "page.supprimee"
  | "page.restauree"
  | "media.televerse"
  | "media.supprime"
  | "formulaire.cree"
  | "formulaire.modifie"
  | "membre.invite"
  | "membre.role_modifie"
  | "membre.retire"
  | "reglages.modifies";

/** Types de ressources traçables dans le journal d'audit */
export type TypeRessource =
  | "site"
  | "page"
  | "media"
  | "formulaire"
  | "membre"
  | "reglages"
  | "bloc_global"
  | "categorie"
  | "etiquette"
  | "navigation";
