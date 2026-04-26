/**
 * Routeur tRPC pour les réglages d'un site.
 * Obtenir et modifier les réglages visuels et techniques.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient, Prisma } from "@nexora/db";
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
// Schéma de validation
// ─────────────────────────────────────────

const schemaModificationReglages = z.object({
  idSite: z.string(),
  theme: z.string().max(50).optional(),
  couleurPrincipale: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale invalide").optional(),
  couleurAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale invalide").optional(),
  policeEnTete: z.string().max(50).optional(),
  policeCorps: z.string().max(50).optional(),
  rayonBordure: z.string().max(20).optional(),
  codeEntete: z.string().max(5000).optional().nullable(),
  codeDebutCorps: z.string().max(5000).optional().nullable(),
  codeFinCorps: z.string().max(5000).optional().nullable(),
  idSuiviGA: z.string().max(50).optional().nullable(),
  liensReseauxSociaux: z.record(z.string()).optional().nullable(),
  idPage404: z.string().optional().nullable(),
});

// ─────────────────────────────────────────
// Routeur
// ─────────────────────────────────────────

export const routeurReglages = creerRouteur({
  /**
   * Obtenir les réglages d'un site.
   * LECTEUR+ peut voir.
   */
  obtenir: procedureProtegee
    .input(z.object({ idSite: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      const reglages = await ctx.db.reglagesSite.findUnique({
        where: { idSite: input.idSite },
      });

      if (!reglages) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Réglages introuvables. Le site n'a pas de réglages configurés.",
        });
      }

      return reglages;
    }),

  /**
   * Modifier les réglages d'un site.
   * ADMINISTRATEUR+ peut modifier.
   */
  modifier: procedureProtegee
    .input(schemaModificationReglages)
    .mutation(async ({ ctx, input }) => {
      const { idSite, ...donnees } = input;
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, idSite, "ADMINISTRATEUR");

      const reglages = await ctx.db.reglagesSite.findUnique({
        where: { idSite },
      });

      if (!reglages) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Réglages introuvables.",
        });
      }

      /* Préparer les données — Prisma nécessite JsonNull pour les champs Json nullable */
      const donneesFinales: Record<string, unknown> = { ...donnees };
      if (donnees.liensReseauxSociaux === null) {
        donneesFinales.liensReseauxSociaux = Prisma.JsonNull;
      }

      const reglagesMisAJour = await ctx.db.reglagesSite.update({
        where: { idSite },
        data: donneesFinales,
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "reglages.modifies",
          typeRessource: "reglages",
          idRessource: reglages.id,
          metadonnees: donnees,
        },
      });

      return reglagesMisAJour;
    }),
});
