"use client";

/**
 * Liste des soumissions d'un formulaire avec lecture rapide.
 */
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Mail,
  MailOpen,
  Trash2,
  Inbox,
} from "lucide-react";
import { cn } from "@nexora/ui";
import { trpc } from "@/lib/trpc";

export default function PageSoumissions() {
  const params = useParams<{ slug: string; idFormulaire: string }>();
  const [seulementNonLues, setSeulementNonLues] = useState(false);
  const [soumissionOuverte, setSoumissionOuverte] = useState<string | null>(
    null
  );

  const { data: formulaire } = trpc.formulaires.obtenir.useQuery(
    { id: params.idFormulaire },
    { enabled: !!params.idFormulaire }
  );

  const { data: soumissions, isLoading } =
    trpc.formulaires.listerSoumissions.useQuery(
      { idFormulaire: params.idFormulaire, seulementNonLues },
      { enabled: !!params.idFormulaire }
    );

  const utils = trpc.useUtils();
  const mutationMarquer = trpc.formulaires.marquerLue.useMutation({
    onSuccess: () => {
      utils.formulaires.listerSoumissions.invalidate({
        idFormulaire: params.idFormulaire,
      });
      utils.formulaires.obtenir.invalidate({ id: params.idFormulaire });
    },
  });
  const mutationSupprimer = trpc.formulaires.supprimerSoumission.useMutation({
    onSuccess: () => {
      utils.formulaires.listerSoumissions.invalidate({
        idFormulaire: params.idFormulaire,
      });
      utils.formulaires.obtenir.invalidate({ id: params.idFormulaire });
    },
  });

  function basculerOuverture(id: string, estLu: boolean) {
    setSoumissionOuverte(soumissionOuverte === id ? null : id);
    if (!estLu) mutationMarquer.mutate({ id, estLu: true });
  }

  return (
    <div>
      <Link
        href={`/tableau-de-bord/sites/${params.slug}/formulaires/${params.idFormulaire}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;éditeur
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Soumissions
            {formulaire ? (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                — {formulaire.nom}
              </span>
            ) : null}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Messages reçus via ce formulaire.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={seulementNonLues}
            onChange={(e) => setSeulementNonLues(e.target.checked)}
          />
          Afficher uniquement les non lues
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !soumissions || soumissions.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center bg-muted/20">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune soumission pour le moment.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {soumissions.map((s) => {
            const ouvert = soumissionOuverte === s.id;
            const donnees = s.donnees as Record<string, unknown>;
            return (
              <li
                key={s.id}
                className={cn(
                  "rounded-lg border bg-card overflow-hidden transition-all",
                  s.estLu ? "border-border" : "border-primary/40 bg-primary/5"
                )}
              >
                <button
                  type="button"
                  onClick={() => basculerOuverture(s.id, s.estLu)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {s.estLu ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm truncate",
                          s.estLu ? "text-foreground" : "font-semibold text-foreground"
                        )}
                      >
                        {(donnees.email as string) ??
                          (donnees.nom as string) ??
                          (donnees.name as string) ??
                          "Soumission"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(s.creeLe)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {ouvert ? "Réduire" : "Ouvrir"}
                  </span>
                </button>

                {ouvert && (
                  <div className="border-t border-border px-4 py-3 bg-background">
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {Object.entries(donnees).map(([cle, val]) => (
                        <div key={cle}>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {cle}
                          </dt>
                          <dd className="mt-0.5 text-sm text-foreground whitespace-pre-wrap break-words">
                            {typeof val === "boolean"
                              ? val
                                ? "✓ Oui"
                                : "✗ Non"
                              : String(val ?? "—")}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          mutationMarquer.mutate({
                            id: s.id,
                            estLu: !s.estLu,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        Marquer comme {s.estLu ? "non lue" : "lue"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Supprimer cette soumission ?")) {
                            mutationSupprimer.mutate({ id: s.id });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
