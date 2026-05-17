export { PrismaClient } from "@prisma/client";
export * from "@prisma/client";

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

/**
 * Charger le .env depuis la racine du monorepo ou depuis apps/admin.
 * Next.js ne propage pas process.env aux packages Node.js externes.
 */
function chargerEnv() {
  if (!process.env.DATABASE_URL) {
    const cheminEnv = resolve(process.cwd(), ".env");
    const resultat = config({ path: cheminEnv });
    if (process.env.NEXORA_DB_DEBUG === "1") {
      console.log("[nexora/db] dotenv:", resultat.error ? resultat.error.message : "OK");
    }
  }
}

/**
 * Variable globale pour éviter de recréer le client Prisma
 * à chaque rechargement en mode développement (hot reload).
 */
const globalPourPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Crée ou réutilise l'instance partagée du client Prisma.
 * L'initialisation est lazy pour garantir que process.env.DATABASE_URL
 * est disponible au moment de la première requête.
 */
function creerClient(): PrismaClient {
  if (globalPourPrisma.prisma) return globalPourPrisma.prisma;

  chargerEnv();

  const client = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NEXORA_DB_DEBUG === "1"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalPourPrisma.prisma = client;
  }

  return client;
}

/**
 * Instance partagée du client Prisma (lazy — créée au premier accès).
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = creerClient();
    return (client as any)[prop];
  },
});
