"use client";

/**
 * Édition d'un formulaire existant.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Inbox } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  BuilderFormulaire,
  type ValeurBuilder,
  type ChampFormulaire,
} from "@/composants/formulaires/builder-formulaire";

function nomVersSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function PageEditerFormulaire() {
  const params = useParams<{ slug: string; idFormulaire: string }>();
  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");
  const [valeur, setValeur] = useState<ValeurBuilder | null>(null);

  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const { data: formulaire, isLoading } = trpc.formulaires.obtenir.useQuery(
    { id: params.idFormulaire },
    { enabled: !!params.idFormulaire }
  );

  const utils = trpc.useUtils();
  const mutationModifier = trpc.formulaires.modifier.useMutation({
    onSuccess: () => {
      if (site?.id) {
        utils.formulaires.lister.invalidate({ idSite: site.id });
        utils.formulaires.obtenir.invalidate({ id: params.idFormulaire });
      }
      setErreur("");
      setMessageSucces("Formulaire sauvegardé !");
      setTimeout(() => setMessageSucces(""), 3000);
    },
    onError: (err) => setErreur(err.message),
  });

  /* Charger les données dans le state local */
  useEffect(() => {
    if (formulaire) {
      setValeur({
        nom: formulaire.nom,
        slug: formulaire.slug,
        champs: (formulaire.champs as unknown as ChampFormulaire[]) ?? [],
        libelleEnvoi: formulaire.libelleEnvoi,
        messageSucces: formulaire.messageSucces,
        emailNotification: formulaire.emailNotification ?? "",
      });
    }
  }, [formulaire]);

  function gererSauvegarde() {
    if (!site?.id || !valeur || !formulaire) return;
    setErreur("");
    mutationModifier.mutate({
      id: formulaire.id,
      idSite: site.id,
      nom: valeur.nom,
      slug: valeur.slug,
      champs: valeur.champs,
      libelleEnvoi: valeur.libelleEnvoi,
      messageSucces: valeur.messageSucces,
      emailNotification: valeur.emailNotification || null,
    });
  }

  if (isLoading || !valeur || !formulaire) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/tableau-de-bord/sites/${params.slug}/formulaires`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux formulaires
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div className="grid gap-3 sm:grid-cols-2 max-w-xl flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Nom
            </label>
            <input
              type="text"
              value={valeur.nom}
              onChange={(e) => setValeur({ ...valeur, nom: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Slug
            </label>
            <input
              type="text"
              value={valeur.slug}
              onChange={(e) =>
                setValeur({ ...valeur, slug: nomVersSlug(e.target.value) })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messageSucces && (
            <span className="text-sm font-medium text-emerald-600">
              {messageSucces}
            </span>
          )}
          <Link
            href={`/tableau-de-bord/sites/${params.slug}/formulaires/${params.idFormulaire}/soumissions`}
            className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Inbox className="h-4 w-4" />
            Soumissions ({formulaire._count.soumissions})
          </Link>
          <button
            type="button"
            onClick={gererSauvegarde}
            disabled={mutationModifier.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 transition-colors"
          >
            {mutationModifier.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder
          </button>
        </div>
      </div>

      {erreur && (
        <div className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <BuilderFormulaire valeur={valeur} surChangement={setValeur} />
    </div>
  );
}
