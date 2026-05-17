/**
 * Routeur tRPC pour les menus de navigation d'un site.
 * CRUD : lister, obtenir, créer/modifier (upsert), supprimer.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@nexora/db";
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
// Schémas
// ─────────────────────────────────────────

/** Schéma récursif pour un élément de navigation */
const schemaElement: z.ZodType<{
  id: string;
  libelle: string;
  type: "page" | "url" | "categorie";
  idPage?: string;
  url?: string;
  idCategorie?: string;
  ouvrirNouvelOnglet?: boolean;
  enfants?: unknown[];
}> = z.object({
  id: z.string(),
  libelle: z.string().min(1).max(100),
  type: z.enum(["page", "url", "categorie"]),
  idPage: z.string().optional(),
  url: z.string().max(2000).optional(),
  idCategorie: z.string().optional(),
  ouvrirNouvelOnglet: z.boolean().default(false),
  enfants: z.lazy(() => schemaElement.array()).optional(),
});

const schemaApparenceEntete = z.object({
  emplacement: z.literal("ENTETE"),
  positionLiens: z.enum(["gauche", "centre", "droite"]),
  sticky: z.boolean(),
  transparent: z.boolean(),
  couleurFond: z.string().max(64).optional(),
  couleurTexte: z.string().max(64).optional(),
  hauteur: z.enum(["compact", "normal", "grand"]),
  afficherLogo: z.boolean(),
  afficherRecherche: z.boolean(),
  cta: z.object({
    active: z.boolean(),
    texte: z.string().max(60),
    url: z.string().max(2000),
    couleurFond: z.string().max(64).optional(),
    couleurTexte: z.string().max(64).optional(),
  }),
  // V1
  largeurConteneur: z.enum(["pleine", "large", "normale", "etroite"]).optional(),
  espacementLiens: z.enum(["compact", "normal", "aere"]).optional(),
  styleLiens: z.enum(["minimal", "souligne", "pilule", "fantome"]).optional(),
  indicateurActif: z.enum(["aucun", "souligne", "point", "barre-haut", "fond"]).optional(),
  couleurLienHover: z.string().max(64).optional(),
  couleurLienActif: z.string().max(64).optional(),
  ombre: z.enum(["aucune", "fine", "moyenne", "forte"]).optional(),
  bordureBas: z.enum(["aucune", "fine", "epaisse"]).optional(),
  couleurBordureBas: z.string().max(64).optional(),
  // V2
  comportementScroll: z.enum(["fixe", "reduit", "auto-cache"]).optional(),
  seuilScroll: z.number().int().min(0).max(2000).optional(),
  couleurFondScroll: z.string().max(64).optional(),
  couleurTexteScroll: z.string().max(64).optional(),
  bandeau: z
    .object({
      active: z.boolean(),
      texte: z.string().max(280),
      lien: z.string().max(2000).optional(),
      couleurFond: z.string().max(64).optional(),
      couleurTexte: z.string().max(64).optional(),
      fermable: z.boolean().optional(),
    })
    .optional(),
  // V3
  positionLogo: z.enum(["gauche", "centre", "droite"]).optional(),
  tailleLogo: z.enum(["S", "M", "L", "XL"]).optional(),
  afficherNomSite: z.boolean().optional(),
  policeNomSite: z.enum(["heritee", "sans", "serif", "mono"]).optional(),
  urlLogoAlt: z.string().max(2000).optional(),
  liensMajuscules: z.boolean().optional(),
  graisseLiens: z.enum(["normale", "medium", "semi", "bold"]).optional(),
  policeLiens: z.enum(["heritee", "sans", "serif", "mono"]).optional(),
});

const schemaApparencePied = z.object({
  emplacement: z.literal("PIED_DE_PAGE"),
  nbColonnes: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  couleurFond: z.string().max(64).optional(),
  couleurTexte: z.string().max(64).optional(),
  afficherLogo: z.boolean(),
  description: z.string().max(500).optional(),
  afficherReseauxSociaux: z.boolean(),
  texteCopyright: z.string().max(200).optional(),
  newsletter: z.object({
    active: z.boolean(),
    titre: z.string().max(80).optional(),
    placeholder: z.string().max(80).optional(),
  }),
  selecteurLangue: z.boolean(),
  liensSecondaires: z
    .array(
      z.object({
        id: z.string(),
        libelle: z.string().min(1).max(80),
        url: z.string().min(1).max(2000),
      })
    )
    .max(20),
});

