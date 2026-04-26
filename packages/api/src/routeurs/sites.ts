/**
 * Routeur tRPC pour les sites.
 * CRUD complet : lister, obtenir, créer, modifier, supprimer.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { creerRouteur, procedureProtegee } from "../trpc";

/** Schéma de validation pour la création d'un site */
const schemaCreationSite = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets"),
  description: z.string().max(500).optional(),
  typeSite: z.enum(["VITRINE", "BLOG", "PORTFOLIO", "ECOMMERCE"]),
});

/** Schéma de validation pour la modification d'un site */
const schemaModificationSite = z.object({
  id: z.string(),
  nom: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().max(500).optional(),
  typeSite: z.enum(["VITRINE", "BLOG", "PORTFOLIO", "ECOMMERCE"]).optional(),
  statut: z.enum(["BROUILLON", "PUBLIE", "MAINTENANCE", "ARCHIVE"]).optional(),
});

export const routeurSites = creerRouteur({
  /**
   * Lister tous les sites de l'utilisateur connecté.
   * Retourne les sites où l'utilisateur est membre.
   */
  lister: procedureProtegee.query(async ({ ctx }) => {
    const sites = await ctx.db.site.findMany({
      where: {
        membres: {
          some: {
            idUtilisateur: ctx.utilisateur.id,
          },
        },
      },
      include: {
        membres: {
          where: { idUtilisateur: ctx.utilisateur.id },
          select: { role: true },
        },
        _count: {
          select: { pages: true, medias: true },
        },
      },
      orderBy: { creeLe: "desc" },
    });

    return sites.map((site) => ({
      id: site.id,
      nom: site.nom,
      slug: site.slug,
      description: site.description,
      typeSite: site.typeSite,
      statut: site.statut,
      role: site.membres[0]?.role ?? "LECTEUR",
      nombrePages: site._count.pages,
      nombreMedias: site._count.medias,
      creeLe: site.creeLe,
      misAJourLe: site.misAJourLe,
    }));
  }),

  /**
   * Obtenir un site par son slug.
   * Vérifie que l'utilisateur est bien membre du site.
   */
  obtenir: procedureProtegee
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const site = await ctx.db.site.findUnique({
        where: { slug: input.slug },
        include: {
          membres: {
            include: {
              utilisateur: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          reglages: true,
          _count: {
            select: { pages: true, medias: true, navigations: true },
          },
        },
      });

      if (!site) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Site introuvable.",
        });
      }

      /* Vérifier que l'utilisateur est membre */
      const membre = site.membres.find(
        (m) => m.idUtilisateur === ctx.utilisateur.id
      );
      if (!membre) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous n'avez pas accès à ce site.",
        });
      }

      return {
        ...site,
        roleCourant: membre.role,
      };
    }),

  /**
   * Créer un nouveau site.
   * L'utilisateur devient automatiquement PROPRIETAIRE.
   */
  creer: procedureProtegee
    .input(schemaCreationSite)
    .mutation(async ({ ctx, input }) => {
      /* Vérifier l'unicité du slug */
      const slugExistant = await ctx.db.site.findUnique({
        where: { slug: input.slug },
      });
      if (slugExistant) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ce slug est déjà utilisé. Veuillez en choisir un autre.",
        });
      }

      /* Créer le site avec le membre propriétaire et les réglages par défaut */
      const site = await ctx.db.site.create({
        data: {
          nom: input.nom,
          slug: input.slug,
          description: input.description,
          typeSite: input.typeSite,
          membres: {
            create: {
              idUtilisateur: ctx.utilisateur.id,
              role: "PROPRIETAIRE",
            },
          },
          reglages: {
            create: {},
          },
        },
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: site.id,
          idUtilisateur: ctx.utilisateur.id,
          action: "site.cree",
          typeRessource: "site",
          idRessource: site.id,
          metadonnees: { nom: site.nom, typeSite: site.typeSite },
        },
      });

      return site;
    }),

  /**
   * Modifier un site existant.
   * Seuls les PROPRIETAIRE et ADMINISTRATEUR peuvent modifier.
   */
  modifier: procedureProtegee
    .input(schemaModificationSite)
    .mutation(async ({ ctx, input }) => {
      const { id, ...donnees } = input;

      /* Vérifier l'accès */
      const membre = await ctx.db.membreSite.findUnique({
        where: {
          idUtilisateur_idSite: {
            idUtilisateur: ctx.utilisateur.id,
            idSite: id,
          },
        },
      });

      if (!membre || !["PROPRIETAIRE", "ADMINISTRATEUR"].includes(membre.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous n'avez pas les droits pour modifier ce site.",
        });
      }

      /* Vérifier l'unicité du nouveau slug si changé */
      if (donnees.slug) {
        const slugExistant = await ctx.db.site.findFirst({
          where: { slug: donnees.slug, NOT: { id } },
        });
        if (slugExistant) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ce slug est déjà utilisé.",
          });
        }
      }

      const site = await ctx.db.site.update({
        where: { id },
        data: donnees,
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: id,
          idUtilisateur: ctx.utilisateur.id,
          action: "site.modifie",
          typeRessource: "site",
          idRessource: id,
          metadonnees: donnees,
        },
      });

      return site;
    }),

  /**
   * Supprimer un site.
   * Seul le PROPRIETAIRE peut supprimer un site.
   */
  supprimer: procedureProtegee
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membre = await ctx.db.membreSite.findUnique({
        where: {
          idUtilisateur_idSite: {
            idUtilisateur: ctx.utilisateur.id,
            idSite: input.id,
          },
        },
      });

      if (!membre || membre.role !== "PROPRIETAIRE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seul le propriétaire peut supprimer un site.",
        });
      }

      await ctx.db.site.delete({ where: { id: input.id } });
      return { succes: true };
    }),

  /**
   * Compter les sites de l'utilisateur (pour les stats du dashboard).
   */
  compter: procedureProtegee.query(async ({ ctx }) => {
    const [nombreSites, nombrePages, nombreMedias] = await Promise.all([
      ctx.db.site.count({
        where: { membres: { some: { idUtilisateur: ctx.utilisateur.id } } },
      }),
      ctx.db.page.count({
        where: {
          site: { membres: { some: { idUtilisateur: ctx.utilisateur.id } } },
        },
      }),
      ctx.db.media.count({
        where: {
          site: { membres: { some: { idUtilisateur: ctx.utilisateur.id } } },
        },
      }),
    ]);

    return { nombreSites, nombrePages, nombreMedias };
  }),
});
