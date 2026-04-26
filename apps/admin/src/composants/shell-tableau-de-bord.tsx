"use client";

/**
 * ShellTableauDeBord — composant client qui assemble la sidebar,
 * le header et le contenu principal du dashboard.
 * Gère l'état mobile et la déconnexion.
 */
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clientAuth } from "@nexora/auth";
import { BarreLaterale } from "./barre-laterale";
import { EnTete } from "./en-tete";

/** Mapping chemin → titre pour le header */
const TITRES_PAGES: Record<string, string> = {
  "/tableau-de-bord": "Tableau de bord",
  "/tableau-de-bord/sites": "Mes sites",
  "/tableau-de-bord/sites/nouveau": "Nouveau site",
  "/tableau-de-bord/pages": "Pages",
  "/tableau-de-bord/medias": "Médias",
  "/tableau-de-bord/reglages": "Réglages",
};

interface PropsShell {
  children: React.ReactNode;
  nomUtilisateur?: string;
  emailUtilisateur?: string;
  avatarUrl?: string;
}

export function ShellTableauDeBord({
  children,
  nomUtilisateur,
  emailUtilisateur,
  avatarUrl,
}: PropsShell) {
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const routeur = useRouter();
  const chemin = usePathname();

  /** Déterminer le titre à afficher */
  const titre =
    TITRES_PAGES[chemin] ||
    Object.entries(TITRES_PAGES).find(([cle]) =>
      chemin.startsWith(cle) && cle !== "/tableau-de-bord"
    )?.[1] ||
    "Tableau de bord";

  /** Déconnexion et redirection */
  async function gererDeconnexion() {
    await clientAuth.signOut();
    routeur.push("/connexion");
    routeur.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <BarreLaterale
        nomUtilisateur={nomUtilisateur}
        emailUtilisateur={emailUtilisateur}
        avatarUrl={avatarUrl}
        mobileOuvert={menuMobileOuvert}
        surToggleMobile={() => setMenuMobileOuvert(!menuMobileOuvert)}
        surDeconnexion={gererDeconnexion}
      />

      <div className="flex flex-1 flex-col">
        <EnTete
          titre={titre}
          surOuvrirMenu={() => setMenuMobileOuvert(true)}
        />
        <main className="flex-1 bg-white-ice p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
