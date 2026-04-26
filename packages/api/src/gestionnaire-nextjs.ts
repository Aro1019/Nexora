/**
 * Gestionnaire de requêtes tRPC pour Next.js App Router.
 * Exporte les handlers GET et POST à utiliser dans la route API.
 */
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { routeurRacine } from "./routeurs";
import { creerContexte } from "./contexte";

/** Crée un gestionnaire tRPC pour Next.js App Router */
export function creerGestionnaireTRPC() {
  function gestionnaire(req: Request) {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: routeurRacine,
      createContext: () =>
        creerContexte({
          headers: req.headers,
        }),
    });
  }

  return { GET: gestionnaire, POST: gestionnaire };
}
