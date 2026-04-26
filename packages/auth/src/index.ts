/**
 * Package @nexora/auth
 * Configuration centralisée de l'authentification Better Auth.
 * Exporte la config serveur et le client navigateur.
 */
export { auth, gestionnairesAuth } from "./serveur";
export { clientAuth } from "./client";
export type { Session, User } from "better-auth";
