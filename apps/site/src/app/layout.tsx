import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

/** Métadonnées par défaut — surchargées par chaque page de site */
export const metadata: Metadata = {
  title: "Nexora — Sites publiés",
  description: "Aperçu public des sites Nexora",
};

/** Disposition racine du moteur de rendu public */
export default function DispositionRacine({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
