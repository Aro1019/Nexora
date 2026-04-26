/**
 * Routeur tRPC pour les pages d'un site.
 * CRUD complet : lister, obtenir, créer, modifier, supprimer, publier.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
import { creerRouteur, procedureProtegee } from "../trpc";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/** Vérifie que l'utilisateur est au moins EDITEUR sur le site */
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
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Vous n'avez pas les droits suffisants.",
    });
  }

  return membre;
}

// ─────────────────────────────────────────
// Schémas de validation
// ─────────────────────────────────────────

const schemaCreationPage = z.object({
  idSite: z.string(),
  titre: z.string().min(1, "Le titre est requis").max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets"
    ),
  typePage: z.enum(["ACCUEIL", "PAGE", "ARTICLE", "INDEX_BLOG"]).default("PAGE"),
  contenu: z.any().default([]),
  /* Champs optionnels */
  titreMeta: z.string().max(70).optional(),
  descriptionMeta: z.string().max(160).optional(),
  extrait: z.string().max(500).optional(),
  idParent: z.string().optional(),
});

const schemaModificationPage = z.object({
  id: z.string(),
  idSite: z.string(),
  titre: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  contenu: z.any().optional(),
  statut: z.enum(["BROUILLON", "PUBLIE", "PLANIFIE", "ARCHIVE"]).optional(),
  titreMeta: z.string().max(70).optional().nullable(),
  descriptionMeta: z.string().max(160).optional().nullable(),
  extrait: z.string().max(500).optional().nullable(),
  imageMiseEnAvant: z.string().optional().nullable(),
  nonIndexe: z.boolean().optional(),
  ordreAffichage: z.number().int().optional(),
  idParent: z.string().optional().nullable(),
  publieLe: z.string().datetime().optional().nullable(),
  planifieLe: z.string().datetime().optional().nullable(),
});

// ─────────────────────────────────────────
// Routeur
// ─────────────────────────────────────────

