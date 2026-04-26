"use client";

/**
 * Page de connexion — permet à l'utilisateur de se connecter
 * avec son email et mot de passe, ou via Google/GitHub.
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { clientAuth } from "@nexora/auth";

/** Composant principal de connexion (utilise useSearchParams) */
function FormulaireConnexion() {
  const routeur = useRouter();
  const parametres = useSearchParams();
  const redirection = parametres.get("suivant") || "/tableau-de-bord";

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  /** Connexion par email et mot de passe */
  async function gererConnexion(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      const resultat = await clientAuth.signIn.email({
        email,
        password: motDePasse,
      });

      if (resultat.error) {
        setErreur("Email ou mot de passe incorrect");
        return;
      }

      routeur.push(redirection);
      routeur.refresh();
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setChargement(false);
    }
  }

  /** Connexion via un fournisseur OAuth */
  async function gererConnexionOAuth(fournisseur: "google" | "github") {
    await clientAuth.signIn.social({
      provider: fournisseur,
      callbackURL: redirection,
    });
  }

  return (
    <div>
      {/* En-tête mobile */}
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-2xl font-bold text-midnight lg:hidden mb-6">
          Nexora
        </h1>
        <h2 className="text-2xl font-semibold text-midnight">Connexion</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connectez-vous pour accéder à votre tableau de bord
        </p>
      </div>

      {/* Boutons OAuth */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => gererConnexionOAuth("google")}
          className="flex items-center justify-center gap-3 w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-frost/20 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continuer avec Google
        </button>

        <button
          type="button"
          onClick={() => gererConnexionOAuth("github")}
          className="flex items-center justify-center gap-3 w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-frost/20 transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          Continuer avec GitHub
        </button>
      </div>

      {/* Séparateur */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white-ice px-2 text-muted-foreground">
            ou par email
          </span>
        </div>
      </div>

      {/* Formulaire email/mot de passe */}
      <form onSubmit={gererConnexion} className="flex flex-col gap-4">
        {erreur && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {erreur}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            autoComplete="email"
            className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="mot-de-passe"
              className="block text-sm font-medium text-foreground"
            >
              Mot de passe
            </label>
            <Link
              href="/mot-de-passe-oublie"
              className="text-xs text-accent hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <input
            id="mot-de-passe"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete="current-password"
            className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={chargement}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
        >
          {chargement ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>

      {/* Lien inscription */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-accent font-medium hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

/** Page exportée avec Suspense pour useSearchParams */
export default function PageConnexion() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96" />}>
      <FormulaireConnexion />
    </Suspense>
  );
}
