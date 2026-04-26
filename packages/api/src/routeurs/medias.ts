/**
 * Routeur tRPC pour les médias d'un site.
 * Upload (via URL présignée), liste, obtenir, supprimer.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
import {
  genererUrlUpload,
  construireUrlPublique,
  supprimerFichier,
  extraireCleDepuisUrl,
} from "@nexora/storage";
import { creerRouteur, procedureProtegee } from "../trpc";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/** Vérifie l'accès au site */
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

/** Types MIME autorisés */
const TYPES_MIME_AUTORISES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/ogg",
];

/** Taille maximum : 50 Mo */
const TAILLE_MAX = 50 * 1024 * 1024;

// ─────────────────────────────────────────
// Routeur
// ─────────────────────────────────────────

export const routeurMedias = creerRouteur({
  /**
   * Demander une URL présignée pour uploader un fichier.
   * EDITEUR+ peut uploader.
   * Retourne l'URL présignée + les infos pour créer le média après upload.
   */
  demanderUpload: procedureProtegee
    .input(
      z.object({
        idSite: z.string(),
        nomFichier: z.string().min(1).max(255),
        typeMime: z.string(),
        taille: z.number().int().positive(),
        largeur: z.number().int().positive().optional(),
        hauteur: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      /* Vérifier le type MIME */
      if (!TYPES_MIME_AUTORISES.includes(input.typeMime)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Type de fichier non autorisé : ${input.typeMime}. Types acceptés : images, PDF, vidéos, audio.`,
        });
      }

      /* Vérifier la taille */
      if (input.taille > TAILLE_MAX) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Le fichier dépasse la taille maximum autorisée (50 Mo).",
        });
      }

      /* Générer un nom unique pour éviter les collisions */
      const horodatage = Date.now();
      const nomNettoye = input.nomFichier
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .toLowerCase();
      const cle = `sites/${input.idSite}/${horodatage}-${nomNettoye}`;

      /* Générer l'URL présignée */
      const urlUpload = await genererUrlUpload(cle, input.typeMime);
      const urlPublique = construireUrlPublique(cle);

      return {
        urlUpload,
        urlPublique,
        cle,
      };
    }),

  /**
   * Confirmer qu'un fichier a été uploadé et créer l'entrée en base.
   * Appelé par le client après un upload réussi.
   */
  confirmerUpload: procedureProtegee
    .input(
      z.object({
        idSite: z.string(),
        nomFichier: z.string(),
        url: z.string(),
        typeMime: z.string(),
        taille: z.number().int().positive(),
        largeur: z.number().int().positive().optional(),
        hauteur: z.number().int().positive().optional(),
        texteAlternatif: z.string().max(200).optional(),
        dossier: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      const media = await ctx.db.media.create({
        data: {
          idSite: input.idSite,
          nomFichier: input.nomFichier,
          url: input.url,
          typeMime: input.typeMime,
          taille: input.taille,
          largeur: input.largeur,
          hauteur: input.hauteur,
          texteAlternatif: input.texteAlternatif,
          dossier: input.dossier,
        },
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "media.uploade",
          typeRessource: "media",
          idRessource: media.id,
          metadonnees: {
            nomFichier: media.nomFichier,
            typeMime: media.typeMime,
            taille: media.taille,
          },
        },
      });

      return media;
    }),

  /**
   * Lister les médias d'un site.
   * LECTEUR+ peut voir les médias.
   */
  lister: procedureProtegee
    .input(
      z.object({
        idSite: z.string(),
        dossier: z.string().optional(),
        typeMime: z.string().optional(),
        curseur: z.string().optional(),
        limite: z.number().int().min(1).max(100).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      const filtres: Record<string, unknown> = { idSite: input.idSite };
      if (input.dossier !== undefined) filtres.dossier = input.dossier || null;
      if (input.typeMime) filtres.typeMime = { startsWith: input.typeMime };

      const medias = await ctx.db.media.findMany({
        where: filtres,
        orderBy: { creeLe: "desc" },
        take: input.limite + 1,
        ...(input.curseur ? { cursor: { id: input.curseur }, skip: 1 } : {}),
      });

      let prochainCurseur: string | undefined;
      if (medias.length > input.limite) {
        const dernier = medias.pop();
        prochainCurseur = dernier?.id;
      }

      return {
        medias,
        prochainCurseur,
      };
    }),

  /**
   * Modifier les métadonnées d'un média.
   * EDITEUR+ peut modifier.
   */
  modifier: procedureProtegee
    .input(
      z.object({
        id: z.string(),
        idSite: z.string(),
        texteAlternatif: z.string().max(200).optional().nullable(),
        legende: z.string().max(500).optional().nullable(),
        dossier: z.string().max(100).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, idSite, ...donnees } = input;
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, idSite, "EDITEUR");

      const media = await ctx.db.media.findUnique({ where: { id } });
      if (!media || media.idSite !== idSite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Média introuvable.",
        });
      }

      return ctx.db.media.update({
        where: { id },
        data: donnees,
      });
    }),

  /**
   * Supprimer un média (fichier S3 + entrée base).
   * ADMINISTRATEUR+ peut supprimer.
   */
  supprimer: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");

      const media = await ctx.db.media.findUnique({ where: { id: input.id } });
      if (!media || media.idSite !== input.idSite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Média introuvable.",
        });
      }

      /* Supprimer le fichier du stockage S3 */
      const cle = extraireCleDepuisUrl(media.url);
      if (cle) {
        try {
          await supprimerFichier(cle);
        } catch {
          /* Log silencieux — le fichier sera orphelin mais on ne bloque pas */
        }
      }

      /* Supprimer l'entrée en base */
      await ctx.db.media.delete({ where: { id: input.id } });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "media.supprime",
          typeRessource: "media",
          idRessource: input.id,
          metadonnees: { nomFichier: media.nomFichier },
        },
      });

      return { succes: true };
    }),

  /**
   * Compter les médias d'un site.
   */
  compter: procedureProtegee
    .input(z.object({ idSite: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      const total = await ctx.db.media.count({
        where: { idSite: input.idSite },
      });

      const parType = await ctx.db.media.groupBy({
        by: ["typeMime"],
        where: { idSite: input.idSite },
        _count: true,
        _sum: { taille: true },
      });

      const tailleTotal = parType.reduce((acc, g) => acc + (g._sum.taille ?? 0), 0);

      return { total, tailleTotal, parType };
    }),
});
