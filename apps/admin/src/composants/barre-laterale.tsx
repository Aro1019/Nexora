"use client";

/**
 * BarreLaterale — navigation principale du tableau de bord.
 * Design glassmorphism avec indicateur actif animé qui glisse,
 * effets de hover magnétiques et logo lumineux.
 *
 * Mode replié : la barre se réduit à une colonne d'icônes pour
 * offrir plus d'espace au contenu. L'état est persisté dans
 * localStorage (clé `nexora-sidebar-replie`).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  FileText,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@nexora/ui";
import { LogoNexora } from "./logo-nexora";

/** Éléments de navigation du tableau de bord */
const ELEMENTS_NAVIGATION = [
  { libelle: "Tableau de bord", href: "/tableau-de-bord", icone: LayoutDashboard },
  { libelle: "Sites", href: "/tableau-de-bord/sites", icone: Globe },
  { libelle: "Pages", href: "/tableau-de-bord/pages", icone: FileText },
  { libelle: "Médias", href: "/tableau-de-bord/medias", icone: Image },
  { libelle: "Réglages", href: "/tableau-de-bord/reglages", icone: Settings },
] as const;

const CLE_STOCKAGE_REPLI = "nexora-sidebar-replie";

interface PropsBarreLaterale {
  nomUtilisateur?: string;
  emailUtilisateur?: string;
  avatarUrl?: string;
  mobileOuvert: boolean;
  surToggleMobile: () => void;
  surDeconnexion: () => void;
}

