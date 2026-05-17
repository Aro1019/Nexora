/**
 * Package @nexora/auth — entrée SERVEUR uniquement.
 * Pour le client navigateur, importer depuis "@nexora/auth/client"
 * afin que la configuration serveur (qui lit BETTER_AUTH_SECRET et
 * instancie Prisma) ne soit jamais embarquée dans le bundle navigateur.
 */
export { auth, gestionnairesAuth } from "./serveur";
export type { Session, User } from "better-auth";
