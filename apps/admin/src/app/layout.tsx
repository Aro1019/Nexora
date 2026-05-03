import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FournisseurTRPC } from "@/composants/fournisseur-trpc";
import {
  FournisseurTheme,
  SCRIPT_INIT_THEME,
} from "@/composants/fournisseur-theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

/** Métadonnées globales de l'application Nexora */
export const metadata: Metadata = {
  title: "Nexora",
  description: "La plateforme CMS moderne pour créer vos sites internet",
};

/** Disposition racine de l'application */
export default function DispositionRacine({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Script anti-FOUC : applique la classe `dark` avant le rendu */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_INIT_THEME }} />
      </head>
      <body className={`${inter.className} bg-background text-foreground`}>
        <FournisseurTheme>
          <FournisseurTRPC>{children}</FournisseurTRPC>
        </FournisseurTheme>
      </body>
    </html>
  );
}
