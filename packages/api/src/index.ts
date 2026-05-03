/**
 * Package @nexora/api
 * Exporte le routeur tRPC racine, le contexte et les utilitaires.
 */
export { routeurRacine, type RouteurRacine } from "./routeurs";
export { creerContexte, type ContexteTRPC } from "./contexte";
export { creerRouteur, procedurePublique, procedureProtegee } from "./trpc";
export { creerGestionnaireTRPC } from "./gestionnaire-nextjs";
export { signerJetonApercu, verifierJetonApercu } from "./lib/jeton-apercu";
