"use client";

/**
 * Pied de page du site public.
 * Affiche les éléments de navigation PIED_DE_PAGE en colonnes selon
 * l'apparence configurée (nb colonnes, couleurs, logo, réseaux, newsletter, etc.).
 */
import { useState } from "react";
import Link from "next/link";
import {
  type ApparencePied,
  APPARENCE_PIED_DEFAUT,
} from "@nexora/types";
import type { ElementMenu } from "@/lib/resoudre-navigation";

interface LienReseauSocial {
  reseau: string;
  url: string;
}

interface PropsPied {
  nomSite: string;
  slugSite: string;
  urlLogo: string | null;
  elements: ElementMenu[];
  apparence?: ApparencePied | null;
  /** Réseaux sociaux issus des réglages du site */
  reseauxSociaux?: LienReseauSocial[];
}

/** Capitalise la première lettre */
function capitaliser(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function PiedSite({
  nomSite,
  slugSite,
  urlLogo,
  elements,
  apparence,
  reseauxSociaux,
}: PropsPied) {
  const a: ApparencePied = { ...APPARENCE_PIED_DEFAUT, ...(apparence ?? {}) };
  const [emailNL, setEmailNL] = useState("");
  const [statutNL, setStatutNL] = useState<"idle" | "envoye">("idle");

  const styleFooter: React.CSSProperties = {};
  if (a.couleurFond) styleFooter.background = a.couleurFond;
  if (a.couleurTexte) styleFooter.color = a.couleurTexte;

  const colonnesClasse =
    a.nbColonnes === 1
      ? "sm:grid-cols-1"
      : a.nbColonnes === 2
        ? "sm:grid-cols-2"
        : a.nbColonnes === 3
          ? "sm:grid-cols-2 md:grid-cols-3"
          : "sm:grid-cols-2 md:grid-cols-4";

  function gererInscriptionNL(e: React.FormEvent) {
    e.preventDefault();
    if (!emailNL.trim()) return;
    /* MVP : juste un retour visuel ; persistance newsletter à brancher plus tard. */
    setStatutNL("envoye");
    setEmailNL("");
    setTimeout(() => setStatutNL("idle"), 4000);
  }

  return (
    <footer
      style={styleFooter}
      className={
        "mt-24 border-t " +
        (a.couleurFond ? "" : "border-border bg-muted/20")
      }
    >
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Bloc principal : description + colonnes de liens + newsletter */}
        <div className={`grid gap-8 ${colonnesClasse} mb-10`}>
          {/* Première colonne : logo + description + réseaux sociaux */}
          {(a.afficherLogo || a.description) && (
            <div className="space-y-3">
              {a.afficherLogo && (
                <Link
                  href={`/s/${slugSite}`}
                  className="inline-flex items-center gap-2"
                  style={a.couleurTexte ? { color: a.couleurTexte } : undefined}
                >
                  {urlLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urlLogo} alt="" className="h-8 w-8 rounded" />
                  ) : (
                    <span
                      className="grid h-8 w-8 place-items-center rounded text-xs font-bold text-white"
                      style={{ background: "var(--site-couleur-principale)" }}
                    >
                      {nomSite.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="font-semibold">{nomSite}</span>
                </Link>
              )}
              {a.description && (
                <p className="text-sm opacity-80 max-w-xs">{a.description}</p>
              )}
              {a.afficherReseauxSociaux && reseauxSociaux && reseauxSociaux.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {reseauxSociaux.map((r) => (
                    <a
                      key={r.reseau}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline-offset-2 hover:underline opacity-80 hover:opacity-100"
                    >
                      {capitaliser(r.reseau)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Colonnes de liens (un parent = une colonne, ses enfants = liens) */}
          {elements.map((parent) => (
            <div key={parent.id}>
              <h3 className="mb-3 text-sm font-semibold">{parent.libelle}</h3>
              {parent.enfants.length > 0 ? (
                <ul className="space-y-2">
                  {parent.enfants.map((enfant) => (
                    <li key={enfant.id}>
                      <Link
                        href={enfant.href}
                        target={enfant.externe ? "_blank" : undefined}
                        rel={enfant.externe ? "noopener noreferrer" : undefined}
                        className="text-sm opacity-75 hover:opacity-100"
                      >
                        {enfant.libelle}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Link
                  href={parent.href}
                  target={parent.externe ? "_blank" : undefined}
                  rel={parent.externe ? "noopener noreferrer" : undefined}
                  className="text-sm opacity-75 hover:opacity-100"
                >
                  {parent.libelle}
                </Link>
              )}
            </div>
          ))}

          {/* Newsletter */}
          {a.newsletter.active && (
            <div>
              <h3 className="mb-3 text-sm font-semibold">
                {a.newsletter.titre ?? "Newsletter"}
              </h3>
              {statutNL === "envoye" ? (
                <p className="text-sm opacity-80">Merci ! Inscription enregistrée.</p>
              ) : (
                <form onSubmit={gererInscriptionNL} className="flex flex-col gap-2">
                  <input
                    type="email"
                    required
                    value={emailNL}
                    onChange={(e) => setEmailNL(e.target.value)}
                    placeholder={a.newsletter.placeholder ?? "votre@email.com"}
                    className="rounded-md border border-input bg-background/60 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    S’inscrire
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Bas du footer : copyright + liens secondaires */}
        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm opacity-80">
          <p className="text-center sm:text-left">
            {a.texteCopyright?.trim()
              ? a.texteCopyright
              : `© ${new Date().getFullYear()} ${nomSite} — Propulsé par Nexora`}
          </p>
          {a.liensSecondaires.length > 0 && (
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {a.liensSecondaires.map((l) => (
                <Link key={l.id} href={l.url} className="hover:underline">
                  {l.libelle}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
