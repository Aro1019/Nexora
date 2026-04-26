/**
 * Routeur tRPC pour les membres d'un site.
 * Gestion des invitations, changement de rôle et retrait.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
import { creerRouteur, procedureProtegee } from "../trpc";

/** Rôles autorisés pour l'invitation */
const ROLES_INVITABLES = ["ADMINISTRATEUR", "EDITEUR", "LECTEUR"] as const;

/** Hiérarchie des rôles (plus le nombre est bas, plus le rôle est élevé) */
const HIERARCHIE_ROLES: Record<string, number> = {
  PROPRIETAIRE: 0,
  ADMINISTRATEUR: 1,
  EDITEUR: 2,
  LECTEUR: 3,
};

/**
 * Vérifie que l'utilisateur a un rôle suffisant sur le site.
 * Retourne le membre ou lève une erreur.
 */
async function verifierRole(
  db: PrismaClient,
  idUtilisateur: string,
  idSite: string,
  roleMinimum: string
) {
  const membre = await db.membreSite.findUnique({
    where: {
      idUtilisateur_idSite: { idUtilisateur, idSite },
    },
  });

  if (!membre) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Vous n'êtes pas membre de ce site.",
    });
  }

  const niveauMembre = HIERARCHIE_ROLES[membre.role] ?? 99;
  const niveauRequis = HIERARCHIE_ROLES[roleMinimum] ?? 0;

  if (niveauMembre > niveauRequis) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Vous n'avez pas les droits suffisants pour cette action.",
    });
  }

  return membre;
}

