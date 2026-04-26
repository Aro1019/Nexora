/**
 * Route API tRPC — gestionnaire catch-all.
 * Toutes les requêtes /api/trpc/* sont gérées ici.
 */
import { creerGestionnaireTRPC } from "@nexora/api";

export const { GET, POST } = creerGestionnaireTRPC();
