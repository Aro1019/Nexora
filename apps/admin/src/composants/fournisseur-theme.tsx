"use client";

/**
 * FournisseurTheme — gère le mode clair/sombre/système.
 * Persiste le choix dans localStorage et applique la classe `dark`
 * sur l'élément <html>. Écoute aussi les changements système.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "clair" | "sombre" | "systeme";

interface ContexteTheme {
  theme: Theme;
  themeResolu: "clair" | "sombre";
  definirTheme: (theme: Theme) => void;
}

const ContexteThemeReact = createContext<ContexteTheme | null>(null);

const CLE_STOCKAGE = "nexora-theme";

/** Récupère la préférence système actuelle */
function obtenirPreferenceSysteme(): "clair" | "sombre" {
  if (typeof window === "undefined") return "clair";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "sombre"
    : "clair";
}

/** Applique le thème résolu à l'élément <html> */
function appliquerTheme(themeResolu: "clair" | "sombre") {
  if (typeof document === "undefined") return;
  const racine = document.documentElement;
  if (themeResolu === "sombre") {
    racine.classList.add("dark");
  } else {
    racine.classList.remove("dark");
  }
}

export function FournisseurTheme({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("systeme");
  const [themeResolu, setThemeResolu] = useState<"clair" | "sombre">("clair");

  /* Initialisation depuis localStorage */
  useEffect(() => {
    const stocke = localStorage.getItem(CLE_STOCKAGE) as Theme | null;
    const themeInitial: Theme =
      stocke === "clair" || stocke === "sombre" || stocke === "systeme"
        ? stocke
        : "systeme";
    setTheme(themeInitial);
  }, []);

  /* Calcul du thème résolu et application */
  useEffect(() => {
    const resolu = theme === "systeme" ? obtenirPreferenceSysteme() : theme;
    setThemeResolu(resolu);
    appliquerTheme(resolu);
  }, [theme]);

  /* Écoute les changements système si mode "systeme" */
  useEffect(() => {
    if (theme !== "systeme") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function gererChangement(e: MediaQueryListEvent) {
      const resolu = e.matches ? "sombre" : "clair";
      setThemeResolu(resolu);
      appliquerTheme(resolu);
    }
    mediaQuery.addEventListener("change", gererChangement);
    return () => mediaQuery.removeEventListener("change", gererChangement);
  }, [theme]);

  const definirTheme = useCallback((nouveau: Theme) => {
    setTheme(nouveau);
    localStorage.setItem(CLE_STOCKAGE, nouveau);
  }, []);

  const valeur = useMemo(
    () => ({ theme, themeResolu, definirTheme }),
    [theme, themeResolu, definirTheme]
  );

  return (
    <ContexteThemeReact.Provider value={valeur}>
      {children}
    </ContexteThemeReact.Provider>
  );
}

/** Hook pour accéder au thème courant */
export function useTheme(): ContexteTheme {
  const contexte = useContext(ContexteThemeReact);
  if (!contexte) {
    throw new Error("useTheme doit être utilisé dans un FournisseurTheme");
  }
  return contexte;
}

/**
 * Script à injecter dans <head> pour éviter le flash de thème
 * incorrect (FOUC) au premier chargement.
 */
export const SCRIPT_INIT_THEME = `
(function(){
  try {
    var t = localStorage.getItem("${CLE_STOCKAGE}");
    var sombre = t === "sombre" || (t !== "clair" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (sombre) document.documentElement.classList.add("dark");
  } catch(e) {}
})();
`;
