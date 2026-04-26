/**
 * Routeur racine tRPC — combine tous les sous-routeurs.
 */
import { creerRouteur } from "../trpc";
import { routeurSites } from "./sites";
import { routeurMembres } from "./membres";
import { routeurPages } from "./pages";
import { routeurMedias } from "./medias";
import { routeurNavigations } from "./navigations";
import { routeurReglages } from "./reglages";

export const routeurRacine = creerRouteur({
  sites: routeurSites,
  membres: routeurMembres,
  pages: routeurPages,
  medias: routeurMedias,
  navigations: routeurNavigations,
  reglages: routeurReglages,
});

/** Type du routeur racine — utilisé côté client */
export type RouteurRacine = typeof routeurRacine;
