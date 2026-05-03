/**
 * Types et structures de l'éditeur de blocs Nexora.
 * Définit la forme d'un bloc, ses propriétés et le contenu d'une page.
 */

/** Identifiant des types de blocs disponibles dans l'éditeur */
export type IdTypeBloc =
  | "titre"
  | "paragraphe"
  | "image"
  | "bouton"
  | "espacement"
  | "separateur"
  | "hero"
  | "colonnes"
  | "video"
  | "formulaire"
  | "liste-articles";

/** Bloc unique dans une page */
export interface Bloc {
  id: string;
  type: IdTypeBloc;
  proprietes: Record<string, unknown>;
}

/** Contenu d'une page = tableau de blocs ordonnés */
export type ContenuPage = Bloc[];

/** Niveau de titre HTML */
export type NiveauTitre = "h1" | "h2" | "h3" | "h4";

/** Alignement horizontal */
export type Alignement = "gauche" | "centre" | "droite";

/** Variante de bouton */
export type VarianteBouton = "principal" | "secondaire" | "fantome";
