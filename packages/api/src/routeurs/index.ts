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
import { routeurFormulaires } from "./formulaires";
import { routeurCategories } from "./categories";
import { routeurEtiquettes } from "./etiquettes";
import { routeurAnalytics } from "./analytics";
import { routeurVersions } from "./versions";
import { routeurWebhooks } from "./webhooks";
import { routeurRecherche } from "./recherche";

export const routeurRacine = creerRouteur({
  sites: routeurSites,
  membres: routeurMembres,
  pages: routeurPages,
  medias: routeurMedias,
  navigations: routeurNavigations,
  reglages: routeurReglages,
  formulaires: routeurFormulaires,
  categories: routeurCategories,
  etiquettes: routeurEtiquettes,
  analytics: routeurAnalytics,
  versions: routeurVersions,
  webhooks: routeurWebhooks,
  recherche: routeurRecherche,
});

/** Type du routeur racine — utilisé côté client */
export type RouteurRacine = typeof routeurRacine;
