"use client";

/**
 * BarreLaterale — navigation principale du tableau de bord.
 * Affiche le logo Nexora, les liens de navigation et le profil utilisateur.
 */
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
} from "lucide-react";
import { cn } from "@nexora/ui";

/** Éléments de navigation du tableau de bord */
const ELEMENTS_NAVIGATION = [
  {
    libelle: "Tableau de bord",
    href: "/tableau-de-bord",
    icone: LayoutDashboard,
  },
  {
    libelle: "Sites",
    href: "/tableau-de-bord/sites",
    icone: Globe,
  },
  {
    libelle: "Pages",
    href: "/tableau-de-bord/pages",
    icone: FileText,
  },
  {
    libelle: "Médias",
    href: "/tableau-de-bord/medias",
    icone: Image,
  },
  {
    libelle: "Réglages",
    href: "/tableau-de-bord/reglages",
    icone: Settings,
  },
] as const;

interface PropsBarreLaterale {
  /** Nom de l'utilisateur connecté */
  nomUtilisateur?: string;
  /** Email de l'utilisateur connecté */
  emailUtilisateur?: string;
  /** URL de l'avatar (optionnel) */
  avatarUrl?: string;
  /** État mobile ouvert/fermé */
  mobileOuvert: boolean;
  /** Fonction pour toggle mobile */
  surToggleMobile: () => void;
  /** Fonction de déconnexion */
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

  /** Vérifie si un lien est actif */
  function estActif(href: string): boolean {
    if (href === "/tableau-de-bord") return chemin === "/tableau-de-bord";
    return chemin.startsWith(href);
  }

  /** Obtenir les initiales du nom */
  function obtenirInitiales(nom: string): string {
    return nom
      .split(" ")
      .map((m) => m[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const contenuSidebar = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
        <Link href="/tableau-de-bord" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nexora-blue">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          <span className="text-lg font-bold text-white">Nexora</span>
        </Link>
        {/* Bouton fermer mobile */}
        <button
          type="button"
          className="lg:hidden text-sidebar-muted-foreground hover:text-white transition-colors"
          onClick={surToggleMobile}
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Bouton nouveau site */}
      <div className="px-4 pt-4">
        <Link
          href="/tableau-de-bord/sites/nouveau"
          className="flex items-center justify-center gap-2 w-full rounded-md bg-nexora-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau site
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {ELEMENTS_NAVIGATION.map((element) => {
          const Icone = element.icone;
          const actif = estActif(element.href);
          return (
            <Link
              key={element.href}
              href={element.href}
              onClick={() => {
                if (mobileOuvert) surToggleMobile();
              }}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                actif
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-white"
              )}
            >
              <Icone className="h-5 w-5 shrink-0" />
              {element.libelle}
            </Link>
          );
        })}
      </nav>

      {/* Profil utilisateur en bas */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-muted text-sm font-medium text-sidebar-muted-foreground">
            {obtenirInitiales(nomUtilisateur)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {nomUtilisateur}
            </p>
            {emailUtilisateur && (
              <p className="text-xs text-sidebar-muted-foreground truncate">
                {emailUtilisateur}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={surDeconnexion}
            className="text-sidebar-muted-foreground hover:text-white transition-colors"
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {contenuSidebar}
      </aside>

      {/* Overlay mobile */}
      {mobileOuvert && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={surToggleMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out lg:hidden",
          mobileOuvert ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {contenuSidebar}
      </aside>
    </>
  );
}

/** Bouton hamburger pour ouvrir la sidebar mobile */
export function BoutonMenuMobile({
  surClick,
}: {
  surClick: () => void;
}) {
  return (
    <button
      type="button"
      className="lg:hidden text-foreground hover:text-accent transition-colors"
      onClick={surClick}
      aria-label="Ouvrir le menu"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
