/**
 * Routeur tRPC pour la gestion des webhooks d'un site.
 * - CRUD complet (ADMINISTRATEUR+)
 * - Test de livraison à la demande
 * - Consultation et relance manuelle des livraisons
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
import { creerRouteur, procedureProtegee } from "../trpc";
import {
  declencherEvenementWebhook,
  genererSecretWebhook,
  tenterLivraison,
} from "../lib/webhooks";

const HIERARCHIE: Record<string, number> = {
  PROPRIETAIRE: 0,
  ADMINISTRATEUR: 1,
  EDITEUR: 2,
  LECTEUR: 3,
};

async function verifierAccesSite(
  db: PrismaClient,
  idUtilisateur: string,
  idSite: string,
  roleMinimum: "PROPRIETAIRE" | "ADMINISTRATEUR" | "EDITEUR" | "LECTEUR" = "LECTEUR"
) {
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

/** Liste des événements supportés. */
export const EVENEMENTS_DISPONIBLES = [
  "soumission_formulaire.creee",
  "page.publiee",
  "page.depubliee",
] as const;

const schemaUrl = z
  .string()
  .url("URL invalide")
  .refine((u) => u.startsWith("https://") || u.startsWith("http://"), {
    message: "URL doit commencer par http:// ou https://",
  });

export const routeurWebhooks = creerRouteur({
  /** Liste les webhooks d'un site. */
  lister: procedureProtegee
    .input(z.object({ idSite: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");
      return ctx.db.webhook.findMany({
        where: { idSite: input.idSite },
        orderBy: { creeLe: "desc" },
        include: {
          _count: { select: { livraisons: true } },
        },
      });
    }),

  /** Crée un webhook avec un secret généré automatiquement. */
  creer: procedureProtegee
    .input(
      z.object({
        idSite: z.string(),
        nom: z.string().min(1).max(100),
        url: schemaUrl,
        evenements: z
          .array(z.enum(EVENEMENTS_DISPONIBLES))
          .min(1, "Sélectionnez au moins un événement"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");
      const webhook = await ctx.db.webhook.create({
        data: {
          idSite: input.idSite,
          nom: input.nom,
          url: input.url,
          evenements: input.evenements,
          secret: genererSecretWebhook(),
        },
      });
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "webhook.cree",
          typeRessource: "webhook",
          idRessource: webhook.id,
          metadonnees: { nom: webhook.nom, url: webhook.url },
        },
      });
      return webhook;
    }),

  /** Modifie un webhook existant. */
  modifier: procedureProtegee
    .input(
      z.object({
        id: z.string(),
        idSite: z.string(),
        nom: z.string().min(1).max(100).optional(),
        url: schemaUrl.optional(),
        evenements: z.array(z.enum(EVENEMENTS_DISPONIBLES)).min(1).optional(),
        actif: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");
      const { id, idSite, ...donnees } = input;
      const webhook = await ctx.db.webhook.findFirst({ where: { id, idSite } });
      if (!webhook) throw new TRPCError({ code: "NOT_FOUND", message: "Webhook introuvable." });
      return ctx.db.webhook.update({ where: { id }, data: donnees });
    }),

  /** Régénère le secret HMAC. */
  regenererSecret: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");
      const webhook = await ctx.db.webhook.findFirst({
        where: { id: input.id, idSite: input.idSite },
      });
      if (!webhook) throw new TRPCError({ code: "NOT_FOUND", message: "Webhook introuvable." });
      return ctx.db.webhook.update({
        where: { id: input.id },
        data: { secret: genererSecretWebhook() },
      });
    }),

  /** Supprime un webhook (et toutes ses livraisons via cascade). */
  supprimer: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");
      const webhook = await ctx.db.webhook.findFirst({
        where: { id: input.id, idSite: input.idSite },
      });
      if (!webhook) throw new TRPCError({ code: "NOT_FOUND", message: "Webhook introuvable." });
      await ctx.db.webhook.delete({ where: { id: input.id } });
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "webhook.supprime",
          typeRessource: "webhook",
          idRessource: input.id,
        },
      });
      return { succes: true };
    }),

  /** Envoie un événement de test. */
  tester: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");
      const webhook = await ctx.db.webhook.findFirst({
        where: { id: input.id, idSite: input.idSite },
      });
      if (!webhook) throw new TRPCError({ code: "NOT_FOUND", message: "Webhook introuvable." });

      const livraison = await ctx.db.livraisonWebhook.create({
        data: {
          idWebhook: webhook.id,
          evenement: "test.ping",
          charge: { message: "Ceci est un événement de test depuis Nexora." },
          statut: "EN_ATTENTE",
        },
      });
      await tenterLivraison(ctx.db, livraison.id);
      return ctx.db.livraisonWebhook.findUnique({ where: { id: livraison.id } });
    }),

  /** Liste les dernières livraisons d'un webhook. */
  listerLivraisons: procedureProtegee
    .input(
      z.object({
        idWebhook: z.string(),
        idSite: z.string(),
        limite: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");
      const webhook = await ctx.db.webhook.findFirst({
        where: { id: input.idWebhook, idSite: input.idSite },
      });
      if (!webhook) throw new TRPCError({ code: "NOT_FOUND", message: "Webhook introuvable." });
      return ctx.db.livraisonWebhook.findMany({
        where: { idWebhook: input.idWebhook },
        orderBy: { creeLe: "desc" },
        take: input.limite,
      });
    }),

  /** Force une nouvelle tentative de livraison. */
  relancerLivraison: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");
      const livraison = await ctx.db.livraisonWebhook.findUnique({
        where: { id: input.id },
        include: { webhook: true },
      });
      if (!livraison || livraison.webhook.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Livraison introuvable." });
      }
      await tenterLivraison(ctx.db, input.id);
      return ctx.db.livraisonWebhook.findUnique({ where: { id: input.id } });
    }),
});

// Re-export pour usage externe (par ex. si on doit déclencher des événements depuis d'autres routeurs)
export { declencherEvenementWebhook };
