/**
 * Routeur tRPC pour les étiquettes (tags) d'un site.
 * Modèle plat — pas de hiérarchie.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
import { creerRouteur, procedureProtegee } from "../trpc";

async function verifierAccesSite(
  db: PrismaClient,
  idUtilisateur: string,
  idSite: string,
  roleMinimum: "PROPRIETAIRE" | "ADMINISTRATEUR" | "EDITEUR" | "LECTEUR" = "LECTEUR"
) {
  const HIERARCHIE: Record<string, number> = {
    PROPRIETAIRE: 0,
    ADMINISTRATEUR: 1,
    EDITEUR: 2,
    LECTEUR: 3,
  };
  const membre = await db.membreSite.findUnique({
    where: { idUtilisateur_idSite: { idUtilisateur, idSite } },
  });
  if (!membre) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Vous n'êtes pas membre de ce site.",
    });
  }
  if ((HIERARCHIE[membre.role] ?? 99) > (HIERARCHIE[roleMinimum] ?? 0)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Droits insuffisants." });
  }
  return membre;
}

const REGEX_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REGEX_COULEUR = /^#[0-9a-fA-F]{6}$/;

const schemaCreer = z.object({
  idSite: z.string(),
  nom: z.string().min(1).max(60),
  slug: z.string().min(1).max(60).regex(REGEX_SLUG),
  couleur: z.string().regex(REGEX_COULEUR).nullable().optional(),
});

const schemaModifier = z.object({
  id: z.string(),
  idSite: z.string(),
  nom: z.string().min(1).max(60).optional(),
  slug: z.string().min(1).max(60).regex(REGEX_SLUG).optional(),
  couleur: z.string().regex(REGEX_COULEUR).nullable().optional(),
});

export const routeurEtiquettes = creerRouteur({
  /** Lister toutes les étiquettes d'un site avec compteur. */
  lister: procedureProtegee
    .input(z.object({ idSite: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");
      return ctx.db.etiquette.findMany({
        where: { idSite: input.idSite },
        orderBy: { nom: "asc" },
        include: { _count: { select: { pages: true } } },
      });
    }),

  /** Créer une étiquette. */
  creer: procedureProtegee
    .input(schemaCreer)
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      const existe = await ctx.db.etiquette.findUnique({
        where: { idSite_slug: { idSite: input.idSite, slug: input.slug } },
      });
      if (existe) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Une étiquette avec ce slug existe déjà.",
        });
      }

      const etiquette = await ctx.db.etiquette.create({
        data: {
          idSite: input.idSite,
          nom: input.nom,
          slug: input.slug,
          couleur: input.couleur ?? null,
        },
      });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "etiquette.creee",
          typeRessource: "etiquette",
          idRessource: etiquette.id,
          metadonnees: { nom: input.nom, slug: input.slug },
        },
      });

      return etiquette;
    }),

  /** Modifier une étiquette. */
  modifier: procedureProtegee
    .input(schemaModifier)
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      const actuelle = await ctx.db.etiquette.findUnique({ where: { id: input.id } });
      if (!actuelle || actuelle.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Étiquette introuvable." });
      }

      if (input.slug && input.slug !== actuelle.slug) {
        const existe = await ctx.db.etiquette.findUnique({
          where: { idSite_slug: { idSite: input.idSite, slug: input.slug } },
        });
        if (existe) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Une étiquette avec ce slug existe déjà.",
          });
        }
      }

      const maj = await ctx.db.etiquette.update({
        where: { id: input.id },
        data: {
          nom: input.nom ?? undefined,
          slug: input.slug ?? undefined,
          couleur: input.couleur === undefined ? undefined : input.couleur,
        },
      });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "etiquette.modifiee",
          typeRessource: "etiquette",
          idRessource: maj.id,
          metadonnees: { nom: maj.nom },
        },
      });

      return maj;
    }),

  /** Supprimer une étiquette. */
  supprimer: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");

      const et = await ctx.db.etiquette.findUnique({ where: { id: input.id } });
      if (!et || et.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Étiquette introuvable." });
      }

      await ctx.db.etiquette.delete({ where: { id: input.id } });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "etiquette.supprimee",
          typeRessource: "etiquette",
          idRessource: input.id,
          metadonnees: { nom: et.nom },
        },
      });

      return { succes: true };
    }),
});
