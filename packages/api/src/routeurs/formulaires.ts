/**
 * Routeur tRPC pour les formulaires d'un site.
 * Gère la définition, la liste, les soumissions et la mutation publique de soumission.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
import { creerRouteur, procedureProtegee, procedurePublique } from "../trpc";
import { declencherEvenementWebhook } from "../lib/webhooks";

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
      message: "Droits insuffisants.",
    });
  }
  return membre;
}

// ─────────────────────────────────────────
// Schémas
// ─────────────────────────────────────────

/** Types de champs supportés dans le builder */
const TYPE_CHAMP = z.enum([
  "texte",
  "email",
  "telephone",
  "zone-texte",
  "nombre",
  "url",
  "case-a-cocher",
  "selection",
]);

/** Définition d'un champ de formulaire */
const schemaChamp = z.object({
  id: z.string(),
  type: TYPE_CHAMP,
  libelle: z.string().min(1).max(100),
  nom: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9_]*$/, {
      message: "Nom technique invalide (minuscules, chiffres, underscore)",
    }),
  placeholder: z.string().max(200).optional(),
  obligatoire: z.boolean().default(false),
  /** Pour le type "selection" uniquement */
  options: z.array(z.string().min(1).max(100)).optional(),
});

const schemaCreer = z.object({
  idSite: z.string(),
  nom: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug invalide (minuscules, chiffres, tirets uniquement)",
    }),
  champs: z.array(schemaChamp).min(1, "Au moins un champ est requis"),
  libelleEnvoi: z.string().min(1).max(50).default("Envoyer"),
  messageSucces: z.string().min(1).max(500),
  emailNotification: z.string().email().nullable().optional(),
});

const schemaModifier = schemaCreer.partial({ idSite: true }).extend({
  id: z.string(),
  idSite: z.string(),
});

// ─────────────────────────────────────────
// Routeur
// ─────────────────────────────────────────

