"use client";

/**
 * Onglet Historique : liste les versions de la page, permet de prévisualiser,
 * restaurer ou supprimer chaque version.
 */
import { useState } from "react";
import {
  History,
  Loader2,
  RotateCcw,
  Eye,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PropsOnglet {
  idPage: string;
  idSite: string;
  slugSite: string;
  urlBaseSite: string;
  /** Callback déclenché après restauration pour rafraîchir l'éditeur. */
  surRestauration: () => void;
}

export function OngletHistorique({
  idPage,
  idSite,
  slugSite,
  urlBaseSite,
  surRestauration,
}: PropsOnglet) {
  const utils = trpc.useUtils();
  const versions = trpc.versions.lister.useQuery({ idPage, idSite, limite: 50 });

  const [confirmRestaurer, setConfirmRestaurer] = useState<string | null>(null);
  const [confirmSupprimer, setConfirmSupprimer] = useState<string | null>(null);
  const [lienApercu, setLienApercu] = useState<{ id: string; url: string } | null>(null);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState("");

  const mutationRestaurer = trpc.versions.restaurer.useMutation({
    onSuccess: () => {
      utils.versions.lister.invalidate({ idPage, idSite });
      utils.pages.obtenir.invalidate({ id: idPage, idSite });
      setConfirmRestaurer(null);
      surRestauration();
    },
    onError: (e) => setErreur(e.message),
  });

  const mutationSupprimer = trpc.versions.supprimer.useMutation({
    onSuccess: () => {
      utils.versions.lister.invalidate({ idPage, idSite });
      setConfirmSupprimer(null);
    },
    onError: (e) => setErreur(e.message),
  });

  const mutationLien = trpc.versions.creerLienApercu.useMutation({
    onSuccess: (res, vars) => {
      setLienApercu({
        id: vars.id,
        url: `${urlBaseSite}/s/${slugSite}/preview/${res.jeton}`,
      });
      setCopie(false);
    },
    onError: (e) => setErreur(e.message),
  });

  async function copier(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* silence */
    }
  }

  if (versions.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="h-4 w-4" />
        <span>
          {versions.data?.length ?? 0} version{(versions.data?.length ?? 0) > 1 ? "s" : ""}
          {" "}— les sauvegardes automatiques sont créées au fil de l&apos;édition
        </span>
      </div>

      {erreur && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {!versions.data || versions.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Aucune version pour l&apos;instant. Sauvegardez ou publiez la page pour créer un point de restauration.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {versions.data.map((v) => (
            <li key={v.id} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">
                    v{v.version}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {v.titre}
                  </span>
                  {v.estPubliee && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Publiée
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(v.creeLe).toLocaleString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {v.auteur && (
                    <> · par <span className="font-medium">{v.auteur.name}</span></>
                  )}
                  {v.note && <> · {v.note}</>}
                </p>

                {lienApercu?.id === v.id && (
                  <div className="mt-2 flex gap-2 items-center">
                    <input
                      readOnly
                      value={lienApercu.url}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 rounded-md border border-input bg-muted/30 px-2 py-1 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => copier(lienApercu.url)}
                      className="inline-flex items-center gap-1 rounded-md border border-input bg-white px-2 py-1 text-xs hover:bg-muted transition-colors"
                    >
                      {copie ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <a
                      href={lienApercu.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-input bg-white px-2 py-1 text-xs hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => mutationLien.mutate({ id: v.id })}
                  disabled={mutationLien.isPending}
                  className="inline-flex items-center gap-1 rounded-md border border-input bg-white px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                  title="Aperçu de cette version"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                {confirmRestaurer === v.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => mutationRestaurer.mutate({ id: v.id })}
                      disabled={mutationRestaurer.isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 transition-colors"
                    >
                      {mutationRestaurer.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Confirmer"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRestaurer(null)}
                      className="text-xs text-muted-foreground hover:text-foreground px-2"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setErreur("");
                      setConfirmRestaurer(v.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-input bg-white px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    title="Restaurer cette version"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restaurer
                  </button>
                )}
                {!v.estPubliee && (
                  confirmSupprimer === v.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => mutationSupprimer.mutate({ id: v.id })}
                        disabled={mutationSupprimer.isPending}
                        className="inline-flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                      >
                        Supprimer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmSupprimer(null)}
                        className="text-xs text-muted-foreground hover:text-foreground px-2"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setErreur("");
                        setConfirmSupprimer(v.id);
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
