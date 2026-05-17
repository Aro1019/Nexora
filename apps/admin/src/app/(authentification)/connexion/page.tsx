"use client";

/**
 * Page de connexion — design moderne, sobre, sans animations décoratives.
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { clientAuth } from "@nexora/auth/client";

function FormulaireConnexion() {
  const routeur = useRouter();
  const parametres = useSearchParams();
  const redirection = parametres.get("suivant") || "/tableau-de-bord";

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [chargementOAuth, setChargementOAuth] = useState<string | null>(null);
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);

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
      routeur.push(`/bienvenue?suivant=${encodeURIComponent(redirection)}`);
      routeur.refresh();
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setChargement(false);
    }
  }

  async function gererConnexionOAuth(fournisseur: "google" | "github") {
    setChargementOAuth(fournisseur);
    await clientAuth.signIn.social({
      provider: fournisseur,
      callbackURL: `/bienvenue?suivant=${encodeURIComponent(redirection)}`,
    });
  }

  const desactive = chargement || !!chargementOAuth;

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        {/* Logo mobile */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-nexora-blue text-white font-bold">
            N
          </div>
          <span className="text-lg font-semibold text-white">Nexora</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Connexion
        </h1>
        <p className="mt-1.5 text-sm text-frost/70">
          Bon retour. Connectez-vous pour continuer.
        </p>
      </div>

      {/* Formulaire principal */}
      <form onSubmit={gererConnexion} className="flex flex-col gap-4">
        {erreur && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-frost">
            Adresse email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              autoComplete="email"
              disabled={desactive}
              className="w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-nexora-blue focus:outline-none focus:ring-2 focus:ring-nexora-blue/15 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="mot-de-passe" className="text-sm font-medium text-frost">
              Mot de passe
            </label>
            <Link
              href="/mot-de-passe-oublie"
              className="text-xs font-medium text-nexora-blue hover:underline"
            >
              Oublié ?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="mot-de-passe"
              type={afficherMotDePasse ? "text" : "password"}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="current-password"
              disabled={desactive}
              className="w-full rounded-lg border border-border bg-white pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-nexora-blue focus:outline-none focus:ring-2 focus:ring-nexora-blue/15 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setAfficherMotDePasse((v) => !v)}
              tabIndex={-1}
              aria-label={afficherMotDePasse ? "Cacher" : "Afficher"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {afficherMotDePasse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Bouton principal */}
        <button
          type="submit"
          disabled={desactive}
          className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-nexora-blue px-4 text-sm font-semibold text-white shadow-sm hover:bg-nexora-blue/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {chargement && <Loader2 className="h-4 w-4 animate-spin" />}
          {chargement ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      {/* Séparateur */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Boutons OAuth */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => gererConnexionOAuth("google")}
          disabled={desactive}
          className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-frost hover:bg-white/10 hover:text-white disabled:opacity-60"
        >
          {chargementOAuth === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Google
        </button>

        <button
          type="button"
          onClick={() => gererConnexionOAuth("github")}
          disabled={desactive}
          className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-frost hover:bg-white/10 hover:text-white disabled:opacity-60"
        >
          {chargementOAuth === "github" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          )}
          GitHub
        </button>
      </div>

      {/* Lien inscription */}
      <p className="mt-8 text-center text-sm text-frost/60">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-sky hover:text-frost">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

export default function PageConnexion() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <FormulaireConnexion />
    </Suspense>
  );
}