export const routeurFormulaires = creerRouteur({
  /**
   * Lister les formulaires d'un site.
   * LECTEUR+ peut voir.
   */
  lister: procedureProtegee
    .input(z.object({ idSite: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      return ctx.db.formulaire.findMany({
        where: { idSite: input.idSite },
        orderBy: { creeLe: "desc" },
        include: {
          _count: { select: { soumissions: true } },
        },
      });
    }),

  /** Obtenir un formulaire par son ID. */
  obtenir: procedureProtegee
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const formulaire = await ctx.db.formulaire.findUnique({
        where: { id: input.id },
        include: {
          _count: { select: { soumissions: true } },
        },
      });
      if (!formulaire) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Formulaire introuvable." });
      }
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, formulaire.idSite, "LECTEUR");
      return formulaire;
    }),

  /** Créer un formulaire. EDITEUR+. */
  creer: procedureProtegee
    .input(schemaCreer)
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      /* Vérifier l'unicité du slug */
      const existe = await ctx.db.formulaire.findUnique({
        where: { idSite_slug: { idSite: input.idSite, slug: input.slug } },
      });
      if (existe) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Un formulaire avec ce slug existe déjà.",
        });
      }

      const formulaire = await ctx.db.formulaire.create({
        data: {
          idSite: input.idSite,
          nom: input.nom,
          slug: input.slug,
          champs: JSON.parse(JSON.stringify(input.champs)),
          libelleEnvoi: input.libelleEnvoi,
          messageSucces: input.messageSucces,
          emailNotification: input.emailNotification ?? null,
        },
      });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "formulaire.cree",
          typeRessource: "formulaire",
          idRessource: formulaire.id,
          metadonnees: { nom: input.nom, nbChamps: input.champs.length },
        },
      });

      return formulaire;
    }),

  /** Modifier un formulaire. EDITEUR+. */
  modifier: procedureProtegee
    .input(schemaModifier)
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      const formulaire = await ctx.db.formulaire.findUnique({
        where: { id: input.id },
      });
      if (!formulaire || formulaire.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Formulaire introuvable." });
      }

      /* Vérifier l'unicité du slug s'il a changé */
      if (input.slug && input.slug !== formulaire.slug) {
        const existe = await ctx.db.formulaire.findUnique({
          where: { idSite_slug: { idSite: input.idSite, slug: input.slug } },
        });
        if (existe) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Un formulaire avec ce slug existe déjà.",
          });
        }
      }

      const maj = await ctx.db.formulaire.update({
        where: { id: input.id },
        data: {
          nom: input.nom ?? undefined,
          slug: input.slug ?? undefined,
          champs:
            input.champs !== undefined
              ? JSON.parse(JSON.stringify(input.champs))
              : undefined,
          libelleEnvoi: input.libelleEnvoi ?? undefined,
          messageSucces: input.messageSucces ?? undefined,
          emailNotification:
            input.emailNotification === undefined
              ? undefined
              : (input.emailNotification ?? null),
        },
      });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "formulaire.modifie",
          typeRessource: "formulaire",
          idRessource: maj.id,
          metadonnees: { nom: maj.nom },
        },
      });

      return maj;
    }),

  /** Supprimer un formulaire. ADMINISTRATEUR+. */
  supprimer: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");

      const formulaire = await ctx.db.formulaire.findUnique({
        where: { id: input.id },
      });
      if (!formulaire || formulaire.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Formulaire introuvable." });
      }

      await ctx.db.formulaire.delete({ where: { id: input.id } });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "formulaire.supprime",
          typeRessource: "formulaire",
          idRessource: input.id,
          metadonnees: { nom: formulaire.nom },
        },
      });

      return { succes: true };
    }),

  // ─────────────────────────────────────────
  // SOUMISSIONS
  // ─────────────────────────────────────────

  /** Lister les soumissions d'un formulaire. LECTEUR+. */
  listerSoumissions: procedureProtegee
    .input(
      z.object({
        idFormulaire: z.string(),
        seulementNonLues: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const formulaire = await ctx.db.formulaire.findUnique({
        where: { id: input.idFormulaire },
        select: { idSite: true },
      });
      if (!formulaire) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Formulaire introuvable." });
      }
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, formulaire.idSite, "LECTEUR");

      return ctx.db.soumissionFormulaire.findMany({
        where: {
          idFormulaire: input.idFormulaire,
          ...(input.seulementNonLues ? { estLu: false } : {}),
        },
        orderBy: { creeLe: "desc" },
        take: 200,
      });
    }),

  /** Marquer une soumission comme lue/non lue. EDITEUR+. */
  marquerLue: procedureProtegee
    .input(z.object({ id: z.string(), estLu: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const soumission = await ctx.db.soumissionFormulaire.findUnique({
        where: { id: input.id },
        include: { formulaire: { select: { idSite: true } } },
      });
      if (!soumission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Soumission introuvable." });
      }
      await verifierAccesSite(
        ctx.db,
        ctx.utilisateur.id,
        soumission.formulaire.idSite,
        "EDITEUR"
      );

      return ctx.db.soumissionFormulaire.update({
        where: { id: input.id },
        data: { estLu: input.estLu },
      });
    }),

  /** Supprimer une soumission. EDITEUR+. */
  supprimerSoumission: procedureProtegee
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const soumission = await ctx.db.soumissionFormulaire.findUnique({
        where: { id: input.id },
        include: { formulaire: { select: { idSite: true } } },
      });
      if (!soumission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Soumission introuvable." });
      }
      await verifierAccesSite(
        ctx.db,
        ctx.utilisateur.id,
        soumission.formulaire.idSite,
        "EDITEUR"
      );

      await ctx.db.soumissionFormulaire.delete({ where: { id: input.id } });
      return { succes: true };
    }),

  // ─────────────────────────────────────────
  // ENDPOINTS PUBLICS (site)
  // ─────────────────────────────────────────

  /**
   * Récupérer la définition publique d'un formulaire (par site + slug).
   * Aucune authentification requise.
   */
  obtenirPublic: procedurePublique
    .input(z.object({ idSite: z.string(), slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const formulaire = await ctx.db.formulaire.findUnique({
        where: { idSite_slug: { idSite: input.idSite, slug: input.slug } },
        select: {
          id: true,
          nom: true,
          slug: true,
          champs: true,
          libelleEnvoi: true,
          messageSucces: true,
        },
      });
      if (!formulaire) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Formulaire introuvable." });
      }
      return formulaire;
    }),

  /**
   * Soumettre un formulaire publiquement.
   * Validation côté serveur en fonction de la définition stockée.
   */
  soumettre: procedurePublique
    .input(
      z.object({
        idFormulaire: z.string(),
        donnees: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const formulaire = await ctx.db.formulaire.findUnique({
        where: { id: input.idFormulaire },
      });
      if (!formulaire) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Formulaire introuvable." });
      }

      /* Validation : reconstruire le schéma à partir de la définition stockée */
      const champs = formulaire.champs as unknown as Array<{
        nom: string;
        type: string;
        obligatoire?: boolean;
      }>;
      const erreurs: Record<string, string> = {};
      const donneesValidees: Record<string, unknown> = {};

      for (const champ of champs) {
        const valeurBrute = input.donnees[champ.nom];
        const presente =
          valeurBrute !== undefined && valeurBrute !== null && valeurBrute !== "";

        if (champ.obligatoire && !presente) {
          erreurs[champ.nom] = "Ce champ est obligatoire.";
          continue;
        }
        if (!presente) continue;

        /* Validation par type */
        if (champ.type === "email") {
          const ok = z.string().email().safeParse(valeurBrute).success;
          if (!ok) erreurs[champ.nom] = "Adresse e-mail invalide.";
        } else if (champ.type === "url") {
          const ok = z.string().url().safeParse(valeurBrute).success;
          if (!ok) erreurs[champ.nom] = "URL invalide.";
        } else if (champ.type === "nombre") {
          if (typeof valeurBrute !== "number" && isNaN(Number(valeurBrute))) {
            erreurs[champ.nom] = "Nombre invalide.";
          }
        } else if (champ.type === "case-a-cocher") {
          if (typeof valeurBrute !== "boolean") {
            erreurs[champ.nom] = "Valeur invalide.";
          }
        }

        donneesValidees[champ.nom] = valeurBrute;
      }

      if (Object.keys(erreurs).length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Certains champs sont invalides.",
          cause: erreurs,
        });
      }

      const soumission = await ctx.db.soumissionFormulaire.create({
        data: {
          idFormulaire: formulaire.id,
          donnees: donneesValidees as object,
        },
      });

      /* Journal d'audit (sans utilisateur — soumission publique) */
      await ctx.db.journalAudit.create({
        data: {
          idSite: formulaire.idSite,
          action: "formulaire.soumission",
          typeRessource: "soumission_formulaire",
          idRessource: soumission.id,
          metadonnees: { idFormulaire: formulaire.id },
        },
      });

      /* Déclencher les webhooks abonnés (fire & forget) */
      declencherEvenementWebhook({
        db: ctx.db,
        idSite: formulaire.idSite,
        evenement: "soumission_formulaire.creee",
        charge: {
          id_soumission: soumission.id,
          id_formulaire: formulaire.id,
          slug_formulaire: formulaire.slug,
          nom_formulaire: formulaire.nom,
          donnees: donneesValidees,
        },
      });

      return {
        succes: true,
        message: formulaire.messageSucces,
      };
    }),
});
