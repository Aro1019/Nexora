/**
 * Client d'authentification côté navigateur.
 * Utilisé dans les composants React pour gérer la connexion,
 * l'inscription, la déconnexion et l'accès à la session.
 */
import { createAuthClient } from "better-auth/react";

export const clientAuth = createAuthClient({
  /** URL de base de l'API d'authentification */
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
