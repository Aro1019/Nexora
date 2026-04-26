/**
 * Configuration de base de tRPC.
 * Initialise tRPC avec superjson comme transformateur
 * et définit les procédures publiques et protégées.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { ContexteTRPC } from "./contexte";

/** Instance tRPC initialisée avec le contexte et superjson */
const t = initTRPC.context<ContexteTRPC>().create({
  transformer: superjson,
});

/** Créateur de routeurs */
export const creerRouteur = t.router;

/** Procédure publique — accessible sans authentification */
export const procedurePublique = t.procedure;

/**
 * Middleware d'authentification.
 * Vérifie que la session et l'utilisateur existent dans le contexte.
 */
const middlewareAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.utilisateur) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Vous devez être connecté pour effectuer cette action.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      utilisateur: ctx.utilisateur,
    },
  });
});

/** Procédure protégée — nécessite une session utilisateur valide */
export const procedureProtegee = t.procedure.use(middlewareAuth);
