"use client";

/**
 * ShellTableauDeBord — assemble la sidebar, le header et le contenu.
 * Fond avec grille subtile et orbe lumineuse pour donner de la profondeur.
 */
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clientAuth } from "@nexora/auth/client";
import { BarreLaterale } from "./barre-laterale";
import { EnTete } from "./en-tete";

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

  const titre =
    TITRES_PAGES[chemin] ||
    Object.entries(TITRES_PAGES).find(
      ([cle]) => chemin.startsWith(cle) && cle !== "/tableau-de-bord"
    )?.[1] ||
    "Tableau de bord";

  async function gererDeconnexion() {
    await clientAuth.signOut();
    routeur.push("/connexion");
    routeur.refresh();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <BarreLaterale
        nomUtilisateur={nomUtilisateur}
        emailUtilisateur={emailUtilisateur}
        avatarUrl={avatarUrl}
        mobileOuvert={menuMobileOuvert}
        surToggleMobile={() => setMenuMobileOuvert(!menuMobileOuvert)}
        surDeconnexion={gererDeconnexion}
      />

      <div className="flex flex-1 flex-col min-w-0 relative">
        {/* ── Fond décoratif subtil ── */}
        <div className="absolute inset-0 bg-grid-subtle mask-radial pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] rounded-full bg-sky/5 blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-20 w-[300px] h-[300px] rounded-full bg-teal/5 blur-3xl pointer-events-none" />

        <EnTete titre={titre} surOuvrirMenu={() => setMenuMobileOuvert(true)} />

        <main className="relative flex-1 p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
