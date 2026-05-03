/**
 * Routeur de recherche full-text sur les pages publiées d'un site.
 * - Utilise l'index GIN sur la colonne `recherche` (tsvector)
 * - Ranking via ts_rank_cd
 * - Mise en évidence (snippet) via ts_headline
 * - Recherche publique : seules les pages PUBLIE non-cachées sont retournées
 */
import { z } from "zod";
import { creerRouteur, procedurePublique } from "../trpc";
import { Prisma } from "@nexora/db";

interface ResultatRecherche {
  id: string;
  titre: string;
  chemin: string;
  type_page: string;
  langue: string;
  extrait: string | null;
  publie_le: Date | null;
  rang: number;
  fragment: string;
}

export const routeurRecherche = creerRouteur({
  /**
   * Recherche publique sur les pages d'un site.
   * - q : texte saisi par l'utilisateur (3 caractères mini)
   * - idSite : limite de la recherche au site
   * - typePage : filtre optionnel (PAGE, ARTICLE…)
   * - langue : filtre optionnel
   * - limite, decalage : pagination
   */
  lister: procedurePublique
    .input(
      z.object({
        q: z.string().min(2).max(200),
        idSite: z.string(),
        typePage: z.enum(["PAGE", "ARTICLE", "ACCUEIL", "INDEX_BLOG"]).optional(),
        langue: z.string().optional(),
        limite: z.number().min(1).max(50).default(20),
        decalage: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Choix de la config de langue
      const config = choisirConfig(input.langue);

      // Construire la requête tsquery (mots préfixés pour recherche au fil de la frappe)
      const requete = construireRequete(input.q);
      if (!requete) return { resultats: [], total: 0 };

      // Filtres dynamiques
      const filtreType = input.typePage
        ? Prisma.sql`AND "typePage"::text = ${input.typePage}`
        : Prisma.empty;
      const filtreLangue = input.langue
        ? Prisma.sql`AND langue = ${input.langue}`
        : Prisma.empty;

      // Comptage
      const totalRows = await ctx.db.$queryRaw<{ total: bigint }[]>(
        Prisma.sql`
          SELECT COUNT(*)::bigint AS total
          FROM page
          WHERE "idSite" = ${input.idSite}
            AND statut = 'PUBLIE'
            AND "nonIndexe" = false
            AND recherche @@ to_tsquery(${config}::regconfig, ${requete})
            ${filtreType}
            ${filtreLangue}
        `
      );
      const total = Number(totalRows[0]?.total ?? 0n);

      const lignes = await ctx.db.$queryRaw<ResultatRecherche[]>(
        Prisma.sql`
          SELECT
            id,
            titre,
            chemin,
            "typePage"::text AS type_page,
            langue,
            extrait,
            "publieLe" AS publie_le,
            ts_rank_cd(recherche, to_tsquery(${config}::regconfig, ${requete})) AS rang,
            ts_headline(
              ${config}::regconfig,
              COALESCE(extrait, "descriptionMeta", titre),
              to_tsquery(${config}::regconfig, ${requete}),
              'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=10, ShortWord=2'
            ) AS fragment
          FROM page
          WHERE "idSite" = ${input.idSite}
            AND statut = 'PUBLIE'
            AND "nonIndexe" = false
            AND recherche @@ to_tsquery(${config}::regconfig, ${requete})
            ${filtreType}
            ${filtreLangue}
          ORDER BY rang DESC, "publieLe" DESC NULLS LAST
          LIMIT ${input.limite}
          OFFSET ${input.decalage}
        `
      );

      return {
        resultats: lignes.map((l) => ({
          id: l.id,
          titre: l.titre,
          chemin: l.chemin,
          typePage: l.type_page,
          langue: l.langue,
          extrait: l.extrait,
          publieLe: l.publie_le,
          rang: Number(l.rang),
          fragment: l.fragment,
        })),
        total,
      };
    }),
});

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function choisirConfig(langue?: string): string {
  if (!langue) return "french";
  if (langue.startsWith("en")) return "english";
  if (langue.startsWith("es")) return "spanish";
  if (langue.startsWith("de")) return "german";
  if (langue.startsWith("it")) return "italian";
  if (langue.startsWith("pt")) return "portuguese";
  return "french";
}

/**
 * Convertit le texte utilisateur en requête tsquery sécurisée.
 * - retire les caractères non alphanumériques
 * - chaque mot est préfixé (pour recherche au fil de la frappe)
 * - mots joints par AND
 */
function construireRequete(texte: string): string {
  const mots = texte
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((m) => m.trim())
    .filter((m) => m.length >= 2);
  if (mots.length === 0) return "";
  // Échappe simples quotes pour éviter injection (defensif, déjà via params)
  return mots.map((m) => `${m.replace(/'/g, "''")}:*`).join(" & ");
}
