/**
 * Routeur tRPC pour les menus de navigation d'un site.
 * CRUD : lister, obtenir, créer/modifier (upsert), supprimer.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
import { creerRouteur, procedureProtegee } from "../trpc";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

async function verifierAccesSite(
  db: PrismaClient,
  idUtilisateur: string,
  idSite: string,
  roleMinimum: "PROPRIETAIRE" | "ADMINISTRATEUR" | "EDITEUR" | "LECTEUR" = "LECTEUR"
) {
  const HIERARCHIE: Record<string, number> = {
    PROPRIETAIRE: 0, ADMINISTRATEUR: 1, EDITEUR: 2, LECTEUR: 3,
  };
  const membre = await db.membreSite.findUnique({
    where: { idUtilisateur_idSite: { idUtilisateur, idSite } },
  });
  if (!membre) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Vous n'êtes pas membre de ce site." });
  }
  if ((HIERARCHIE[membre.role] ?? 99) > (HIERARCHIE[roleMinimum] ?? 0)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Droits insuffisants." });
  }
  return membre;
}

// ─────────────────────────────────────────
// Schémas
// ─────────────────────────────────────────

/** Schéma récursif pour un élément de navigation */
const schemaElement: z.ZodType<{
  id: string;
  libelle: string;
  type: "page" | "url" | "categorie";
  idPage?: string;
  url?: string;
  idCategorie?: string;
  ouvrirNouvelOnglet?: boolean;
  enfants?: unknown[];
}> = z.object({
  id: z.string(),
  libelle: z.string().min(1).max(100),
  type: z.enum(["page", "url", "categorie"]),
  idPage: z.string().optional(),
  url: z.string().max(2000).optional(),
  idCategorie: z.string().optional(),
  ouvrirNouvelOnglet: z.boolean().default(false),
  enfants: z.lazy(() => schemaElement.array()).optional(),
});

const schemaUpsertNavigation = z.object({
  idSite: z.string(),
  emplacement: z.enum(["ENTETE", "PIED_DE_PAGE", "BARRE_LATERALE"]),
  libelle: z.string().min(1).max(100),
  elements: schemaElement.array(),
});

// ─────────────────────────────────────────
// Routeur
// ─────────────────────────────────────────

export const routeurNavigations = creerRouteur({
  /**
   * Lister les navigations d'un site.
   * LECTEUR+ peut voir.
   */
  lister: procedureProtegee
    .input(z.object({ idSite: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      return ctx.db.navigation.findMany({
        where: { idSite: input.idSite },
        orderBy: { emplacement: "asc" },
      });
    }),

  /**
   * Obtenir une navigation par emplacement.
   */
  obtenir: procedureProtegee
    .input(z.object({
      idSite: z.string(),
      emplacement: z.enum(["ENTETE", "PIED_DE_PAGE", "BARRE_LATERALE"]),
    }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      return ctx.db.navigation.findUnique({
        where: {
          idSite_emplacement: {
            idSite: input.idSite,
            emplacement: input.emplacement,
          },
        },
      });
    }),

  /**
   * Créer ou mettre à jour une navigation (upsert par emplacement).
   * EDITEUR+ peut modifier.
   */
  enregistrer: procedureProtegee
    .input(schemaUpsertNavigation)
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      const navigation = await ctx.db.navigation.upsert({
        where: {
          idSite_emplacement: {
            idSite: input.idSite,
            emplacement: input.emplacement,
          },
        },
        create: {
          idSite: input.idSite,
          libelle: input.libelle,
          emplacement: input.emplacement,
          elements: JSON.parse(JSON.stringify(input.elements)),
        },
        update: {
          libelle: input.libelle,
          elements: JSON.parse(JSON.stringify(input.elements)),
        },
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "navigation.enregistree",
          typeRessource: "navigation",
          idRessource: navigation.id,
          metadonnees: { emplacement: input.emplacement, nbElements: input.elements.length },
        },
      });

      return navigation;
    }),

  /**
   * Supprimer une navigation.
   * ADMINISTRATEUR+ peut supprimer.
   */
  supprimer: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");

      const nav = await ctx.db.navigation.findUnique({ where: { id: input.id } });
      if (!nav || nav.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Navigation introuvable." });
      }

      await ctx.db.navigation.delete({ where: { id: input.id } });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "navigation.supprimee",
          typeRessource: "navigation",
          idRessource: input.id,
          metadonnees: { emplacement: nav.emplacement },
        },
      });

      return { succes: true };
    }),
});
