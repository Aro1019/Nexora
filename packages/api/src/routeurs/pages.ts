/**
 * Routeur tRPC pour les pages d'un site.
 * CRUD complet : lister, obtenir, créer, modifier, supprimer, publier.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
import { creerRouteur, procedureProtegee } from "../trpc";
import { signerJetonApercu } from "../lib/jeton-apercu";
import { declencherEvenementWebhook } from "../lib/webhooks";

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
  langue: z
    .string()
    .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/)
    .default("fr"),
  typePage: z.enum(["ACCUEIL", "PAGE", "ARTICLE", "INDEX_BLOG"]).default("PAGE"),
  contenu: z.any().default([]),
  /* Champs optionnels */
  titreMeta: z.string().max(70).optional(),
  descriptionMeta: z.string().max(160).optional(),
  extrait: z.string().max(500).optional(),
  idParent: z.string().optional(),
  idsCategories: z.array(z.string()).optional(),
  idsEtiquettes: z.array(z.string()).optional(),
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
  idsCategories: z.array(z.string()).optional(),
  idsEtiquettes: z.array(z.string()).optional(),
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
        langue: z.string().optional(),
        idCategorie: z.string().optional(),
        idEtiquette: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      const filtres: Record<string, unknown> = { idSite: input.idSite };
      if (input.typePage) filtres.typePage = input.typePage;
      if (input.statut) filtres.statut = input.statut;
      if (input.langue) filtres.langue = input.langue;
      if (input.idCategorie) {
        filtres.categoriesPage = { some: { idCategorie: input.idCategorie } };
      }
      if (input.idEtiquette) {
        filtres.etiquettesPage = { some: { idEtiquette: input.idEtiquette } };
      }

      const pages = await ctx.db.page.findMany({
        where: filtres,
        select: {
          id: true,
          titre: true,
          slug: true,
          chemin: true,
          typePage: true,
          statut: true,
          langue: true,
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

      /* Vérifier l'unicité du slug pour cette langue sur ce site */
      const slugExistant = await ctx.db.page.findFirst({
        where: { idSite: input.idSite, slug: input.slug, langue: input.langue },
      });
      if (slugExistant) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Une page avec ce slug existe déjà dans cette langue.",
        });
      }

      /* Vérifier que la langue est activée sur le site */
      const siteCible = await ctx.db.site.findUnique({
        where: { id: input.idSite },
        select: { langues: true },
      });
      if (siteCible && !siteCible.langues.includes(input.langue)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cette langue n'est pas activée sur ce site.",
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
          langue: input.langue,
          typePage: input.typePage,
          contenu: input.contenu,
          titreMeta: input.titreMeta,
          descriptionMeta: input.descriptionMeta,
          extrait: input.extrait,
          idParent: input.idParent,
          ...(input.idsCategories && input.idsCategories.length > 0
            ? {
                categoriesPage: {
                  create: input.idsCategories.map((idCategorie) => ({
                    idCategorie,
                  })),
                },
              }
            : {}),
          ...(input.idsEtiquettes && input.idsEtiquettes.length > 0
            ? {
                etiquettesPage: {
                  create: input.idsEtiquettes.map((idEtiquette) => ({
                    idEtiquette,
                  })),
                },
              }
            : {}),
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
        select: {
          idSite: true,
          chemin: true,
          slug: true,
          langue: true,
          contenu: true,
          titre: true,
          titreMeta: true,
          descriptionMeta: true,
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            select: { version: true, creeLe: true, creePar: true },
          },
        },
      });
      if (!pageExistante || pageExistante.idSite !== idSite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page introuvable.",
        });
      }

      /* Si le slug change, vérifier l'unicité dans la même langue */
      if (donnees.slug && donnees.slug !== pageExistante.slug) {
        const slugPris = await ctx.db.page.findFirst({
          where: {
            idSite,
            slug: donnees.slug,
            langue: pageExistante.langue,
            NOT: { id },
          },
        });
        if (slugPris) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Une page avec ce slug existe déjà dans cette langue.",
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

      /* Les jonctions cat/étiq sont gérées à part (delete + create) */
      const idsCategories = donneesFinales.idsCategories as string[] | undefined;
      const idsEtiquettes = donneesFinales.idsEtiquettes as string[] | undefined;
      const publierApres = donneesFinales.publierApres as boolean | undefined;
      const notePublication = donneesFinales.notePublication as string | undefined;
      delete donneesFinales.idsCategories;
      delete donneesFinales.idsEtiquettes;
      delete donneesFinales.publierApres;
      delete donneesFinales.notePublication;

      const page = await ctx.db.page.update({
        where: { id },
        data: donneesFinales,
      });

      if (idsCategories !== undefined) {
        await ctx.db.pageCategorie.deleteMany({ where: { idPage: id } });
        if (idsCategories.length > 0) {
          await ctx.db.pageCategorie.createMany({
            data: idsCategories.map((idCategorie) => ({ idPage: id, idCategorie })),
          });
        }
      }

      if (idsEtiquettes !== undefined) {
        await ctx.db.pageEtiquette.deleteMany({ where: { idPage: id } });
        if (idsEtiquettes.length > 0) {
          await ctx.db.pageEtiquette.createMany({
            data: idsEtiquettes.map((idEtiquette) => ({ idPage: id, idEtiquette })),
          });
        }
      }

      /* Snapshot de version : créé si le contenu a changé et que la
         dernière version d'auto-snapshot a plus de 2 minutes (throttle).
         Les snapshots manuels (publication) restent toujours créés. */
      const contenuAChange =
        donnees.contenu !== undefined &&
        JSON.stringify(donnees.contenu) !== JSON.stringify(pageExistante.contenu);
      const derniereVersion = pageExistante.versions[0];
      const ageDerniereSec = derniereVersion
        ? (Date.now() - new Date(derniereVersion.creeLe).getTime()) / 1000
        : Infinity;
      const memeAuteurRecent =
        derniereVersion?.creePar === ctx.utilisateur.id && ageDerniereSec < 120;

      if (contenuAChange && !memeAuteurRecent) {
        const prochainNumero = (derniereVersion?.version ?? 0) + 1;
        await ctx.db.versionPage.create({
          data: {
            idPage: id,
            version: prochainNumero,
            contenu: (donnees.contenu ?? pageExistante.contenu) as object,
            titre: donnees.titre ?? pageExistante.titre,
            titreMeta: donnees.titreMeta ?? pageExistante.titreMeta,
            descriptionMeta:
              donnees.descriptionMeta ?? pageExistante.descriptionMeta,
            creePar: ctx.utilisateur.id,
            note: "Sauvegarde automatique",
          },
        });

        /* Auto-purge : ne garder que les 50 dernières versions */
        const versionsAGarder = await ctx.db.versionPage.findMany({
          where: { idPage: id },
          orderBy: { version: "desc" },
          skip: 50,
          select: { id: true, publiePour: { select: { id: true } } },
        });
        const aSupprimer = versionsAGarder
          .filter((v) => !v.publiePour)
          .map((v) => v.id);
        if (aSupprimer.length > 0) {
          await ctx.db.versionPage.deleteMany({
            where: { id: { in: aSupprimer } },
          });
        }
      }

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

      /* Publication intégrée (évite un aller-retour supplémentaire) */
      if (publierApres) {
        const dernieres = await ctx.db.versionPage.findMany({
          where: { idPage: id },
          orderBy: { version: "desc" },
          take: 1,
          select: { version: true },
        });
        const prochainNumero = (dernieres[0]?.version ?? 0) + 1;

        const versionPubliee = await ctx.db.versionPage.create({
          data: {
            idPage: id,
            version: prochainNumero,
            contenu: (donnees.contenu ?? pageExistante.contenu) as object,
            titre: donnees.titre ?? pageExistante.titre,
            titreMeta: donnees.titreMeta ?? pageExistante.titreMeta,
            descriptionMeta: donnees.descriptionMeta ?? pageExistante.descriptionMeta,
            creePar: ctx.utilisateur.id,
            note: notePublication,
          },
        });

        const pagePubliee = await ctx.db.page.update({
          where: { id },
          data: {
            statut: "PUBLIE",
            idVersionPubliee: versionPubliee.id,
            publieLe: page.publieLe ?? new Date(),
          },
        });

        await ctx.db.journalAudit.create({
          data: {
            idSite,
            idUtilisateur: ctx.utilisateur.id,
            action: "page.publiee",
            typeRessource: "page",
            idRessource: id,
            metadonnees: { version: prochainNumero, note: notePublication },
          },
        });

        declencherEvenementWebhook({
          db: ctx.db,
          idSite,
          evenement: "page.publiee",
          charge: {
            id_page: id,
            slug: pagePubliee.slug,
            titre: pagePubliee.titre,
            version: prochainNumero,
            publie_le: pagePubliee.publieLe?.toISOString() ?? null,
          },
        });

        return pagePubliee;
      }

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

      /* Déclencher webhooks */
      declencherEvenementWebhook({
        db: ctx.db,
        idSite: input.idSite,
        evenement: "page.publiee",
        charge: {
          id_page: page.id,
          slug: page.slug,
          titre: page.titre,
          version: prochainNumero,
          publie_le: pageMiseAJour.publieLe?.toISOString() ?? null,
        },
      });

      return pageMiseAJour;
    }),

  /**
   * Dupliquer une page dans une autre langue.
   * Crée une nouvelle page avec le même contenu, dans la langue cible,
   * en statut BROUILLON. EDITEUR+ requis.
   */
  dupliquerDansLangue: procedureProtegee
    .input(
      z.object({
        id: z.string(),
        idSite: z.string(),
        langueCible: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      const source = await ctx.db.page.findUnique({ where: { id: input.id } });
      if (!source || source.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Page introuvable." });
      }
      if (source.langue === input.langueCible) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La page est déjà dans cette langue.",
        });
      }

      /* Vérifier que la langue cible est activée */
      const site = await ctx.db.site.findUnique({
        where: { id: input.idSite },
        select: { langues: true },
      });
      if (site && !site.langues.includes(input.langueCible)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cette langue n'est pas activée sur le site.",
        });
      }

      /* Vérifier qu'aucune page n'existe déjà avec ce slug dans la langue cible */
      const conflit = await ctx.db.page.findFirst({
        where: {
          idSite: input.idSite,
          slug: source.slug,
          langue: input.langueCible,
        },
      });
      if (conflit) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Une page avec ce slug existe déjà dans la langue cible.",
        });
      }

      const copie = await ctx.db.page.create({
        data: {
          idSite: source.idSite,
          titre: source.titre,
          slug: source.slug,
          chemin: source.chemin,
          langue: input.langueCible,
          typePage: source.typePage,
          contenu: source.contenu ?? [],
          titreMeta: source.titreMeta,
          descriptionMeta: source.descriptionMeta,
          extrait: source.extrait,
          imageMiseEnAvant: source.imageMiseEnAvant,
          idParent: source.idParent,
          statut: "BROUILLON",
        },
      });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "page.dupliquee",
          typeRessource: "page",
          idRessource: copie.id,
          metadonnees: {
            sourceId: source.id,
            langueSource: source.langue,
            langueCible: input.langueCible,
          },
        },
      });

      return copie;
    }),

  /**
   * Génère un lien d'aperçu signé permettant de partager une page (même
   * en BROUILLON) avec un visiteur non authentifié pendant une durée limitée.
   * EDITEUR+ requis.
   */
  creerLienApercu: procedureProtegee
    .input(
      z.object({
        id: z.string(),
        idSite: z.string(),
        /** Durée de validité en heures (1 à 720 = 30 jours). */
        dureeHeures: z.number().int().min(1).max(720).default(72),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      /* Vérifier que la page existe et appartient bien au site */
      const page = await ctx.db.page.findUnique({
        where: { id: input.id },
        select: { id: true, idSite: true },
      });
      if (!page || page.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Page introuvable." });
      }

      const jeton = signerJetonApercu(
        { idPage: input.id, idSite: input.idSite },
        input.dureeHeures * 3600
      );

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "page.lien_apercu_cree",
          typeRessource: "page",
          idRessource: input.id,
          metadonnees: { dureeHeures: input.dureeHeures },
        },
      });

      return {
        jeton,
        expireDans: input.dureeHeures * 3600,
      };
    }),
});
