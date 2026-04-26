import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FournisseurTRPC } from "@/composants/fournisseur-trpc";
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
    <html lang="fr">
      <body className={`${inter.className} bg-background text-foreground`}>
        <FournisseurTRPC>{children}</FournisseurTRPC>
      </body>
    </html>
  );
}
