/**
 * Routeur tRPC pour les catégories d'un site.
 * CRUD + hiérarchie. EDITEUR+ peut créer/modifier, ADMINISTRATEUR+ pour supprimer.
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
  nom: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(REGEX_SLUG),
  description: z.string().max(500).nullable().optional(),
  couleur: z.string().regex(REGEX_COULEUR).nullable().optional(),
  ordreAffichage: z.number().int().default(0),
  idParent: z.string().nullable().optional(),
});

const schemaModifier = z.object({
  id: z.string(),
  idSite: z.string(),
  nom: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(REGEX_SLUG).optional(),
  description: z.string().max(500).nullable().optional(),
  couleur: z.string().regex(REGEX_COULEUR).nullable().optional(),
  ordreAffichage: z.number().int().optional(),
  idParent: z.string().nullable().optional(),
});

export const routeurCategories = creerRouteur({
  /** Lister les catégories d'un site (avec compteur de pages). */
  lister: procedureProtegee
    .input(z.object({ idSite: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");
      return ctx.db.categorie.findMany({
        where: { idSite: input.idSite },
        orderBy: [{ ordreAffichage: "asc" }, { nom: "asc" }],
        include: { _count: { select: { pages: true } } },
      });
    }),

  /** Créer une catégorie. */
  creer: procedureProtegee
    .input(schemaCreer)
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      const existe = await ctx.db.categorie.findUnique({
        where: { idSite_slug: { idSite: input.idSite, slug: input.slug } },
      });
      if (existe) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Une catégorie avec ce slug existe déjà.",
        });
      }

      const categorie = await ctx.db.categorie.create({
        data: {
          idSite: input.idSite,
          nom: input.nom,
          slug: input.slug,
          description: input.description ?? null,
          couleur: input.couleur ?? null,
          ordreAffichage: input.ordreAffichage,
          idParent: input.idParent ?? null,
        },
      });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "categorie.creee",
          typeRessource: "categorie",
          idRessource: categorie.id,
          metadonnees: { nom: input.nom, slug: input.slug },
        },
      });

      return categorie;
    }),

  /** Modifier une catégorie. */
  modifier: procedureProtegee
    .input(schemaModifier)
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      const actuelle = await ctx.db.categorie.findUnique({ where: { id: input.id } });
      if (!actuelle || actuelle.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Catégorie introuvable." });
      }

      if (input.slug && input.slug !== actuelle.slug) {
        const existe = await ctx.db.categorie.findUnique({
          where: { idSite_slug: { idSite: input.idSite, slug: input.slug } },
        });
        if (existe) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Une catégorie avec ce slug existe déjà.",
          });
        }
      }

      /* Empêcher une boucle parent → soi-même */
      if (input.idParent && input.idParent === input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Une catégorie ne peut pas être son propre parent.",
        });
      }

      const maj = await ctx.db.categorie.update({
        where: { id: input.id },
        data: {
          nom: input.nom ?? undefined,
          slug: input.slug ?? undefined,
          description: input.description === undefined ? undefined : input.description,
          couleur: input.couleur === undefined ? undefined : input.couleur,
          ordreAffichage: input.ordreAffichage ?? undefined,
          idParent: input.idParent === undefined ? undefined : input.idParent,
        },
      });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "categorie.modifiee",
          typeRessource: "categorie",
          idRessource: maj.id,
          metadonnees: { nom: maj.nom },
        },
      });

      return maj;
    }),

  /** Supprimer une catégorie. */
  supprimer: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");

      const cat = await ctx.db.categorie.findUnique({ where: { id: input.id } });
      if (!cat || cat.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Catégorie introuvable." });
      }

      await ctx.db.categorie.delete({ where: { id: input.id } });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "categorie.supprimee",
          typeRessource: "categorie",
          idRessource: input.id,
          metadonnees: { nom: cat.nom },
        },
      });

      return { succes: true };
    }),
});
