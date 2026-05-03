"use client";

/**
 * Page d'inscription — interface moderne avec animations,
 * indicateur de force du mot de passe et UX immersive.
 */
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clientAuth } from "@nexora/auth";

/** Icône œil pour montrer/cacher le mot de passe */
function IconeOeil({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Calcule la force du mot de passe (0–4) */
function calculerForce(mdp: string): number {
  if (!mdp) return 0;
  let force = 0;
  if (mdp.length >= 8) force++;
  if (/[A-Z]/.test(mdp)) force++;
  if (/[0-9]/.test(mdp)) force++;
  if (/[^A-Za-z0-9]/.test(mdp)) force++;
  return force;
}

const NIVEAUX_FORCE = [
  { libelle: "", couleur: "" },
  { libelle: "Faible", couleur: "bg-destructive" },
  { libelle: "Moyen", couleur: "bg-amber-400" },
  { libelle: "Bon", couleur: "bg-sky" },
  { libelle: "Excellent", couleur: "bg-teal" },
];

export default function PageInscription() {
  const routeur = useRouter();

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [chargementOAuth, setChargementOAuth] = useState<string | null>(null);
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [afficherConfirmation, setAfficherConfirmation] = useState(false);

  const force = useMemo(() => calculerForce(motDePasse), [motDePasse]);
  const niveauForce = NIVEAUX_FORCE[force];

  /** Inscription par email et mot de passe */
  async function gererInscription(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (motDePasse !== confirmationMotDePasse) {
      setErreur("Les mots de passe ne correspondent pas");
      return;
    }

    setChargement(true);

    try {
      const resultat = await clientAuth.signUp.email({
        name: nom,
        email,
        password: motDePasse,
      });

      if (resultat.error) {
        setErreur(
          resultat.error.message || "Une erreur est survenue lors de l'inscription"
        );
        return;
      }

      routeur.push("/bienvenue?suivant=%2Ftableau-de-bord");
      routeur.refresh();
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setChargement(false);
    }
  }

  /** Inscription via un fournisseur OAuth */
  async function gererInscriptionOAuth(fournisseur: "google" | "github") {
    setChargementOAuth(fournisseur);
    await clientAuth.signIn.social({
      provider: fournisseur,
      callbackURL: "/bienvenue?suivant=%2Ftableau-de-bord",
    });
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-7 text-center">
        {/* Logo mobile */}
        <div className="flex items-center justify-center gap-3 mb-6 lg:hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky to-nexora-blue flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-bold text-midnight">Nexora</span>
        </div>

        <h2 className="text-2xl font-bold text-midnight animate-slide-up">
          Créez votre compte
        </h2>
        <p className="mt-2 text-sm text-muted-foreground animate-slide-up-delayed">
          Commencez à créer des sites extraordinaires
        </p>
      </div>

      {/* Boutons OAuth */}
      <div className="flex gap-3 animate-slide-up-delayed">
        <button
          type="button"
          onClick={() => gererInscriptionOAuth("google")}
          disabled={!!chargementOAuth}
          className="group flex-1 flex items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-white/80 px-4 py-3 text-sm font-medium text-foreground hover:bg-white hover:border-sky/30 hover:shadow-md transition-all duration-300 disabled:opacity-50"
        >
          {chargementOAuth === "google" ? (
            <div className="w-5 h-5 border-2 border-sky/30 border-t-sky rounded-full animate-spin" />
          ) : (
            <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
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
          onClick={() => gererInscriptionOAuth("github")}
          disabled={!!chargementOAuth}
          className="group flex-1 flex items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-white/80 px-4 py-3 text-sm font-medium text-foreground hover:bg-white hover:border-sky/30 hover:shadow-md transition-all duration-300 disabled:opacity-50"
        >
          {chargementOAuth === "github" ? (
            <div className="w-5 h-5 border-2 border-sky/30 border-t-sky rounded-full animate-spin" />
          ) : (
            <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          )}
          GitHub
        </button>
      </div>

      {/* Séparateur */}
      <div className="relative my-6 animate-fade-in">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/40" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white/70 backdrop-blur-sm px-3 text-xs text-muted-foreground/70 uppercase tracking-wider">
            ou par email
          </span>
        </div>
      </div>

      {/* Formulaire d'inscription */}
      <form onSubmit={gererInscription} className="flex flex-col gap-4 animate-slide-up-delayed-2">
        {erreur && (
          <div className="flex items-center gap-2.5 rounded-xl bg-destructive/8 border border-destructive/15 px-4 py-3 text-sm text-destructive animate-scale-in">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {erreur}
          </div>
        )}

        <div>
          <label htmlFor="nom" className="block text-sm font-medium text-foreground/80 mb-2">
            Nom complet
          </label>
          <input
            id="nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Jean Dupont"
            required
            autoComplete="name"
            className="input-glow w-full rounded-xl border border-input/60 bg-white/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-sky/40 focus:bg-white transition-all duration-300"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-2">
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
            className="input-glow w-full rounded-xl border border-input/60 bg-white/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-sky/40 focus:bg-white transition-all duration-300"
          />
        </div>

        <div>
          <label htmlFor="mot-de-passe" className="block text-sm font-medium text-foreground/80 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="mot-de-passe"
              type={afficherMotDePasse ? "text" : "password"}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              className="input-glow w-full rounded-xl border border-input/60 bg-white/60 px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-sky/40 focus:bg-white transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/70 transition-colors duration-200"
              tabIndex={-1}
            >
              <IconeOeil visible={afficherMotDePasse} />
            </button>
          </div>
          {/* Indicateur de force */}
          {motDePasse && (
            <div className="mt-2.5 animate-scale-in">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((niveau) => (
                  <div
                    key={niveau}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      force >= niveau ? niveauForce!.couleur : "bg-border/40"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground/60">
                {niveauForce!.libelle}
              </p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmation-mot-de-passe" className="block text-sm font-medium text-foreground/80 mb-2">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              id="confirmation-mot-de-passe"
              type={afficherConfirmation ? "text" : "password"}
              value={confirmationMotDePasse}
              onChange={(e) => setConfirmationMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              className={`input-glow w-full rounded-xl border bg-white/60 px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:bg-white transition-all duration-300 ${
                confirmationMotDePasse && confirmationMotDePasse !== motDePasse
                  ? "border-destructive/40 focus:border-destructive/60"
                  : confirmationMotDePasse && confirmationMotDePasse === motDePasse
                    ? "border-teal/40 focus:border-teal/60"
                    : "border-input/60 focus:border-sky/40"
              }`}
            />
            <button
              type="button"
              onClick={() => setAfficherConfirmation(!afficherConfirmation)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/70 transition-colors duration-200"
              tabIndex={-1}
            >
              <IconeOeil visible={afficherConfirmation} />
            </button>
          </div>
          {confirmationMotDePasse && confirmationMotDePasse !== motDePasse && (
            <p className="mt-1 text-xs text-destructive/70 animate-scale-in">
              Les mots de passe ne correspondent pas
            </p>
          )}
          {confirmationMotDePasse && confirmationMotDePasse === motDePasse && (
            <p className="mt-1 text-xs text-teal animate-scale-in flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Les mots de passe correspondent
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={chargement}
          className="btn-glow w-full rounded-xl bg-gradient-to-r from-nexora-blue to-sky px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-1 transition-all duration-300"
        >
          {chargement ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Création en cours...
            </span>
          ) : (
            "Créer mon compte"
          )}
        </button>
      </form>

      {/* Lien connexion */}
      <p className="mt-6 text-center text-sm text-muted-foreground/70 animate-fade-in-delayed">
        Déjà un compte ?{" "}
        <Link
          href="/connexion"
          className="text-sky font-semibold hover:text-nexora-blue transition-colors duration-200"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