export function BarreLaterale({
  nomUtilisateur = "Utilisateur",
  emailUtilisateur = "",
  mobileOuvert,
  surToggleMobile,
  surDeconnexion,
}: PropsBarreLaterale) {
  const chemin = usePathname();
  const [replie, setReplie] = useState(false);

  // Restaurer l'état replié depuis localStorage au montage
  useEffect(() => {
    try {
      const stocke = window.localStorage.getItem(CLE_STOCKAGE_REPLI);
      if (stocke === "1") setReplie(true);
    } catch {
      /* ignore */
    }
  }, []);

  function basculerRepli() {
    setReplie((precedent) => {
      const nouveau = !precedent;
      try {
        window.localStorage.setItem(CLE_STOCKAGE_REPLI, nouveau ? "1" : "0");
      } catch {
        /* ignore */
      }
      return nouveau;
    });
  }

  function estActif(href: string): boolean {
    if (href === "/tableau-de-bord") return chemin === "/tableau-de-bord";
    return chemin.startsWith(href);
  }

  function obtenirInitiales(nom: string): string {
    return nom
      .split(" ")
      .map((m) => m[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Construit le contenu de la sidebar.
   * `forcerDeplie` = true sur mobile pour ignorer le repli.
   */
  function construireContenu(forcerDeplie: boolean) {
    const estReplie = replie && !forcerDeplie;

    return (
      <div className="relative flex h-full flex-col overflow-hidden">
        {/* Fond gradient sombre */}
        <div className="absolute inset-0 bg-gradient-to-b from-midnight via-[#0a2240] to-midnight" />

        {/* Orbes décoratives */}
        <div className="absolute top-20 -left-10 w-40 h-40 rounded-full bg-nexora-blue/20 blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-20 -right-10 w-32 h-32 rounded-full bg-sky/15 blur-3xl animate-glow-pulse" style={{ animationDelay: "3s" }} />

        <div className="relative flex h-full flex-col">
          {/* ── Logo ── */}
          <div
            className={cn(
              "flex h-20 items-center border-b border-white/5",
              estReplie ? "justify-center px-2" : "justify-between px-4"
            )}
          >
            <Link
              href="/tableau-de-bord"
              className="group flex items-center"
              title={estReplie ? "Nexora" : undefined}
            >
              {estReplie ? (
                <LogoNexora
                  taille={44}
                  avecHalo
                  className="group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <LogoNexora
                  taille={64}
                  avecHalo
                  avecTexte
                  couleurTexte="text-white"
                  classeTexte="text-xl font-bold tracking-tight"
                  className="group-hover:scale-[1.02] transition-transform duration-300"
                />
              )}
            </Link>
            {!estReplie && !forcerDeplie && (
              <button
                type="button"
                className="hidden lg:inline-flex text-frost/60 hover:text-white hover:bg-white/5 transition-all p-1.5 rounded-lg"
                onClick={basculerRepli}
                aria-label="Replier le menu"
                title="Replier le menu"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
            {forcerDeplie && (
              <button
                type="button"
                className="lg:hidden text-frost/60 hover:text-white transition-colors"
                onClick={surToggleMobile}
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* ── Bouton replié de déploiement ── */}
          {estReplie && (
            <div className="px-2 pt-3">
              <button
                type="button"
                className="w-full flex justify-center py-2 rounded-lg text-frost/60 hover:text-white hover:bg-white/5 transition-all"
                onClick={basculerRepli}
                aria-label="Déplier le menu"
                title="Déplier le menu"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Bouton nouveau site (CTA premium) ── */}
          <div className={cn("pt-5", estReplie ? "px-2" : "px-4")}>
            <Link
              href="/tableau-de-bord/sites/nouveau"
              title={estReplie ? "Nouveau site" : undefined}
              className={cn(
                "group relative flex items-center w-full rounded-xl bg-gradient-to-r from-nexora-blue to-sky text-sm font-semibold text-white shadow-lg shadow-nexora-blue/30 hover:shadow-xl hover:shadow-nexora-blue/50 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden",
                estReplie ? "justify-center p-2.5" : "justify-center gap-2 px-4 py-2.5"
              )}
            >
              <span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              />
              <Plus className={cn("relative z-10", estReplie ? "h-5 w-5" : "h-4 w-4")} />
              {!estReplie && <span className="relative z-10">Nouveau site</span>}
            </Link>
          </div>

          {/* ── Navigation avec indicateur actif animé ── */}
          <nav
            className={cn("flex-1 py-5 space-y-1", estReplie ? "px-2" : "px-3")}
          >
            {ELEMENTS_NAVIGATION.map((element) => {
              const Icone = element.icone;
              const actif = estActif(element.href);
              return (
                <Link
                  key={element.href}
                  href={element.href}
                  title={estReplie ? element.libelle : undefined}
                  onClick={() => {
                    if (mobileOuvert) surToggleMobile();
                  }}
                  className={cn(
                    "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-300",
                    estReplie
                      ? "justify-center p-2.5"
                      : "gap-3 px-3 py-2.5",
                    actif
                      ? "text-white"
                      : "text-frost/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {/* Indicateur actif glassmorphique */}
                  {actif && (
                    <>
                      <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-nexora-blue/40 to-sky/20 backdrop-blur-sm border border-white/10" />
                      {!estReplie && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-sky to-nexora-blue shadow-[0_0_12px_rgba(55,138,221,0.6)]" />
                      )}
                    </>
                  )}
                  <Icone className={cn(
                    "h-[18px] w-[18px] shrink-0 relative z-10 transition-transform duration-300",
                    actif ? "text-sky" : "group-hover:scale-110"
                  )} />
                  {!estReplie && <span className="relative z-10">{element.libelle}</span>}
                </Link>
              );
            })}
          </nav>

          {/* ── Carte upgrade (subtile incitation) ── */}
          {!estReplie && (
            <div className="px-4 pb-4">
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-4 backdrop-blur-sm">
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-teal/30 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 text-teal text-xs font-semibold mb-1">
                    <Sparkles className="h-3 w-3" />
                    Astuce
                  </div>
                  <p className="text-xs text-frost/70 leading-relaxed">
                    Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-frost text-[10px] font-mono">⌘K</kbd> pour ouvrir la palette de commandes
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Profil utilisateur ── */}
          <div className={cn("border-t border-white/5", estReplie ? "p-2" : "p-3")}>
            {estReplie ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative shrink-0" title={`${nomUtilisateur}${emailUtilisateur ? ` · ${emailUtilisateur}` : ""}`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky to-nexora-blue text-sm font-semibold text-white">
                    {obtenirInitiales(nomUtilisateur)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-teal border-2 border-midnight" />
                </div>
                <button
                  type="button"
                  onClick={surDeconnexion}
                  className="text-frost/50 hover:text-white hover:bg-destructive/20 p-2 rounded-lg transition-all duration-200"
                  title="Se déconnecter"
                  aria-label="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors duration-200">
                <div className="relative shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky to-nexora-blue text-sm font-semibold text-white">
                    {obtenirInitiales(nomUtilisateur)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-teal border-2 border-midnight" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{nomUtilisateur}</p>
                  {emailUtilisateur && (
                    <p className="text-xs text-frost/50 truncate">{emailUtilisateur}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={surDeconnexion}
                  className="text-frost/50 hover:text-white hover:bg-destructive/20 p-2 rounded-lg transition-all duration-200"
                  title="Se déconnecter"
                  aria-label="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col text-sidebar-foreground border-r border-white/5 relative transition-[width] duration-300 ease-out",
          replie ? "lg:w-20" : "lg:w-64"
        )}
      >
        {construireContenu(false)}
      </aside>

      {/* Overlay mobile */}
      {mobileOuvert && (
        <div
          className="fixed inset-0 z-40 bg-midnight/70 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={surToggleMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar mobile (toujours dépliée) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 text-sidebar-foreground transform transition-transform duration-300 ease-out lg:hidden shadow-2xl",
          mobileOuvert ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {construireContenu(true)}
      </aside>
    </>
  );
}

/** Bouton hamburger pour ouvrir la sidebar mobile */
export function BoutonMenuMobile({ surClick }: { surClick: () => void }) {
  return (
    <button
      type="button"
      className="lg:hidden text-foreground hover:text-sky transition-colors p-1"
      onClick={surClick}
      aria-label="Ouvrir le menu"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
