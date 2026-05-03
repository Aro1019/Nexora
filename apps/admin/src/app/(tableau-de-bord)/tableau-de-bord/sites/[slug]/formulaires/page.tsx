"use client";

/**
 * Liste des formulaires d'un site avec compteur de soumissions.
 * Permet de créer, ouvrir l'éditeur ou supprimer.
 */
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Inbox,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PageListeFormulaires() {
  const params = useParams<{ slug: string }>();
  const [erreur, setErreur] = useState("");

  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const { data: formulaires, isLoading } = trpc.formulaires.lister.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );

  const utils = trpc.useUtils();
  const mutationSupprimer = trpc.formulaires.supprimer.useMutation({
    onSuccess: () => {
      if (site?.id) utils.formulaires.lister.invalidate({ idSite: site.id });
    },
    onError: (err) => setErreur(err.message),
  });

  const peutModifier = ["PROPRIETAIRE", "ADMINISTRATEUR", "EDITEUR"].includes(
    site?.roleCourant ?? "LECTEUR"
  );

  function gererSupprimer(id: string, nom: string) {
    if (!site?.id) return;
    if (!confirm(`Supprimer le formulaire « ${nom} » et toutes ses soumissions ?`)) return;
    mutationSupprimer.mutate({ id, idSite: site.id });
  }

  return (
    <div>
      <Link
        href={`/tableau-de-bord/sites/${params.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au site
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formulaires</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez des formulaires de contact, d&apos;inscription ou de devis pour votre site.
          </p>
        </div>
        {peutModifier && (
          <Link
            href={`/tableau-de-bord/sites/${params.slug}/formulaires/nouveau`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau formulaire
          </Link>
        )}
      </div>

      {erreur && (
        <div className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !formulaires || formulaires.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center bg-muted/20">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            Aucun formulaire
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez votre premier formulaire pour collecter des messages depuis vos pages.
          </p>
          {peutModifier && (
            <Link
              href={`/tableau-de-bord/sites/${params.slug}/formulaires/nouveau`}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-nexora-blue/90"
            >
              <Plus className="h-4 w-4" />
              Créer un formulaire
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {formulaires.map((f) => (
            <li
              key={f.id}
              className="group rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/tableau-de-bord/sites/${params.slug}/formulaires/${f.id}`}
                    className="block"
                  >
                    <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {f.nom}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Slug : <code className="bg-muted/50 px-1 rounded">{f.slug}</code>
                    </p>
                  </Link>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Inbox className="h-3.5 w-3.5" />
                      {f._count.soumissions} soumission
                      {f._count.soumissions !== 1 ? "s" : ""}
                    </span>
                    <Link
                      href={`/tableau-de-bord/sites/${params.slug}/formulaires/${f.id}/soumissions`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Voir
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                {peutModifier && (
                  <button
                    type="button"
                    onClick={() => gererSupprimer(f.id, f.nom)}
                    aria-label="Supprimer"
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
