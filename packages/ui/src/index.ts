export { cn } from "./lib/utils";
export {
  LANGUES_DISPONIBLES,
  obtenirInfoLangue,
  type InfoLangue,
} from "./langues";

/* Composants UI */
export { Bouton, variantesBouton, type PropsBouton } from "./composants/bouton";
export { Avatar, AvatarImage, AvatarFallback } from "./composants/avatar";
export { Badge, variantesBadge, type PropsBadge } from "./composants/badge";
export {
  Carte,
  CarteEntete,
  CarteTitre,
  CarteDescription,
  CarteContenu,
  CartePied,
} from "./composants/carte";
export {
  Dialogue,
  DialogueDeclencheur,
  DialogueContenu,
  DialogueEntete,
  DialogueTitre,
  DialogueDescription,
  DialoguePied,
} from "./composants/dialogue";
export { ChampSaisie } from "./composants/champ-saisie";
export { Selecteur } from "./composants/selecteur";
