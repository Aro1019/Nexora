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

  // ───── V1 : Essentiels (mise en page, style des liens, finitions) ─────

  /** Largeur du conteneur central. `pleine` = 100 %, sinon contraint. */
  largeurConteneur?: "pleine" | "large" | "normale" | "etroite";

  /** Espacement horizontal entre les liens du menu. */
  espacementLiens?: "compact" | "normal" | "aere";

  /** Style visuel des liens. */
  styleLiens?: "minimal" | "souligne" | "pilule" | "fantome";

  /** Indicateur visuel de la page active. */
  indicateurActif?: "aucun" | "souligne" | "point" | "barre-haut" | "fond";

  /** Couleur du texte d'un lien au survol (CSS hex/rgb/var). */
  couleurLienHover?: string;

  /** Couleur du texte d'un lien lorsqu'il correspond à la page courante. */
  couleurLienActif?: string;

  /** Ombre portée sous l'en-tête. */
  ombre?: "aucune" | "fine" | "moyenne" | "forte";

  /** Bordure inférieure. */
  bordureBas?: "aucune" | "fine" | "epaisse";

  /** Couleur de la bordure inférieure (si bordureBas != "aucune"). */
  couleurBordureBas?: string;

  // ───── V2 : Comportement au scroll & bandeau d'annonce ─────

  /**
   * Comportement de l'en-tête quand `sticky` est actif.
   * - `fixe` : reste tel quel
   * - `reduit` : se compacte (padding réduit, éventuellement nouvelle couleur)
   * - `auto-cache` : se cache au scroll vers le bas, réapparaît vers le haut
   */
  comportementScroll?: "fixe" | "reduit" | "auto-cache";

  /** Seuil en pixels avant déclenchement du comportement scroll. */
  seuilScroll?: number;

  /** Couleur de fond appliquée une fois scrollé (mode transparent ou réduit). */
  couleurFondScroll?: string;

  /** Couleur de texte appliquée une fois scrollé. */
  couleurTexteScroll?: string;

  /** Bandeau d'annonce affiché au-dessus de l'en-tête. */
  bandeau?: {
    active: boolean;
    texte: string;
    lien?: string;
    couleurFond?: string;
    couleurTexte?: string;
    /** Si vrai, affiche un bouton de fermeture (mémorisé en localStorage). */
    fermable?: boolean;
  };

  // ───── V3 : Logo & typographie ─────

  /** Position du logo dans l'en-tête. */
  positionLogo?: "gauche" | "centre" | "droite";

  /** Taille du logo (icône + nom). */
  tailleLogo?: "S" | "M" | "L" | "XL";

  /** Afficher le nom du site à côté du logo. */
  afficherNomSite?: boolean;

  /** Famille de police pour le nom du site. */
  policeNomSite?: "heritee" | "sans" | "serif" | "mono";

  /** URL d'un logo alternatif utilisé une fois scrollé (ex. version foncée). */
  urlLogoAlt?: string;

  /** Liens du menu affichés en MAJUSCULES. */
  liensMajuscules?: boolean;

  /** Graisse typographique des liens. */
  graisseLiens?: "normale" | "medium" | "semi" | "bold";

  /** Famille de police des liens. */
  policeLiens?: "heritee" | "sans" | "serif" | "mono";
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

  // V1
  largeurConteneur: "normale",
  espacementLiens: "normal",
  styleLiens: "minimal",
  indicateurActif: "souligne",
  ombre: "aucune",
  bordureBas: "fine",

  // V2
  comportementScroll: "fixe",
  seuilScroll: 8,
  bandeau: { active: false, texte: "", fermable: true },

  // V3
  positionLogo: "gauche",
  tailleLogo: "M",
  afficherNomSite: true,
  policeNomSite: "heritee",
  liensMajuscules: false,
  graisseLiens: "medium",
  policeLiens: "heritee",
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