const schemaApparenceBarre = z.object({
  emplacement: z.literal("BARRE_LATERALE"),
  cote: z.enum(["gauche", "droite"]),
  couleurFond: z.string().max(64).optional(),
  couleurTexte: z.string().max(64).optional(),
  largeur: z.enum(["etroite", "normale", "large"]),
});

const schemaApparence = z.discriminatedUnion("emplacement", [
  schemaApparenceEntete,
  schemaApparencePied,
  schemaApparenceBarre,
]);

const schemaUpsertNavigation = z.object({
  idSite: z.string(),
  emplacement: z.enum(["ENTETE", "PIED_DE_PAGE", "BARRE_LATERALE"]),
  libelle: z.string().min(1).max(100),
  elements: schemaElement.array(),
  apparence: schemaApparence.optional(),
});

// ─────────────────────────────────────────
// Routeur
// ─────────────────────────────────────────

export const routeurNavigations = creerRouteur({
  /**
   * Lister les navigations d'un site.
   * LECTEUR+ peut voir.
   */
  lister: procedureProtegee
    .input(z.object({ idSite: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      return ctx.db.navigation.findMany({
        where: { idSite: input.idSite },
        orderBy: { emplacement: "asc" },
      });
    }),

  /**
   * Obtenir une navigation par emplacement.
   */
  obtenir: procedureProtegee
    .input(z.object({
      idSite: z.string(),
      emplacement: z.enum(["ENTETE", "PIED_DE_PAGE", "BARRE_LATERALE"]),
    }))
    .query(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "LECTEUR");

      return ctx.db.navigation.findUnique({
        where: {
          idSite_emplacement: {
            idSite: input.idSite,
            emplacement: input.emplacement,
          },
        },
      });
    }),

  /**
   * Créer ou mettre à jour une navigation (upsert par emplacement).
   * EDITEUR+ peut modifier.
   */
  enregistrer: procedureProtegee
    .input(schemaUpsertNavigation)
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "EDITEUR");

      const navigation = await ctx.db.navigation.upsert({
        where: {
          idSite_emplacement: {
            idSite: input.idSite,
            emplacement: input.emplacement,
          },
        },
        create: {
          idSite: input.idSite,
          libelle: input.libelle,
          emplacement: input.emplacement,
          elements: JSON.parse(JSON.stringify(input.elements)),
          apparence: input.apparence
            ? JSON.parse(JSON.stringify(input.apparence))
            : undefined,
        },
        update: {
          libelle: input.libelle,
          elements: JSON.parse(JSON.stringify(input.elements)),
          ...(input.apparence !== undefined
            ? { apparence: JSON.parse(JSON.stringify(input.apparence)) }
            : {}),
        },
      });

      /* Journal d'audit */
      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "navigation.enregistree",
          typeRessource: "navigation",
          idRessource: navigation.id,
          metadonnees: { emplacement: input.emplacement, nbElements: input.elements.length },
        },
      });

      return navigation;
    }),

  /**
   * Supprimer une navigation.
   * ADMINISTRATEUR+ peut supprimer.
   */
  supprimer: procedureProtegee
    .input(z.object({ id: z.string(), idSite: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifierAccesSite(ctx.db, ctx.utilisateur.id, input.idSite, "ADMINISTRATEUR");

      const nav = await ctx.db.navigation.findUnique({ where: { id: input.id } });
      if (!nav || nav.idSite !== input.idSite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Navigation introuvable." });
      }

      await ctx.db.navigation.delete({ where: { id: input.id } });

      await ctx.db.journalAudit.create({
        data: {
          idSite: input.idSite,
          idUtilisateur: ctx.utilisateur.id,
          action: "navigation.supprimee",
          typeRessource: "navigation",
          idRessource: input.id,
          metadonnees: { emplacement: nav.emplacement },
        },
      });

      return { succes: true };
    }),
});