export const routeurPages = creerRouteur({
  /**
   * Lister les pages d'un site.
   * LECTEUR+ peut voir la liste.
   */
  lister: procedureProtegee
    .input(
      z.object({
        idSite: z.string(),
        typePage: z.enum(["ACCUEIL", "PAGE", "ARTICLE", "INDEX_BLOG"]).optional(),
        statut: z.enum(["BROUILLON", "PUBLIE", "PLANIFIE", "ARCHIVE"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      const filtres: Record<string, unknown> = { idSite: input.idSite };
      if (input.typePage) filtres.typePage = input.typePage;
      if (input.statut) filtres.statut = input.statut;

      const pages = await ctx.db.page.findMany({
        where: filtres,
        select: {
          id: true,
          titre: true,
          slug: true,
          chemin: true,
          typePage: true,
          statut: true,
          ordreAffichage: true,
          publieLe: true,
          creeLe: true,
          misAJourLe: true,
          idParent: true,
        },
        orderBy: [{ ordreAffichage: "asc" }, { creeLe: "desc" }],
      });

      return pages;
    }),

  /**
   * Obtenir une page par son ID.
   * LECTEUR+ peut voir le détail.
   */
  obtenir: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      const page = await ctx.db.page.findUnique({
        where: { id: input.id },
        include: {
          versions: {
            select: { id: true, version: true, titre: true, creeLe: true, creePar: true, note: true },
            orderBy: { version: "desc" },
            take: 10,
          },
          categoriesPage: {
            include: { categorie: { select: { id: true, nom: true, slug: true } } },
          },
          etiquettesPage: {
            include: { etiquette: { select: { id: true, nom: true, slug: true } } },
          },
        },
      });

      if (!page || page.idSite !== input.idSite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page introuvable.",
        });
      }

      return page;
    }),

  /**
   * Créer une nouvelle page.
   * EDITEUR+ peut créer des pages.
   */
  creer: procedureProtegee
    .input(schemaCreationPage)
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      /* Vérifier l'unicité du slug sur ce site */
      const slugExistant = await ctx.db.page.findFirst({
        where: { idSite: input.idSite, slug: input.slug, langue: "fr" },
      });
      if (slugExistant) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Une page avec ce slug existe déjà sur ce site.",
        });
      }

      /* Construire le chemin */
      let chemin = `/${input.slug}`;
      if (input.idParent) {
        const parent = await ctx.db.page.findUnique({
          where: { id: input.idParent },
          select: { chemin: true, idSite: true },
        });
        if (parent && parent.idSite === input.idSite) {
          chemin = `${parent.chemin}/${input.slug}`;
        }
      }
      if (input.typePage === "ACCUEIL") chemin = "/";

      const page = await ctx.db.page.create({
        data: {
          idSite: input.idSite,
          titre: input.titre,
          slug: input.slug,
          chemin,
          typePage: input.typePage,
          contenu: input.contenu,
          titreMeta: input.titreMeta,
          descriptionMeta: input.descriptionMeta,
          extrait: input.extrait,
          idParent: input.idParent,
        },
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "page.creee",
          typeRessource: "page",
          idRessource: page.id,
          metadonnees: { titre: page.titre, typePage: page.typePage },
        },
      });

      return page;
    }),

  /**
   * Modifier une page existante.
   * EDITEUR+ peut modifier.
   */
  modifier: procedureProtegee
    .input(schemaModificationPage)
    .mutation(async ({ ctx, input }) => {
      const { id, idSite, ...donnees } = input;
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, idSite, "EDITEUR");

      /* Vérifier que la page existe et appartient au site */
      const pageExistante = await ctx.db.page.findUnique({
        where: { id },
        select: { idSite: true, chemin: true, slug: true },
      });
      if (!pageExistante || pageExistante.idSite !== idSite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page introuvable.",
        });
      }

      /* Si le slug change, vérifier l'unicité */
      if (donnees.slug && donnees.slug !== pageExistante.slug) {
        const slugPris = await ctx.db.page.findFirst({
          where: { idSite, slug: donnees.slug, langue: "fr", NOT: { id } },
        });
        if (slugPris) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Une page avec ce slug existe déjà.",
          });
        }
      }

      /* Convertir les dates string en Date si présentes */
      const donneesFinales: Record<string, unknown> = { ...donnees };
      if (donnees.publieLe !== undefined) {
        donneesFinales.publieLe = donnees.publieLe ? new Date(donnees.publieLe) : null;
      }
      if (donnees.planifieLe !== undefined) {
        donneesFinales.planifieLe = donnees.planifieLe ? new Date(donnees.planifieLe) : null;
      }

      const page = await ctx.db.page.update({
        where: { id },
        data: donneesFinales,
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "page.modifiee",
          typeRessource: "page",
          idRessource: id,
          metadonnees: donnees,
        },
      });

      return page;
    }),

  /**
   * Supprimer une page.
   * ADMINISTRATEUR+ peut supprimer.
   */
  supprimer: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");

      const page = await ctx.db.page.findUnique({
        where: { id: input.id },
        select: { idSite: true, titre: true, typePage: true },
      });

      if (!page || page.idSite !== input.idSite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page introuvable.",
        });
      }

      /* Empêcher la suppression de la page d'accueil */
      if (page.typePage === "ACCUEIL") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "La page d'accueil ne peut pas être supprimée.",
        });
      }

      await ctx.db.page.delete({ where: { id: input.id } });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "page.supprimee",
          typeRessource: "page",
          idRessource: input.id,
          metadonnees: { titre: page.titre },
        },
      });

      return { succes: true };
    }),

  /**
   * Publier une page — crée une version snapshot et change le statut.
   * EDITEUR+ peut publier.
   */
  publier: procedureProtegee
    .input(
      z.object({
        id: z.string(),
        idSite: z.string(),
        note: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      const page = await ctx.db.page.findUnique({
        where: { id: input.id },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            select: { version: true },
          },
        },
      });

      if (!page || page.idSite !== input.idSite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page introuvable.",
        });
      }

      const prochainNumero = (page.versions[0]?.version ?? 0) + 1;

      /* Créer la version snapshot */
      const version = await ctx.db.versionPage.create({
        data: {
          idPage: page.id,
          version: prochainNumero,
          contenu: page.contenu ?? [],
          titre: page.titre,
          titreMeta: page.titreMeta,
          descriptionMeta: page.descriptionMeta,
          creePar: ctx.utilisateur.id,
          note: input.note,
        },
      });

      /* Mettre à jour la page : statut + référence à la version publiée */
      const pageMiseAJour = await ctx.db.page.update({
        where: { id: page.id },
        data: {
          statut: "PUBLIE",
          idVersionPubliee: version.id,
          publieLe: page.publieLe ?? new Date(),
        },
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "page.publiee",
          typeRessource: "page",
          idRessource: page.id,
          metadonnees: { version: prochainNumero, note: input.note },
        },
      });

      return pageMiseAJour;
    }),
});
