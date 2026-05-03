/**
 * Routeur tRPC pour les versions de page.
 * Permet de lister, prévisualiser, restaurer et comparer les versions.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
import { creerRouteur, procedureProtegee } from "../trpc";
import { signerJetonApercu } from "../lib/jeton-apercu";

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
    throw new TRPCError({ code: "FORBIDDEN", message: "Vous n'êtes pas membre de ce site." });
  }
  if ((HIERARCHIE[membre.role] ?? 99) > (HIERARCHIE[roleMinimum] ?? 0)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Droits insuffisants." });
  }
  return membre;
}

/** Récupère idSite à partir d'une version + contrôle d'accès. */
async function chargerVersionAvecAcces(
  db: PrismaClient,
  idUtilisateur: string,
  idVersion: string,
  roleMinimum: "EDITEUR" | "LECTEUR" = "LECTEUR"
) {
  const version = await db.versionPage.findUnique({
    where: { id: idVersion },
    include: { page: { select: { idSite: true } } },
  });
  if (!version) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Version introuvable." });
  }
  await verifierAccesSite(db, idUtilisateur, version.page.idSite, roleMinimum);
  return version;
}

export const routeurVersions = creerRouteur({
  /** Liste les versions d'une page (les plus récentes en premier). */
  lister: procedureProtegee
    .input(
      z.object({
        idPage: z.string(),
        idSite: z.string(),
        limite: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite);

      const page = await ctx.db.page.findUnique({
        where: { id: input.idPage },
        select: { idSite: true, idVersionPubliee: true },
      });
      if (!page || page.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Page introuvable." });
      }

      const versions = await ctx.db.versionPage.findMany({
        where: { idPage: input.idPage },
        orderBy: { version: "desc" },
        take: input.limite,
        select: {
          id: true,
          version: true,
          titre: true,
          note: true,
          creePar: true,
          creeLe: true,
        },
      });

      /* Charger les noms d'utilisateurs en une requête */
      const idsUtilisateurs = [...new Set(versions.map((v) => v.creePar).filter(Boolean))] as string[];
      const utilisateurs = idsUtilisateurs.length
        ? await ctx.db.user.findMany({
            where: { id: { in: idsUtilisateurs } },
            select: { id: true, name: true, email: true },
          })
        : [];
      const mapUtilisateurs = new Map(utilisateurs.map((u) => [u.id, u]));

      return versions.map((v) => ({
        ...v,
        estPubliee: v.id === page.idVersionPubliee,
        auteur: v.creePar ? mapUtilisateurs.get(v.creePar) ?? null : null,
      }));
    }),

  /** Récupère le contenu complet d'une version. */
  obtenir: procedureProtegee
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const version = await chargerVersionAvecAcces(ctx.db, ctx.utilisateur.id, input.id);
      return version;
    }),

  /**
   * Restaure une version : copie son contenu sur la page (en gardant
   * son statut actuel — la page reste BROUILLON ou PUBLIE selon l'état).
   * Crée une nouvelle entrée d'historique pour la traçabilité.
   * EDITEUR+ requis.
   */
  restaurer: procedureProtegee
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const version = await chargerVersionAvecAcces(
        ctx.db,
        ctx.utilisateur.id,
        input.id,
        "EDITEUR"
      );

      /* Numéro de la prochaine version */
      const derniere = await ctx.db.versionPage.findFirst({
        where: { idPage: version.idPage },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const prochainNumero = (derniere?.version ?? 0) + 1;

      /* Snapshot de la nouvelle "version restaurée" */
      await ctx.db.versionPage.create({
        data: {
          idPage: version.idPage,
          version: prochainNumero,
          contenu: version.contenu as object,
          titre: version.titre,
          titreMeta: version.titreMeta,
          descriptionMeta: version.descriptionMeta,
          creePar: ctx.utilisateur.id,
          note: `Restauration de la version ${version.version}`,
        },
      });

      /* Mise à jour de la page courante */
      const pageMaj = await ctx.db.page.update({
        where: { id: version.idPage },
        data: {
          contenu: version.contenu as object,
          titre: version.titre,
          titreMeta: version.titreMeta,
          descriptionMeta: version.descriptionMeta,
        },
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: pageMaj.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "page.version_restauree",
          typeRessource: "page",
          idRessource: version.idPage,
          metadonnees: {
            versionRestauree: version.version,
            nouvelleVersion: prochainNumero,
          },
        },
      });

      return pageMaj;
    }),

  /**
   * Supprime une version de l'historique.
   * Refuse si c'est la version actuellement publiée.
   * ADMINISTRATEUR+ requis.
   */
  supprimer: procedureProtegee
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const version = await chargerVersionAvecAcces(
        ctx.db,
        ctx.utilisateur.id,
        input.id,
        "EDITEUR"
      );
      const page = await ctx.db.page.findUnique({
        where: { id: version.idPage },
        select: { idVersionPubliee: true, idSite: true },
      });
      if (page?.idVersionPubliee === version.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Impossible de supprimer la version actuellement publiée.",
        });
      }
      await ctx.db.versionPage.delete({ where: { id: version.id } });

      await ctx.db.journalAudit.create({
        data: {
          idSite: page!.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "page.version_supprimee",
          typeRessource: "page",
          idRessource: version.idPage,
          metadonnees: { version: version.version },
        },
      });
      return { succes: true };
    }),

  /**
   * Génère un lien d'aperçu signé pour une version spécifique.
   * EDITEUR+ requis.
   */
  creerLienApercu: procedureProtegee
    .input(
      z.object({
        id: z.string(),
        dureeHeures: z.number().int().min(1).max(24).default(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const version = await chargerVersionAvecAcces(
        ctx.db,
        ctx.utilisateur.id,
        input.id,
        "EDITEUR"
      );
      const jeton = signerJetonApercu(
        { idPage: version.idPage, idSite: version.page.idSite, idVersion: version.id },
        input.dureeHeures * 3600
      );
      return { jeton };
    }),
});
