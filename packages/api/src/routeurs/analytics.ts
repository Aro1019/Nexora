/**
 * Routeur tRPC analytics — lecture seule des statistiques de fréquentation.
 * Toutes les agrégations sont faites côté Postgres pour rester rapides.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
import { creerRouteur, procedureProtegee } from "../trpc";

/** Vérifie l'accès au site (LECTEUR minimum). */
async function verifierAccesSite(
  db: PrismaClient,
  idUtilisateur: string,
  idSite: string
) {
  const membre = await db.membreSite.findUnique({
    where: { idUtilisateur_idSite: { idUtilisateur, idSite } },
  });
  if (!membre) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Vous n'êtes pas membre de ce site.",
    });
  }
  return membre;
}

const schemaPeriode = z.object({
  idSite: z.string(),
  /** Nombre de jours en arrière (1 à 365). */
  jours: z.number().int().min(1).max(365).default(30),
});

export const routeurAnalytics = creerRouteur({
  /**
   * Vue d'ensemble : vues totales, visiteurs uniques, vues par jour.
   */
  vueEnsemble: procedureProtegee
    .input(schemaPeriode)
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite);

      const debut = new Date(Date.now() - input.jours * 86400 * 1000);

      /* Compteurs globaux */
      const [vues, visiteurs] = await Promise.all([
        ctx.db.evenementVue.count({
          where: { idSite: input.idSite, dateHeure: { gte: debut } },
        }),
        ctx.db.evenementVue
          .findMany({
            where: { idSite: input.idSite, dateHeure: { gte: debut } },
            select: { idVisiteurAnonyme: true },
            distinct: ["idVisiteurAnonyme"],
          })
          .then((r) => r.length),
      ]);

      /* Série quotidienne (PostgreSQL date_trunc) */
      const serie = await ctx.db.$queryRaw<
        Array<{ jour: Date; vues: bigint; visiteurs: bigint }>
      >`
        SELECT
          date_trunc('day', "dateHeure") AS jour,
          COUNT(*)::bigint AS vues,
          COUNT(DISTINCT "idVisiteurAnonyme")::bigint AS visiteurs
        FROM evenement_vue
        WHERE "idSite" = ${input.idSite}
          AND "dateHeure" >= ${debut}
        GROUP BY 1
        ORDER BY 1 ASC
      `;

      return {
        vues,
        visiteurs,
        serie: serie.map((s) => ({
          jour: s.jour.toISOString().slice(0, 10),
          vues: Number(s.vues),
          visiteurs: Number(s.visiteurs),
        })),
      };
    }),

  /** Top des chemins consultés. */
  topChemins: procedureProtegee
    .input(schemaPeriode.extend({ limite: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite);
      const debut = new Date(Date.now() - input.jours * 86400 * 1000);

      const groupes = await ctx.db.evenementVue.groupBy({
        by: ["chemin"],
        where: { idSite: input.idSite, dateHeure: { gte: debut } },
        _count: { _all: true },
        orderBy: { _count: { chemin: "desc" } },
        take: input.limite,
      });

      return groupes.map((g) => ({
        chemin: g.chemin,
        vues: g._count._all,
      }));
    }),

  /** Top des sites référents. */
  topReferents: procedureProtegee
    .input(schemaPeriode.extend({ limite: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite);
      const debut = new Date(Date.now() - input.jours * 86400 * 1000);

      const groupes = await ctx.db.evenementVue.groupBy({
        by: ["referent"],
        where: {
          idSite: input.idSite,
          dateHeure: { gte: debut },
          referent: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { referent: "desc" } },
        take: input.limite,
      });

      return groupes.map((g) => ({
        referent: g.referent ?? "Direct",
        vues: g._count._all,
      }));
    }),

  /** Répartition par type d'appareil. */
  parAppareil: procedureProtegee
    .input(schemaPeriode)
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite);
      const debut = new Date(Date.now() - input.jours * 86400 * 1000);

      const groupes = await ctx.db.evenementVue.groupBy({
        by: ["typeAppareil"],
        where: { idSite: input.idSite, dateHeure: { gte: debut } },
        _count: { _all: true },
      });

      return groupes.map((g) => ({
        typeAppareil: g.typeAppareil ?? "inconnu",
        vues: g._count._all,
      }));
    }),

  /** Répartition par pays (peut être vide en local). */
  parPays: procedureProtegee
    .input(schemaPeriode.extend({ limite: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite);
      const debut = new Date(Date.now() - input.jours * 86400 * 1000);

      const groupes = await ctx.db.evenementVue.groupBy({
        by: ["pays"],
        where: {
          idSite: input.idSite,
          dateHeure: { gte: debut },
          pays: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { pays: "desc" } },
        take: input.limite,
      });

      return groupes.map((g) => ({
        pays: g.pays ?? "??",
        vues: g._count._all,
      }));
    }),
});
