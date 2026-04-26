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
