/**
 * Contexte tRPC — créé pour chaque requête.
 * Récupère la session Better Auth à partir des headers de la requête.
 */
import { auth } from "@nexora/auth";
import { db } from "@nexora/db";

/** Type du contexte tRPC */
export interface ContexteTRPC {
  db: typeof db;
  session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
  utilisateur: { id: string; name: string; email: string; image?: string | null } | null;
}

/**
 * Crée le contexte tRPC pour chaque requête.
 * Extrait la session depuis les headers HTTP.
 */
export async function creerContexte(opts: {
  headers: Headers;
}): Promise<ContexteTRPC> {
  const session = await auth.api.getSession({
    headers: opts.headers,
  });

  return {
    db,
    session,
    utilisateur: session?.user
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }
      : null,
  };
}
