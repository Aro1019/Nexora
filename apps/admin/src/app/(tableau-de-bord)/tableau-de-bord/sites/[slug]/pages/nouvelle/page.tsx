"use client";

/**
 * Page de création d'une nouvelle page pour un site.
 * Formulaire en 2 étapes : infos de base → confirmation.
 */
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Check, Loader2 } from "lucide-react";
import { cn } from "@nexora/ui";
import { trpc } from "@/lib/trpc";

/** Types de page disponibles */
const TYPES_PAGE = [
  {
    valeur: "PAGE" as const,
    libelle: "Page",
    description: "Page statique classique (à propos, contact…)",
  },
  {
    valeur: "ARTICLE" as const,
    libelle: "Article",
    description: "Article de blog avec date de publication",
  },
  {
    valeur: "ACCUEIL" as const,
    libelle: "Accueil",
    description: "Page d'accueil du site (une seule autorisée)",
  },
  {
    valeur: "INDEX_BLOG" as const,
    libelle: "Index blog",
    description: "Page listant automatiquement les articles",
  },
];

export default function PageNouvellePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  /* État du formulaire */
  const [typePage, setTypePage] = useState<"ACCUEIL" | "PAGE" | "ARTICLE" | "INDEX_BLOG">("PAGE");
  const [titre, setTitre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugModifie, setSlugModifie] = useState(false);
  const [titreMeta, setTitreMeta] = useState("");
  const [descriptionMeta, setDescriptionMeta] = useState("");
  const [extrait, setExtrait] = useState("");
  const [erreur, setErreur] = useState("");

  /* Récupérer le site */
  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const utils = trpc.useUtils();

  /* Mutation créer */
  const mutationCreer = trpc.pages.creer.useMutation({
    onSuccess: () => {
      utils.pages.lister.invalidate({ idSite: site?.id ?? "" });
      utils.sites.obtenir.invalidate({ slug: params.slug });
      router.push(`/tableau-de-bord/sites/${params.slug}/pages`);
    },
    onError: (err) => setErreur(err.message),
  });

  /** Génère un slug à partir du titre */
  function genererSlug(texte: string): string {
    return texte
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);
  }

  /** Gère le changement de titre et auto-slug */
  function gererChangementTitre(valeur: string) {
    setTitre(valeur);
    if (!slugModifie) {
      setSlug(genererSlug(valeur));
    }
  }

  /** Soumettre le formulaire */
  function gererSoumission(e: React.FormEvent) {
    e.preventDefault();
    if (!site?.id) return;
    setErreur("");

    const slugFinal = typePage === "ACCUEIL" ? "accueil" : slug;

    mutationCreer.mutate({
      idSite: site.id,
      titre,
      slug: slugFinal,
      typePage,
      titreMeta: titreMeta || undefined,
      descriptionMeta: descriptionMeta || undefined,
      extrait: extrait || undefined,
    });
  }

  const estValide = titre.trim().length >= 1 && (typePage === "ACCUEIL" || slug.trim().length >= 1);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Retour */}
      <Link
        href={`/tableau-de-bord/sites/${params.slug}/pages`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux pages
      </Link>

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-midnight">Nouvelle page</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Créez une nouvelle page pour votre site.
        </p>
      </div>

      {erreur && (
        <div className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <form onSubmit={gererSoumission} className="space-y-8">
        {/* ──────── Type de page ──────── */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Type de page
          </label>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {TYPES_PAGE.map((t) => (
              <button
                key={t.valeur}
                type="button"
                onClick={() => setTypePage(t.valeur)}
                className={cn(
                  "relative flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all",
                  typePage === t.valeur
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-ring"
                )}
              >
                {typePage === t.valeur && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <FileText className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-sm font-semibold text-foreground">
                  {t.libelle}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {t.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ──────── Titre ──────── */}
        <div>
          <label htmlFor="titre" className="block text-sm font-medium text-foreground mb-1.5">
            Titre
          </label>
          <input
            id="titre"
            type="text"
            value={titre}
            onChange={(e) => gererChangementTitre(e.target.value)}
            placeholder="Mon super article"
            required
            className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        {/* ──────── Slug (masqué pour ACCUEIL) ──────── */}
        {typePage !== "ACCUEIL" && (
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-1.5">
              Slug (URL)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">
                /{params.slug}/
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugModifie(true);
                }}
                placeholder="mon-super-article"
                required
                className="flex-1 rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          </div>
        )}

        {/* ──────── Extrait (pour articles) ──────── */}
        {typePage === "ARTICLE" && (
          <div>
            <label htmlFor="extrait" className="block text-sm font-medium text-foreground mb-1.5">
              Extrait
              <span className="ml-1 text-xs text-muted-foreground font-normal">(optionnel)</span>
            </label>
            <textarea
              id="extrait"
              value={extrait}
              onChange={(e) => setExtrait(e.target.value)}
              placeholder="Résumé court de l'article…"
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
            />
          </div>
        )}

        {/* ──────── SEO ──────── */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-foreground select-none">
            Référencement (SEO)
            <span className="ml-1 text-xs text-muted-foreground font-normal">— optionnel</span>
          </summary>
          <div className="mt-4 space-y-4 pl-0">
            <div>
              <label htmlFor="titreMeta" className="block text-sm font-medium text-foreground mb-1.5">
                Titre meta
              </label>
              <input
                id="titreMeta"
                type="text"
                value={titreMeta}
                onChange={(e) => setTitreMeta(e.target.value)}
                placeholder="Titre affiché dans les moteurs de recherche"
                maxLength={70}
                className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
              <p className="mt-1 text-xs text-muted-foreground">{titreMeta.length}/70</p>
            </div>
            <div>
              <label htmlFor="descMeta" className="block text-sm font-medium text-foreground mb-1.5">
                Description meta
              </label>
              <textarea
                id="descMeta"
                value={descriptionMeta}
                onChange={(e) => setDescriptionMeta(e.target.value)}
                placeholder="Description affichée dans les résultats de recherche"
                maxLength={160}
                rows={2}
                className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">{descriptionMeta.length}/160</p>
            </div>
          </div>
        </details>

        {/* ──────── Actions ──────── */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Link
            href={`/tableau-de-bord/sites/${params.slug}/pages`}
            className="rounded-md border border-input bg-transparent px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={!estValide || mutationCreer.isPending}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 transition-colors"
          >
            {mutationCreer.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Création…
              </span>
            ) : (
              "Créer la page"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
