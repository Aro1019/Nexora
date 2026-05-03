/**
 * Route /bienvenue — splash screen joué après une connexion ou
 * une inscription réussie, avant de basculer vers la destination.
 *
 * Accepte un paramètre `?suivant=` pour personnaliser la redirection.
 */
import { Suspense } from "react";
import { SplashBienvenue } from "@/composants/splash-bienvenue";

export const metadata = {
  title: "Bienvenue sur Nexora",
  robots: { index: false, follow: false },
};

export default function PageBienvenue() {
  return (
    <Suspense fallback={null}>
      <SplashBienvenue />
    </Suspense>
  );
}
