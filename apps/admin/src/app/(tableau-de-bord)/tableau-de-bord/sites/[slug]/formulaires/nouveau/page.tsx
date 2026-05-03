"use client";

/**
 * Création d'un nouveau formulaire.
 */
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  BuilderFormulaire,
  type ValeurBuilder,
} from "@/composants/formulaires/builder-formulaire";

/** Convertit un nom en slug url-friendly */
function nomVersSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function PageNouveauFormulaire() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  const [valeur, setValeur] = useState<ValeurBuilder>({
    nom: "Formulaire de contact",
    slug: "contact",
    champs: [
      {
        id: "init-1",
        type: "texte",
        libelle: "Nom",
        nom: "nom",
        obligatoire: true,
        placeholder: "Votre nom",
      },
      {
        id: "init-2",
        type: "email",
        libelle: "E-mail",
        nom: "email",
        obligatoire: true,
        placeholder: "vous@exemple.fr",
      },
      {
        id: "init-3",
        type: "zone-texte",
        libelle: "Message",
        nom: "message",
        obligatoire: true,
        placeholder: "Votre message…",
      },
    ],
    libelleEnvoi: "Envoyer",
    messageSucces: "Merci ! Votre message a bien été envoyé.",
    emailNotification: "",
  });

  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const utils = trpc.useUtils();
  const mutationCreer = trpc.formulaires.creer.useMutation({
    onSuccess: (formulaire) => {
      if (site?.id) utils.formulaires.lister.invalidate({ idSite: site.id });
      router.push(
        `/tableau-de-bord/sites/${params.slug}/formulaires/${formulaire.id}`
      );
    },
    onError: (err) => setErreur(err.message),
  });

  function gererCreer() {
    if (!site?.id) return;
    setErreur("");
    mutationCreer.mutate({
      idSite: site.id,
      nom: valeur.nom,
      slug: valeur.slug,
      champs: valeur.champs,
      libelleEnvoi: valeur.libelleEnvoi,
      messageSucces: valeur.messageSucces,
      emailNotification: valeur.emailNotification || null,
    });
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
              Nom du formulaire
            </label>
            <input
              type="text"
              value={valeur.nom}
              onChange={(e) =>
                setValeur({
                  ...valeur,
                  nom: e.target.value,
                  /* Mettre à jour le slug uniquement s'il dérive encore du nom */
                  slug:
                    valeur.slug === "" ||
                    valeur.slug === nomVersSlug(valeur.nom)
                      ? nomVersSlug(e.target.value)
                      : valeur.slug,
                })
              }
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
        <button
          type="button"
          onClick={gererCreer}
          disabled={
            mutationCreer.isPending ||
            !valeur.nom ||
            !valeur.slug ||
            valeur.champs.length === 0
          }
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 transition-colors"
        >
          {mutationCreer.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Créer le formulaire
        </button>
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
