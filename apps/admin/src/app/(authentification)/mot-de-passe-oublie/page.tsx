/**
 * Page "Mot de passe oublié" — demande d'envoi d'un lien de réinitialisation.
 * Placeholder fonctionnel : la mécanique d'envoi d'email sera branchée à
 * Better Auth (resetPassword) dans une itération ultérieure.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

export default function PageMotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [chargement, setChargement] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    /* TODO: brancher clientAuth.forgetPassword / resetPassword */
    await new Promise((r) => setTimeout(r, 600));
    setChargement(false);
    setEnvoye(true);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Mot de passe oublié
        </h1>
        <p className="mt-1.5 text-sm text-frost/70">
          Entrez votre adresse email pour recevoir un lien de réinitialisation.
        </p>
      </div>

      {envoye ? (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">
          Si un compte existe pour <strong>{email}</strong>, un email de
          réinitialisation vient d&apos;être envoyé.
        </div>
      ) : (
        <form onSubmit={gererSoumission} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-frost"
            >
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
                disabled={chargement}
                className="w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-nexora-blue focus:outline-none focus:ring-2 focus:ring-nexora-blue/15 disabled:opacity-60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={chargement}
            className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-nexora-blue px-4 text-sm font-semibold text-white shadow-sm hover:bg-nexora-blue/90 disabled:opacity-60"
          >
            {chargement && <Loader2 className="h-4 w-4 animate-spin" />}
            {chargement ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-frost/60">
        <Link
          href="/connexion"
          className="inline-flex items-center gap-1.5 font-semibold text-sky hover:text-frost"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
