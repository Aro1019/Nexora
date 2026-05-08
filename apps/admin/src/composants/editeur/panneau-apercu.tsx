"use client";

/**
 * Panneau d'aperçu intégré à l'éditeur de page.
 * - Bouton "Aperçu" : ouvre/ferme un volet latéral contenant un iframe.
 * - Bouton "Partager" : ouvre une modale qui génère un lien d'aperçu signé.
 *
 * Le volet aperçu charge `/s/[siteSlug]/preview/[token]?live=1` et reçoit
 * en temps réel les changements de contenu via postMessage.
 */
import { useEffect, useRef, useState } from "react";
import { Eye, Share2, X, Copy, ExternalLink, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PropsPanneauApercu {
  idPage: string;
  idSite: string;
  slugSite: string;
  /** Contenu courant (mis à jour en direct dans l'iframe). */
  contenu: unknown;
  /** Titre courant (mis à jour en direct dans l'iframe). */
  titre: string;
  /** URL de base de l'app site, ex: http://localhost:3001. */
  urlBaseSite: string;
}

export function PanneauApercu({
  idPage,
  idSite,
  slugSite,
  contenu,
  titre,
  urlBaseSite,
}: PropsPanneauApercu) {
  const [ouvertApercu, setOuvertApercu] = useState(false);
  const [ouvertPartage, setOuvertPartage] = useState(false);
  const [jetonDirect, setJetonDirect] = useState<string | null>(null);
  const [jetonPartage, setJetonPartage] = useState<string | null>(null);
  const [dureeHeures, setDureeHeures] = useState(72);
  const [copie, setCopie] = useState(false);
  const [iframePret, setIframePret] = useState(false);
  const refIframe = useRef<HTMLIFrameElement | null>(null);

  const mutationLien = trpc.pages.creerLienApercu.useMutation();

  /* Génère un jeton "live" lors de la première ouverture du panneau aperçu. */
  useEffect(() => {
    if (ouvertApercu && !jetonDirect && !mutationLien.isPending) {
      mutationLien.mutate(
        { id: idPage, idSite, dureeHeures: 24 },
        {
          onSuccess: (res) => setJetonDirect(res.jeton),
        }
      );
    }
  }, [ouvertApercu, jetonDirect, idPage, idSite, mutationLien]);

  /* Écoute les "pret" de l'iframe pour démarrer la diffusion. */
  useEffect(() => {
    function gerer(event: MessageEvent) {
      const d = event.data as { type?: string } | null;
      if (d && d.type === "nexora:apercu:pret") {
        setIframePret(true);
      }
    }
    window.addEventListener("message", gerer);
    return () => window.removeEventListener("message", gerer);
  }, []);

  /* Diffuse contenu/titre vers l'iframe (debounce 250ms). */
  useEffect(() => {
    if (!iframePret || !refIframe.current?.contentWindow) return;
    const handle = setTimeout(() => {
      refIframe.current?.contentWindow?.postMessage(
        {
          type: "nexora:apercu:miseAJour",
          contenu,
          titre,
        },
        "*"
      );
    }, 250);
    return () => clearTimeout(handle);
  }, [contenu, titre, iframePret]);

  /* Fermer aperçu / partage avec la touche Échap. */
  useEffect(() => {
    if (!ouvertApercu && !ouvertPartage) return;
    function gererEchap(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (ouvertPartage) {
        setOuvertPartage(false);
      } else if (ouvertApercu) {
        setOuvertApercu(false);
      }
    }
    window.addEventListener("keydown", gererEchap);
    return () => window.removeEventListener("keydown", gererEchap);
  }, [ouvertApercu, ouvertPartage]);

  /** Génère un lien partageable selon la durée choisie. */
  function genererLienPartage() {
    setJetonPartage(null);
    setCopie(false);
    mutationLien.mutate(
      { id: idPage, idSite, dureeHeures },
      {
        onSuccess: (res) => setJetonPartage(res.jeton),
      }
    );
  }

  /** Copie une URL dans le presse-papiers. */
  async function copierLien(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* Clipboard refusé : sélection manuelle possible */
    }
  }

  const urlIframe = jetonDirect
    ? `${urlBaseSite}/s/${slugSite}/preview/${jetonDirect}?live=1`
    : null;
  const urlPartage = jetonPartage
    ? `${urlBaseSite}/s/${slugSite}/preview/${jetonPartage}`
    : null;

  return (
    <>
      {/* Boutons de la barre d'actions */}
      <button
        type="button"
        onClick={() => setOuvertApercu((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        title="Aperçu en direct"
      >
        <Eye className="h-4 w-4" />
        Aperçu
      </button>

      <button
        type="button"
        onClick={() => setOuvertPartage(true)}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        title="Partager le brouillon"
      >
        <Share2 className="h-4 w-4" />
        Partager
      </button>

      {/* ─── Volet latéral aperçu ─── */}
      {ouvertApercu && (
        <div className="fixed inset-y-0 right-0 z-40 w-full md:w-[640px] lg:w-[720px] bg-white border-l border-border shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Aperçu en direct
              </span>
              {iframePret && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connecté
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {urlIframe && (
                <a
                  href={urlIframe}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Ouvrir dans un onglet"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setOuvertApercu(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-muted/20">
            {!urlIframe ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Préparation de l&apos;aperçu…
              </div>
            ) : (
              <iframe
                ref={refIframe}
                src={urlIframe}
                title="Aperçu du site"
                className="h-full w-full border-0 bg-white"
                onLoad={() => {
                  /* iframe rechargé : attendre un nouveau "pret" */
                  setIframePret(false);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ─── Modale partage ─── */}
      {ouvertPartage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOuvertPartage(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Partager un lien d&apos;aperçu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOuvertPartage(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">
                Le lien permet à un visiteur sans compte de voir cette page,
                même si elle est en brouillon. Il expire automatiquement.
              </p>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Durée de validité
                </label>
                <select
                  value={dureeHeures}
                  onChange={(e) => setDureeHeures(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={1}>1 heure</option>
                  <option value={24}>24 heures</option>
                  <option value={72}>3 jours</option>
                  <option value={168}>7 jours</option>
                  <option value={720}>30 jours</option>
                </select>
              </div>

              {!urlPartage ? (
                <button
                  type="button"
                  onClick={genererLienPartage}
                  disabled={mutationLien.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 transition-colors"
                >
                  {mutationLien.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  Générer le lien
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-foreground">
                    Lien d&apos;aperçu
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={urlPartage}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 rounded-md border border-input bg-muted/30 px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => copierLien(urlPartage)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-input bg-white px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      {copie ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copier
                        </>
                      )}
                    </button>
                  </div>
                  <a
                    href={urlPartage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ouvrir dans un nouvel onglet
                  </a>
                </div>
              )}

              {mutationLien.error && (
                <p className="text-xs text-destructive">
                  {mutationLien.error.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
