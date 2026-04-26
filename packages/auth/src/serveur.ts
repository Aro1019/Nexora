/**
 * Configuration serveur de Better Auth.
 * Gère l'authentification par identifiants (email + mot de passe)
 * et les connexions OAuth (Google, GitHub).
 *
 * IMPORTANT : les noms de modèles Prisma sont en anglais (User, Session, Account)
 * car Better Auth les impose, mais les tables sous-jacentes sont en français
 * grâce au @@map() dans le schéma Prisma.
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { toNextJsHandler } from "better-auth/next-js";
import { db } from "@nexora/db";

export const auth = betterAuth({
  /** URL de base de l'application (utilisée pour les callbacks OAuth) */
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  /** Clé secrète pour signer les cookies et tokens */
  secret: process.env.BETTER_AUTH_SECRET,

  /** Adaptateur Prisma — utilise notre instance partagée du client */
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  /** Fournisseurs d'authentification activés */
  emailAndPassword: {
    enabled: true,
    /** Longueur minimale du mot de passe */
    minPasswordLength: 8,
  },

  /** Connexion OAuth — Google */
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },

  /** Configuration des sessions */
  session: {
    /** Durée de vie d'une session : 7 jours */
    expiresIn: 60 * 60 * 24 * 7,
    /** Renouveler si la session expire dans moins de 1 jour */
    updateAge: 60 * 60 * 24,
    /** Stocker le cookie de session de manière sécurisée */
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache de 5 minutes côté cookie
    },
  },

  /** Pages de redirection personnalisées */
  pages: {
    signIn: "/connexion",
    signUp: "/inscription",
    error: "/connexion",
  },
});

/** Handler Next.js pour la route API auth */
export const gestionnairesAuth = toNextJsHandler(auth);

/** Type de la session utilisateur Nexora */
export type SessionAuth = typeof auth.$Infer.Session;
