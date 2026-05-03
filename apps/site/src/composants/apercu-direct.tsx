"use client";

/**
 * Écouteur d'aperçu en direct.
 * Reçoit les changements de contenu envoyés par l'éditeur admin via
 * window.postMessage et remplace le DOM rendu en SSR par une version
 * client basée sur RendreBlocClient.
 *
 * Sécurité : on n'accepte que les messages dont event.data.type est
 * "nexora:apercu:miseAJour" et qui proviennent d'une fenêtre parente
 * (iframe). On ne valide pas l'origine pour autoriser les déploiements
 * où l'admin et le site sont sur des domaines différents — la confiance
 * vient du jeton d'aperçu signé qui a déjà autorisé l'accès à la page.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RendreBlocClient, type BlocApercu } from "./rendre-bloc-client";

interface MessageMiseAJour {
  type: "nexora:apercu:miseAJour";
  titre?: string;
  contenu?: BlocApercu[];
}

export function EcouteurApercuDirect() {
  const [contenu, setContenu] = useState<BlocApercu[] | null>(null);
  const [titre, setTitre] = useState<string | null>(null);
  const [conteneurContenu, setConteneurContenu] = useState<HTMLElement | null>(null);
  const [conteneurTitre, setConteneurTitre] = useState<HTMLElement | null>(null);

  /* Localiser les conteneurs SSR au montage. */
  useEffect(() => {
    setConteneurContenu(
      document.querySelector<HTMLElement>("[data-apercu-contenu]")
    );
    setConteneurTitre(
      document.querySelector<HTMLElement>("[data-apercu-titre]")
    );
  }, []);

  /* Annoncer la disponibilité au parent et écouter les mises à jour. */
  useEffect(() => {
    function gerer(event: MessageEvent) {
      const donnees = event.data as MessageMiseAJour | null;
      if (!donnees || donnees.type !== "nexora:apercu:miseAJour") return;
      if (Array.isArray(donnees.contenu)) setContenu(donnees.contenu);
      if (typeof donnees.titre === "string") setTitre(donnees.titre);
    }
    window.addEventListener("message", gerer);

    /* Signaler que l'aperçu est prêt à recevoir des mises à jour. */
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "nexora:apercu:pret" }, "*");
    }

    return () => window.removeEventListener("message", gerer);
  }, []);

  /* Remplacer le titre via portail si besoin. */
  const portailTitre =
    titre !== null && conteneurTitre
      ? createPortal(<>{titre}</>, conteneurTitre)
      : null;

  /* Remplacer le contenu via portail. */
  const portailContenu =
    contenu !== null && conteneurContenu
      ? createPortal(<RendreBlocClient blocs={contenu} />, conteneurContenu)
      : null;

  return (
    <>
      {portailTitre}
      {portailContenu}
    </>
  );
}