export const routeurMembres = creerRouteur({
  /**
   * Lister les membres d'un site.
   * Tous les membres du site peuvent voir la liste.
   */
  lister: procedureProtegee
    .input(z.object({ idSite: z.string() }))
    .query(async ({ ctx, input }) => {
      /* Vérifier que l'utilisateur est au moins LECTEUR */
      await verifierRole(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      const membres = await ctx.db.membreSite.findMany({
        where: { idSite: input.idSite },
        include: {
          utilisateur: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: [
          { role: "asc" },
          { rejointLe: "asc" },
        ],
      });

      return membres.map((m) => ({
        id: m.id,
        idUtilisateur: m.idUtilisateur,
        nom: m.utilisateur.name,
        email: m.utilisateur.email,
        image: m.utilisateur.image,
        role: m.role,
        rejointLe: m.rejointLe,
      }));
    }),

  /**
   * Inviter un membre par email.
   * Seuls PROPRIETAIRE et ADMINISTRATEUR peuvent inviter.
   * On ne peut pas attribuer un rôle supérieur au sien.
   */
  inviter: procedureProtegee
    .input(
      z.object({
        idSite: z.string(),
        email: z.string().email("Adresse email invalide"),
        role: z.enum(ROLES_INVITABLES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membreCourant = await verifierRole(
        ctx.db,
        ctx.utilisateur.id,
        input.idSite,
        "ADMINISTRATEUR"
      );

      /* On ne peut pas attribuer un rôle supérieur ou égal au sien (sauf PROPRIETAIRE) */
      if (
        membreCourant.role !== "PROPRIETAIRE" &&
        HIERARCHIE_ROLES[input.role] <= HIERARCHIE_ROLES[membreCourant.role]
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous ne pouvez pas attribuer un rôle supérieur ou égal au vôtre.",
        });
      }

      /* Trouver l'utilisateur par email */
      const utilisateur = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!utilisateur) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aucun utilisateur trouvé avec cette adresse email. Il doit d'abord créer un compte sur Nexora.",
        });
      }

      /* Vérifier qu'il n'est pas déjà membre */
      const dejaMembreSite = await ctx.db.membreSite.findUnique({
        where: {
          idUtilisateur_idSite: {
            idUtilisateur: utilisateur.id,
            idSite: input.idSite,
          },
        },
      });

      if (dejaMembreSite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cet utilisateur est déjà membre de ce site.",
        });
      }

      /* Créer le membre */
      const nouveauMembre = await ctx.db.membreSite.create({
        data: {
          idUtilisateur: utilisateur.id,
          idSite: input.idSite,
          role: input.role,
        },
        include: {
          utilisateur: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "membre.invite",
          typeRessource: "membre",
          idRessource: nouveauMembre.id,
          metadonnees: {
            emailInvite: input.email,
            role: input.role,
          },
        },
      });

      return {
        id: nouveauMembre.id,
        nom: nouveauMembre.utilisateur.name,
        email: nouveauMembre.utilisateur.email,
        role: nouveauMembre.role,
      };
    }),

  /**
   * Modifier le rôle d'un membre.
   * Seuls PROPRIETAIRE et ADMINISTRATEUR peuvent changer les rôles.
   */
  changerRole: procedureProtegee
    .input(
      z.object({
        idSite: z.string(),
        idMembre: z.string(),
        nouveauRole: z.enum(ROLES_INVITABLES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membreCourant = await verifierRole(
        ctx.db,
        ctx.utilisateur.id,
        input.idSite,
        "ADMINISTRATEUR"
      );

      /* Trouver le membre cible */
      const membreCible = await ctx.db.membreSite.findUnique({
        where: { id: input.idMembre },
        include: { utilisateur: { select: { name: true, email: true } } },
      });

      if (!membreCible || membreCible.idSite !== input.idSite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Membre introuvable.",
        });
      }

      /* Impossible de modifier le rôle du propriétaire */
      if (membreCible.role === "PROPRIETAIRE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Le rôle du propriétaire ne peut pas être modifié.",
        });
      }

      /* Un ADMINISTRATEUR ne peut pas modifier un autre ADMINISTRATEUR */
      if (
        membreCourant.role !== "PROPRIETAIRE" &&
        HIERARCHIE_ROLES[membreCible.role] <= HIERARCHIE_ROLES[membreCourant.role]
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous ne pouvez pas modifier le rôle d'un membre de rang égal ou supérieur.",
        });
      }

      const membreMisAJour = await ctx.db.membreSite.update({
        where: { id: input.idMembre },
        data: { role: input.nouveauRole },
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "membre.role_modifie",
          typeRessource: "membre",
          idRessource: input.idMembre,
          metadonnees: {
            ancienRole: membreCible.role,
            nouveauRole: input.nouveauRole,
            emailMembre: membreCible.utilisateur.email,
          },
        },
      });

      return membreMisAJour;
    }),

  /**
   * Retirer un membre du site.
   * Le propriétaire peut retirer n'importe qui.
   * Un administrateur peut retirer éditeurs et lecteurs.
   * Un membre peut se retirer lui-même (sauf le propriétaire).
   */
  retirer: procedureProtegee
    .input(
      z.object({
        idSite: z.string(),
        idMembre: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      /* Trouver le membre cible */
      const membreCible = await ctx.db.membreSite.findUnique({
        where: { id: input.idMembre },
        include: { utilisateur: { select: { name: true, email: true } } },
      });

      if (!membreCible || membreCible.idSite !== input.idSite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Membre introuvable.",
        });
      }

      /* Le propriétaire ne peut pas être retiré */
      if (membreCible.role === "PROPRIETAIRE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Le propriétaire ne peut pas être retiré du site.",
        });
      }

      /* Si c'est un auto-retrait */
      const estAutoRetrait = membreCible.idUtilisateur === ctx.utilisateur.id;

      if (!estAutoRetrait) {
        /* Vérifier que l'utilisateur courant peut retirer ce membre */
        const membreCourant = await verifierRole(
          ctx.db,
          ctx.utilisateur.id,
          input.idSite,
          "ADMINISTRATEUR"
        );

        if (
          membreCourant.role !== "PROPRIETAIRE" &&
          HIERARCHIE_ROLES[membreCible.role] <= HIERARCHIE_ROLES[membreCourant.role]
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Vous ne pouvez pas retirer un membre de rang égal ou supérieur.",
          });
        }
      }

      await ctx.db.membreSite.delete({ where: { id: input.idMembre } });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "membre.retire",
          typeRessource: "membre",
          idRessource: input.idMembre,
          metadonnees: {
            emailMembre: membreCible.utilisateur.email,
            autoRetrait: estAutoRetrait,
          },
        },
      });

      return { succes: true };
    }),
});
