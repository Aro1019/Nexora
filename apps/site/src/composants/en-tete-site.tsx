"use client";

/**
 * En-tête du site public avec menu desktop et drawer mobile.
 * Composant client uniquement pour gérer l'ouverture du drawer.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ExternalLink, Globe, ChevronDown, Search } from "lucide-react";
import { obtenirInfoLangue } from "@nexora/ui";
import { type ApparenceEntete, APPARENCE_ENTETE_DEFAUT } from "@nexora/types";
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
  /** Apparence personnalisée (couleurs, sticky, CTA, etc.) */
  apparence?: ApparenceEntete | null;
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
  apparence,
}: PropsEnTete) {
  const router = useRouter();
  const [drawerOuvert, setDrawerOuvert] = useState(false);
  const [menuLangueOuvert, setMenuLangueOuvert] = useState(false);
  const [requete, setRequete] = useState("");
  const [scrolle, setScrolle] = useState(false);
  const [cache, setCache] = useState(false);
  const [bandeauFerme, setBandeauFerme] = useState(false);

  const a: ApparenceEntete = { ...APPARENCE_ENTETE_DEFAUT, ...(apparence ?? {}) };
  const seuil = Math.max(0, a.seuilScroll ?? 8);
  const comportement = a.comportementScroll ?? "fixe";
  const aBesoinScroll =
    a.transparent ||
    a.sticky && (comportement !== "fixe" || !!a.couleurFondScroll || !!a.couleurTexteScroll);

  /* Suivi du scroll : flag «scrollé» + détection de direction pour l'auto-cache */
  useEffect(() => {
    if (!aBesoinScroll) return;
    let dernierY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolle(y > seuil);
      if (a.sticky && comportement === "auto-cache") {
        const versLeBas = y > dernierY;
        /* On cache uniquement quand on descend ET qu'on a dépassé le seuil */
        if (versLeBas && y > seuil + 40) setCache(true);
        else if (!versLeBas) setCache(false);
      } else if (cache) {
        setCache(false);
      }
      dernierY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aBesoinScroll, seuil, comportement, a.sticky]);

  /* Mémorisation de la fermeture du bandeau (clé dérivée du texte) */
  const bandeau = a.bandeau;
  const cleBandeau = bandeau?.active && bandeau.texte
    ? `nexora:bandeau:${slugSite}:${bandeau.texte.slice(0, 50)}`
    : null;
  useEffect(() => {
    if (!cleBandeau) return;
    try {
      if (window.localStorage.getItem(cleBandeau) === "ferme") {
        setBandeauFerme(true);
      }
    } catch {
      /* localStorage indisponible : on ignore */
    }
  }, [cleBandeau]);

  /** Construit l'URL pour basculer dans une autre langue */
  function urlPourLangue(code: string): string {
    const cheminPropre = cheminCourant === "/" ? "" : cheminCourant;
    if (code === langueParDefaut) {
      return `/s/${slugSite}${cheminPropre}`;
    }
    return `/s/${slugSite}/${code}${cheminPropre}`;
  }

  const infoCourante = obtenirInfoLangue(langueCourante);

  /* Détection des classes selon l'apparence */
  const classesSticky = a.sticky ? "sticky top-0" : "";
  const transparentActif = a.transparent && !scrolle;
  const fondClasse = transparentActif
    ? "bg-transparent"
    : a.couleurFond
      ? ""
      : "bg-background";

  /* Bordure inférieure */
  const bordureClasse = (() => {
    if (transparentActif) return "border-transparent";
    const ep = a.bordureBas ?? "fine";
    if (ep === "aucune") return "border-b-0";
    if (ep === "epaisse") return "border-b-2";
    return "border-b";
  })();

  /* Ombre portée */
  const ombreClasse = (() => {
    if (transparentActif) return "";
    switch (a.ombre ?? "aucune") {
      case "fine":
        return "shadow-sm";
      case "moyenne":
        return "shadow-md";
      case "forte":
        return "shadow-lg";
      default:
        return "";
    }
  })();

  /* Largeur du conteneur */
  const largeurClasse = (() => {
    switch (a.largeurConteneur ?? "normale") {
      case "etroite":
        return "max-w-3xl";
      case "large":
        return "max-w-7xl";
      case "pleine":
        return "max-w-none";
      default:
        return "max-w-5xl";
    }
  })();

  /* Espacement entre liens */
  const gapLiensClasse = (() => {
    switch (a.espacementLiens ?? "normal") {
      case "compact":
        return "gap-0.5";
      case "aere":
        return "gap-4";
      default:
        return "gap-1";
    }
  })();

  /* Taille du logo (icône carrée + nom adapté) */
  const tailleLogoClasse = (() => {
    switch (a.tailleLogo ?? "M") {
      case "S":
        return "h-6 w-6";
      case "L":
        return "h-10 w-10";
      case "XL":
        return "h-12 w-12";
      default:
        return "h-8 w-8";
    }
  })();
  const tailleNomClasse = (() => {
    switch (a.tailleLogo ?? "M") {
      case "S":
        return "text-sm";
      case "L":
        return "text-lg";
      case "XL":
        return "text-xl";
      default:
        return "text-base";
    }
  })();

  /* Police du nom du site */
  const policeNomClasse = (() => {
    switch (a.policeNomSite ?? "heritee") {
      case "sans":
        return "font-sans";
      case "serif":
        return "font-serif";
      case "mono":
        return "font-mono";
      default:
        return "";
    }
  })();

  /* Position du logo : utilise CSS order pour réorganiser sans changer le DOM */
  const styleLogo: React.CSSProperties = {};
  if (a.couleurTexte) styleLogo.color = a.couleurTexte;
  const positionLogo = a.positionLogo ?? "gauche";
  if (positionLogo === "centre") styleLogo.order = 50;
  else if (positionLogo === "droite") {
    styleLogo.order = 99;
    styleLogo.marginLeft = "auto";
  }

  /* Logo affiché (alternatif si scrollé et URL alt disponible) */
  const urlLogoEffectif = scrolle && a.urlLogoAlt ? a.urlLogoAlt : urlLogo;

  const paddingY =
    a.hauteur === "compact" ? "py-2" : a.hauteur === "grand" ? "py-6" : "py-4";
  /* En mode «réduit» : on compacte le padding une fois scrollé */
  const paddingYEffectif =
    a.sticky && comportement === "reduit" && scrolle ? "py-2" : paddingY;
  const positionClasse =
    a.positionLiens === "gauche"
      ? "justify-start gap-6"
      : a.positionLiens === "centre"
        ? "justify-center gap-6"
        : "justify-end gap-6";

  /* Couleurs effectives (éventuellement remplacées par les versions scrollées) */
  const fondEffectif =
    scrolle && a.couleurFondScroll ? a.couleurFondScroll : a.couleurFond;
  const texteEffectif =
    scrolle && a.couleurTexteScroll ? a.couleurTexteScroll : a.couleurTexte;

  const styleHeader: React.CSSProperties = {};
  if (!transparentActif && fondEffectif) styleHeader.background = fondEffectif;
  if (texteEffectif) styleHeader.color = texteEffectif;
  if (a.bordureBas && a.bordureBas !== "aucune" && a.couleurBordureBas && !transparentActif) {
    styleHeader.borderBottomColor = a.couleurBordureBas;
  }
  /* Auto-cache : translateY vers le haut */
  if (a.sticky && comportement === "auto-cache" && cache && !drawerOuvert) {
    styleHeader.transform = "translateY(-100%)";
  }

  function gererRecherche(e: React.FormEvent) {
    e.preventDefault();
    if (!requete.trim()) return;
    router.push(`/s/${slugSite}/recherche?q=${encodeURIComponent(requete.trim())}`);
  }

  return (
    <>
      {/* Bandeau d'annonce */}
      {bandeau?.active && bandeau.texte && !bandeauFerme && (
        <div
          className="relative w-full"
          style={{
            background: bandeau.couleurFond ?? "var(--site-couleur-principale)",
            color: bandeau.couleurTexte ?? "#ffffff",
          }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-2 text-center text-xs sm:text-sm font-medium">
            {bandeau.lien ? (
              <Link
                href={bandeau.lien}
                className="hover:underline"
                target={/^https?:\/\//.test(bandeau.lien) ? "_blank" : undefined}
                rel={/^https?:\/\//.test(bandeau.lien) ? "noopener noreferrer" : undefined}
              >
                {bandeau.texte}
              </Link>
            ) : (
              <span>{bandeau.texte}</span>
            )}
          </div>
          {bandeau.fermable !== false && (
            <button
              type="button"
              onClick={() => {
                setBandeauFerme(true);
                if (cleBandeau) {
                  try {
                    window.localStorage.setItem(cleBandeau, "ferme");
                  } catch {
                    /* ignore */
                  }
                }
              }}
              aria-label="Fermer le bandeau"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <header
        style={styleHeader}
        className={`z-30 border-border transition-all duration-200 ${classesSticky} ${fondClasse} ${bordureClasse} ${ombreClasse}`}
      >
        <div className={`mx-auto flex ${largeurClasse} items-center gap-6 px-6 ${paddingYEffectif} ${positionClasse}`}>
        {/* Logo */}
        {a.afficherLogo && (
          <Link
            href={`/s/${slugSite}`}
            className="flex shrink-0 items-center gap-2"
            style={styleLogo}
          >
            {urlLogoEffectif ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlLogoEffectif} alt="" className={`${tailleLogoClasse} rounded`} />
            ) : (
              <span
                className={`grid ${tailleLogoClasse} place-items-center rounded text-xs font-bold text-white`}
                style={{ background: "var(--site-couleur-principale)" }}
              >
                {nomSite.charAt(0).toUpperCase()}
              </span>
            )}
            {(a.afficherNomSite ?? true) && (
              <span className={`font-semibold ${tailleNomClasse} ${policeNomClasse}`}>{nomSite}</span>
            )}
          </Link>
        )}

        {/* Menu desktop */}
        {elements.length > 0 && (
          <nav className={`hidden items-center md:flex ${gapLiensClasse} ${a.positionLiens === "centre" ? "mx-auto" : a.positionLiens === "droite" ? "ml-auto" : ""}`}>
            {elements.map((item) => (
              <LienMenu
                key={item.id}
                element={item}
                slugSite={slugSite}
                cheminCourant={cheminCourant}
                style={a.styleLiens ?? "minimal"}
                indicateur={a.indicateurActif ?? "souligne"}
                couleurHover={a.couleurLienHover}
                couleurActif={a.couleurLienActif}
                police={a.policeLiens}
                graisse={a.graisseLiens}
                majuscules={a.liensMajuscules}
              />
            ))}
          </nav>
        )}

        {/* Recherche intégrée */}
        {a.afficherRecherche && (
          <form onSubmit={gererRecherche} className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-60" />
              <input
                type="search"
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
                placeholder="Rechercher…"
                className="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-44"
              />
            </div>
          </form>
        )}

        {/* Bouton CTA */}
        {a.cta.active && (
          <Link
            href={a.cta.url || "/"}
            className="hidden md:inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              background: a.cta.couleurFond ?? "var(--site-couleur-principale)",
              color: a.cta.couleurTexte ?? "#ffffff",
            }}
          >
            {a.cta.texte}
          </Link>
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
    </>
  );
}

/* Lien desktop avec sous-menu déroulant au survol */
function LienMenu({
  element,
  slugSite,
  cheminCourant,
  style,
  indicateur,
  couleurHover,
  couleurActif,
  police,
  graisse,
  majuscules,
}: {
  element: ElementMenu;
  slugSite: string;
  cheminCourant: string;
  style: NonNullable<ApparenceEntete["styleLiens"]>;
  indicateur: NonNullable<ApparenceEntete["indicateurActif"]>;
  couleurHover?: string;
  couleurActif?: string;
  police?: ApparenceEntete["policeLiens"];
  graisse?: ApparenceEntete["graisseLiens"];
  majuscules?: boolean;
}) {
  const aEnfants = element.enfants.length > 0;

  /* Calcule si ce lien correspond à la page courante */
  const cheminDepuisHref = (() => {
    const prefixe = `/s/${slugSite}`;
    if (!element.href.startsWith(prefixe)) return null;
    const reste = element.href.slice(prefixe.length) || "/";
    return reste;
  })();
  const actif =
    cheminDepuisHref !== null &&
    (cheminDepuisHref === cheminCourant ||
      (cheminDepuisHref !== "/" && cheminCourant.startsWith(cheminDepuisHref)));

  /* Classes typographiques additionnelles (police / graisse / casse) */
  const policeClasse = (() => {
    switch (police ?? "heritee") {
      case "sans":
        return "font-sans";
      case "serif":
        return "font-serif";
      case "mono":
        return "font-mono";
      default:
        return "";
    }
  })();
  const graisseClasse = (() => {
    switch (graisse ?? "medium") {
      case "normale":
        return "font-normal";
      case "semi":
        return "font-semibold";
      case "bold":
        return "font-bold";
      default:
        return "font-medium";
    }
  })();
  const majClasse = majuscules ? "uppercase tracking-wider" : "";
  const classesTypo = `${policeClasse} ${graisseClasse} ${majClasse}`;

  /* Classes de base selon le style (sans graisse — gérée par graisseClasse) */
  const baseClasses = (() => {
    switch (style) {
      case "souligne":
        return "relative px-1 py-2 text-sm text-foreground/80 transition-colors hover:text-foreground after:pointer-events-none after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:bg-current after:scale-x-0 after:transition-transform hover:after:scale-x-100";
      case "pilule":
        return "rounded-full border border-transparent px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:border-border hover:bg-muted hover:text-foreground";
      case "fantome":
        return "rounded-md border border-border/60 px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground";
      default:
        return "rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground";
    }
  })();

  /* Classes additionnelles si lien actif (selon le mode d'indicateur) */
  const actifClasses = (() => {
    if (!actif) return "";
    switch (indicateur) {
      case "souligne":
        return "after:!scale-x-100 after:!bg-current text-foreground font-semibold";
      case "point":
        return "relative text-foreground font-semibold before:absolute before:left-1/2 before:-translate-x-1/2 before:-bottom-1 before:h-1 before:w-1 before:rounded-full before:bg-current";
      case "barre-haut":
        return "relative text-foreground font-semibold before:absolute before:left-0 before:right-0 before:-top-px before:h-0.5 before:bg-current";
      case "fond":
        return "bg-muted text-foreground font-semibold";
      case "aucun":
        return "";
      default:
        return "text-foreground font-semibold";
    }
  })();

  const styleLien: React.CSSProperties = {};
  if (actif && couleurActif) styleLien.color = couleurActif;
  /* Couleur de hover via variable CSS custom (consommée par hover:text-[var(--lh)] */
  const styleHover = couleurHover
    ? ({ ["--lh" as string]: couleurHover } as React.CSSProperties)
    : undefined;
  const hoverClasse = couleurHover ? "hover:!text-[var(--lh)]" : "";

  if (!aEnfants) {
    return (
      <Link
        href={element.href}
        target={element.externe ? "_blank" : undefined}
        rel={element.externe ? "noopener noreferrer" : undefined}
        style={{ ...styleHover, ...styleLien }}
        className={`${baseClasses} ${classesTypo} ${actifClasses} ${hoverClasse}`}
        aria-current={actif ? "page" : undefined}
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
        style={{ ...styleHover, ...styleLien }}
        className={`${baseClasses} ${classesTypo} ${actifClasses} ${hoverClasse}`}
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
