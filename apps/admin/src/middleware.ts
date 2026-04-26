/**
 * Middleware Next.js — Protection des routes du tableau de bord.
 *
 * Vérifie la présence d'un cookie de session valide.
 * Redirige vers /connexion si l'utilisateur n'est pas authentifié.
 * Redirige vers /tableau-de-bord si l'utilisateur est déjà connecté
 * et essaie d'accéder aux pages d'authentification.
 */
import { NextRequest, NextResponse } from "next/server";

/** Routes nécessitant une authentification */
const ROUTES_PROTEGEES = ["/tableau-de-bord"];

/** Routes réservées aux visiteurs non connectés */
const ROUTES_PUBLIQUES_AUTH = ["/connexion", "/inscription", "/mot-de-passe-oublie"];

export async function middleware(requete: NextRequest) {
  const chemin = requete.nextUrl.pathname;

  /**
   * Vérifie si le cookie de session Better Auth existe.
   * Le nom du cookie par défaut est "better-auth.session_token".
   */
  const cookieSession =
    requete.cookies.get("better-auth.session_token")?.value ??
    requete.cookies.get("__Secure-better-auth.session_token")?.value;

  const estConnecte = !!cookieSession;

  // Rediriger les utilisateurs non connectés vers la page de connexion
  const estRouteProtegee = ROUTES_PROTEGEES.some((route) =>
    chemin.startsWith(route)
  );

  if (estRouteProtegee && !estConnecte) {
    const urlConnexion = new URL("/connexion", requete.url);
    urlConnexion.searchParams.set("suivant", chemin);
    return NextResponse.redirect(urlConnexion);
  }

  // Rediriger les utilisateurs connectés loin des pages d'auth
  const estRouteAuth = ROUTES_PUBLIQUES_AUTH.some((route) =>
    chemin.startsWith(route)
  );

  if (estRouteAuth && estConnecte) {
    return NextResponse.redirect(new URL("/tableau-de-bord", requete.url));
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Appliquer le middleware uniquement sur les routes pertinentes.
   * Exclut : les fichiers statiques, les assets, l'API.
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
