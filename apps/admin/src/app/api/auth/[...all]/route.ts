/**
 * Route API catch-all pour Better Auth.
 * Gère toutes les requêtes sous /api/auth/* :
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-in/email
 * - POST /api/auth/sign-out
 * - GET  /api/auth/session
 * - GET  /api/auth/sign-in/social (OAuth)
 * - etc.
 */
import { gestionnairesAuth } from "@nexora/auth";

export const { GET, POST } = gestionnairesAuth;
