"use client";

/**
 * En-tête du site public avec menu desktop et drawer mobile.
 * Composant client uniquement pour gérer l'ouverture du drawer.
 */
import { useState } from "react";
import Link from "next/link";
import { Menu, X, ExternalLink, Globe, ChevronDown } from "lucide-react";
import { obtenirInfoLangue } from "@nexora/ui";
import type { ElementMenu } from "@/lib/resoudre-navigation";

interface PropsEnTete {
  nomSite: string;
  slugSite: string;
  urlLogo: string | null;
  elements: ElementMenu[];
  /** Codes des langues activées sur le site */
  langues: string[];
  /** Code de la langue actuellement affichée */
  langueCourante: string;
  /** Code de la langue par défaut du site */
  langueParDefaut: string;
  /** Chemin courant (sans le préfixe de langue) ex: "/", "/a-propos" */
  cheminCourant: string;
}

export function EnTeteSite({
  nomSite,
  slugSite,
  urlLogo,
  elements,
  langues,
  langueCourante,
  langueParDefaut,
  cheminCourant,
}: PropsEnTete) {
  const [drawerOuvert, setDrawerOuvert] = useState(false);
  const [menuLangueOuvert, setMenuLangueOuvert] = useState(false);

  /** Construit l'URL pour basculer dans une autre langue */
  function urlPourLangue(code: string): string {
    const cheminPropre = cheminCourant === "/" ? "" : cheminCourant;
    if (code === langueParDefaut) {
      return `/s/${slugSite}${cheminPropre}`;
    }
    return `/s/${slugSite}/${code}${cheminPropre}`;
  }

  const infoCourante = obtenirInfoLangue(langueCourante);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-4">
        {/* Logo */}
        <Link
          href={`/s/${slugSite}`}
          className="flex shrink-0 items-center gap-2 text-foreground"
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

        {/* Menu desktop */}
        {elements.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex">
            {elements.map((item) => (
              <LienMenu key={item.id} element={item} />
            ))}
          </nav>
        )}

        {/* Sélecteur de langue (desktop, uniquement si plus d'une langue) */}
        {langues.length > 1 && (
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setMenuLangueOuvert((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Changer de langue"
              aria-expanded={menuLangueOuvert}
            >
              <Globe className="h-4 w-4" />
              <span className="text-base leading-none">{infoCourante.drapeau}</span>
              <span className="font-mono text-xs uppercase">{langueCourante}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            {menuLangueOuvert && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuLangueOuvert(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-background shadow-xl py-1">
                  {langues.map((code) => {
                    const info = obtenirInfoLangue(code);
                    const actif = code === langueCourante;
                    return (
                      <Link
                        key={code}
                        href={urlPourLangue(code)}
                        onClick={() => setMenuLangueOuvert(false)}
                        hrefLang={code}
                        className={
                          "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors " +
                          (actif
                            ? "bg-muted text-foreground font-medium"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground")
                        }
                      >
                        <span className="text-lg">{info.drapeau}</span>
                        <span className="flex-1">{info.nomNatif}</span>
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">
                          {code}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Bouton mobile */}
        {elements.length > 0 && (
          <button
            type="button"
            onClick={() => setDrawerOuvert(true)}
            aria-label="Ouvrir le menu"
            className="rounded-md p-2 text-foreground hover:bg-muted md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Drawer mobile */}
      {drawerOuvert && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setDrawerOuvert(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute right-0 top-0 h-full w-72 bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold text-foreground">{nomSite}</span>
              <button
                type="button"
                onClick={() => setDrawerOuvert(false)}
                aria-label="Fermer le menu"
                className="rounded-md p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {elements.map((item) => (
                <LienMenuMobile
                  key={item.id}
                  element={item}
                  onNavigate={() => setDrawerOuvert(false)}
                />
              ))}
            </nav>

            {/* Sélecteur de langue mobile */}
            {langues.length > 1 && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Langue
                </p>
                <div className="flex flex-col gap-1">
                  {langues.map((code) => {
                    const info = obtenirInfoLangue(code);
                    const actif = code === langueCourante;
                    return (
                      <Link
                        key={code}
                        href={urlPourLangue(code)}
                        onClick={() => setDrawerOuvert(false)}
                        hrefLang={code}
                        className={
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors " +
                          (actif
                            ? "bg-muted text-foreground font-medium"
                            : "text-foreground/80 hover:bg-muted")
                        }
                      >
                        <span className="text-lg">{info.drapeau}</span>
                        <span className="flex-1">{info.nomNatif}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* Lien desktop avec sous-menu déroulant au survol */
function LienMenu({ element }: { element: ElementMenu }) {
  const aEnfants = element.enfants.length > 0;

  if (!aEnfants) {
    return (
      <Link
        href={element.href}
        target={element.externe ? "_blank" : undefined}
        rel={element.externe ? "noopener noreferrer" : undefined}
        className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
      >
        {element.libelle}
        {element.externe && (
          <ExternalLink className="ml-1 inline h-3 w-3 opacity-60" />
        )}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
      >
        {element.libelle}
      </button>
      <div className="invisible absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-background opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
        <ul className="py-2">
          {element.enfants.map((enfant) => (
            <li key={enfant.id}>
              <Link
                href={enfant.href}
                target={enfant.externe ? "_blank" : undefined}
                rel={enfant.externe ? "noopener noreferrer" : undefined}
                className="block px-4 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                {enfant.libelle}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* Lien mobile (drawer) — sous-menus aplatis avec indentation */
function LienMenuMobile({
  element,
  onNavigate,
}: {
  element: ElementMenu;
  onNavigate: () => void;
}) {
  return (
    <>
      <Link
        href={element.href}
        target={element.externe ? "_blank" : undefined}
        rel={element.externe ? "noopener noreferrer" : undefined}
        onClick={onNavigate}
        className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
      >
        {element.libelle}
      </Link>
      {element.enfants.length > 0 && (
        <div className="ml-4 flex flex-col gap-1 border-l border-border pl-3">
          {element.enfants.map((enfant) => (
            <Link
              key={enfant.id}
              href={enfant.href}
              target={enfant.externe ? "_blank" : undefined}
              rel={enfant.externe ? "noopener noreferrer" : undefined}
              onClick={onNavigate}
              className="rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-muted"
            >
              {enfant.libelle}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
