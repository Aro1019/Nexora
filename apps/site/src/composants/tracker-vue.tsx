"use client";

/**
 * Tracker analytique sans cookies.
 * Envoie une balise au serveur dès le montage. Idempotent par chemin
 * pour éviter les doubles envois en mode StrictMode / navigations rapides.
 *
 * Aucun cookie, aucun localStorage : la déduplication "visiteur unique"
 * se fait côté serveur via un hash quotidien (IP + UA + sel).
 */
import { useEffect, useRef } from "react";

interface PropsTracker {
  siteSlug: string;
  chemin: string;
  langue: string;
  idPage?: string | null;
}

export function TrackerVue({ siteSlug, chemin, langue, idPage }: PropsTracker) {
  const dejaEnvoye = useRef<string | null>(null);

  useEffect(() => {
    /* Ne pas tracker en mode aperçu (le pathname commence par /preview/ depuis l'iframe) */
    if (typeof window !== "undefined" && window.location.pathname.includes("/preview/")) {
      return;
    }

    const cle = `${chemin}|${langue}`;
    if (dejaEnvoye.current === cle) return;
    dejaEnvoye.current = cle;

    const corps = JSON.stringify({
      chemin,
      langue,
      idPage,
      referent: document.referrer || undefined,
    });

    /* sendBeacon prioritaire (n'annule pas si l'onglet se ferme), sinon fetch */
    try {
      const url = `/s/${siteSlug}/api/vue`;
      const blob = new Blob([corps], { type: "application/json" });
      const envoye = navigator.sendBeacon?.(url, blob);
      if (!envoye) {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: corps,
          keepalive: true,
        }).catch(() => {
          /* silencieux : un échec d'analytique ne doit pas perturber l'UX */
        });
      }
    } catch {
      /* idem */
    }
  }, [siteSlug, chemin, langue, idPage]);

  return null;
}
