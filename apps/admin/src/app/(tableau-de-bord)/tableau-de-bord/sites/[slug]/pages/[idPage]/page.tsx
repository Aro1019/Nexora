"use client";

/**
 * Page d'édition d'une page existante.
 * Permet de modifier le contenu, les métadonnées et de publier.
 */
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Globe,
  Loader2,
  Eye,
  Settings,
  Undo2,
  Languages,
  Copy,
  Tags,
  History,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn, obtenirInfoLangue } from "@nexora/ui";
import { trpc } from "@/lib/trpc";
import { EditeurBlocs } from "@/composants/editeur/editeur-blocs";
import { PanneauApercu } from "@/composants/editeur/panneau-apercu";
import { OngletHistorique } from "@/composants/editeur/onglet-historique";
import type { ContenuPage } from "@/composants/editeur/types";

/** Onglets de l'éditeur */
type Onglet = "contenu" | "taxonomies" | "seo" | "reglages" | "historique";

export default function PageEditionPage() {
  const params = useParams<{ slug: string; idPage: string }>();
  const router = useRouter();

  const [ongletActif, setOngletActif] = useState<Onglet>("contenu");
  const [titre, setTitre] = useState("");
  const [slugPage, setSlugPage] = useState("");
  const [titreMeta, setTitreMeta] = useState("");
  const [descriptionMeta, setDescriptionMeta] = useState("");
  const [extrait, setExtrait] = useState("");
  const [nonIndexe, setNonIndexe] = useState(false);
  const [contenu, setContenu] = useState<ContenuPage>([]);
  const [idsCategories, setIdsCategories] = useState<string[]>([]);
  const [idsEtiquettes, setIdsEtiquettes] = useState<string[]>([]);
  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");
  const [modifie, setModifie] = useState(false);
  const [menuLangueOuvert, setMenuLangueOuvert] = useState(false);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);

  /* Récupérer le site */
  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  /* Récupérer la page */
  const { data: page, isLoading } = trpc.pages.obtenir.useQuery(
    { id: params.idPage, idSite: site?.id ?? "" },
    { enabled: !!site?.id && !!params.idPage }
  );

  const utils = trpc.useUtils();

  /* Remplir le formulaire quand la page est chargée */
  useEffect(() => {
    if (page) {
      setTitre(page.titre);
      setSlugPage(page.slug);
      setTitreMeta(page.titreMeta ?? "");
      setDescriptionMeta(page.descriptionMeta ?? "");
      setExtrait(page.extrait ?? "");
      setNonIndexe(page.nonIndexe);
      /* Charger le contenu de la page (tableau de blocs) */
      const contenuCharge = Array.isArray(page.contenu)
        ? (page.contenu as unknown as ContenuPage)
        : [];
      setContenu(contenuCharge);
      setIdsCategories(page.categoriesPage.map((c) => c.categorie.id));
      setIdsEtiquettes(page.etiquettesPage.map((e) => e.etiquette.id));
    }
  }, [page]);

  /* Catégories et étiquettes disponibles sur le site */
  const { data: categoriesDispo } = trpc.categories.lister.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );
  const { data: etiquettesDispo } = trpc.etiquettes.lister.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );

  /* Mutation sauvegarder (avec option publication intégrée) */
  const mutationModifier = trpc.pages.modifier.useMutation({
    onSuccess: (pageMaj, variables) => {
      /* MAJ optimiste du cache pour éviter un refetch complet */
      if (site?.id) {
        utils.pages.obtenir.setData(
          { id: params.idPage, idSite: site.id },
          (ancien) => (ancien ? { ...ancien, ...pageMaj } : ancien)
        );
        /* Invalidation de la liste en arrière-plan (pas await) */
        utils.pages.lister.invalidate({ idSite: site.id });
      }
      setModifie(false);
      setErreur("");
      setMessageSucces(variables.publierApres ? "Page publiée !" : "Page sauvegardée !");
      setTimeout(() => setMessageSucces(""), 3000);
    },
    onError: (err) => setErreur(err.message),
  });

  /* Conservée pour usages externes (republier sans modifier) */
  const mutationPublier = trpc.pages.publier.useMutation({
    onSuccess: (pageMaj) => {
      if (site?.id) {
        utils.pages.obtenir.setData(
          { id: params.idPage, idSite: site.id },
          (ancien) => (ancien ? { ...ancien, ...pageMaj } : ancien)
        );
        utils.pages.lister.invalidate({ idSite: site.id });
      }
      setModifie(false);
      setErreur("");
      setMessageSucces("Page publiée !");
      setTimeout(() => setMessageSucces(""), 3000);
    },
    onError: (err) => setErreur(err.message),
  });

  /* Mutation dupliquer dans une autre langue */
  const mutationDupliquer = trpc.pages.dupliquerDansLangue.useMutation({
    onSuccess: (nouvellePage) => {
      utils.pages.lister.invalidate({ idSite: site?.id ?? "" });
      setMenuLangueOuvert(false);
      router.push(
        `/tableau-de-bord/sites/${params.slug}/pages/${nouvellePage.id}`
      );
    },
    onError: (err) => setErreur(err.message),
  });

  /** Sauvegarder */
  function gererSauvegarde() {
    if (!site?.id || !page) return;
    setErreur("");
    mutationModifier.mutate({
      id: page.id,
      idSite: site.id,
      titre,
      slug: slugPage,
      contenu,
      titreMeta: titreMeta || null,
      descriptionMeta: descriptionMeta || null,
      extrait: extrait || null,
      nonIndexe,
      idsCategories,
      idsEtiquettes,
    });
  }

  /** Publier (sauvegarde + publication en UN seul aller-retour) */
  function gererPublication() {
    if (!site?.id || !page) return;
    setErreur("");
    mutationModifier.mutate({
      id: page.id,
      idSite: site.id,
      titre,
      slug: slugPage,
      contenu,
      titreMeta: titreMeta || null,
      descriptionMeta: descriptionMeta || null,
      extrait: extrait || null,
      nonIndexe,
      idsCategories,
      idsEtiquettes,
      publierApres: true,
    });
  }

  /** Marquer comme modifié */
  function marquerModifie() {
    if (!modifie) setModifie(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-foreground">Page introuvable</h2>
        <Link
          href={`/tableau-de-bord/sites/${params.slug}/pages`}
          className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux pages
        </Link>
      </div>
    );
  }

  const estBrouillon = page.statut === "BROUILLON";
  const enChargement = mutationModifier.isPending || mutationPublier.isPending;

  return (
    <div>
      {/* ──────── Barre supérieure ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/tableau-de-bord/sites/${params.slug}/pages`}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Retour aux pages"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-midnight truncate max-w-md">
              {page.titre}
            </h1>
            <p className="text-xs text-muted-foreground">{page.chemin}</p>
          </div>
          {/* Badge langue (uniquement si plusieurs langues activées) */}
          {site && site.langues.length > 1 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              title={`Langue : ${obtenirInfoLangue(page.langue).nomNatif}`}
            >
              <span className="text-base leading-none">
                {obtenirInfoLangue(page.langue).drapeau}
              </span>
              <span className="font-mono uppercase">{page.langue}</span>
            </span>
          )}
          {modifie && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Undo2 className="h-3 w-3" />
              Non sauvegardé
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Message succès */}
          {messageSucces && (
            <span className="text-sm text-emerald-600 font-medium animate-pulse">
              {messageSucces}
            </span>
          )}

          {/* Menu : dupliquer dans une autre langue */}
          {site && site.langues.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuLangueOuvert((v) => !v)}
                className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                title="Dupliquer dans une autre langue"
              >
                <Languages className="h-4 w-4" />
                Traduire
              </button>
              {menuLangueOuvert && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuLangueOuvert(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 w-64 rounded-lg border border-border bg-card shadow-xl py-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Dupliquer dans
                    </p>
                    {site.langues
                      .filter((l) => l !== page.langue)
                      .map((l) => {
                        const info = obtenirInfoLangue(l);
                        return (
                          <button
                            key={l}
                            type="button"
                            onClick={() => {
                              if (!site.id) return;
                              mutationDupliquer.mutate({
                                id: page.id,
                                idSite: site.id,
                                langueCible: l,
                              });
                            }}
                            disabled={mutationDupliquer.isPending}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
                          >
                            <span className="text-lg">{info.drapeau}</span>
                            <span className="flex-1">{info.nomNatif}</span>
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        );
                      })}
                    {site.langues.filter((l) => l !== page.langue).length === 0 && (
                      <p className="px-3 py-2 text-xs text-muted-foreground italic">
                        Aucune autre langue activée.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Aperçu + Partage */}
          {site && (
            <PanneauApercu
              idPage={page.id}
              idSite={site.id}
              slugSite={site.slug}
              contenu={contenu}
              titre={titre}
              urlBaseSite={
                process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
              }
            />
          )}

          {/* Bouton sauvegarder */}
          <button
            type="button"
            onClick={gererSauvegarde}
            disabled={enChargement}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {mutationModifier.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder
          </button>

          {/* Bouton publier */}
          <button
            type="button"
            onClick={gererPublication}
            disabled={enChargement}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 transition-colors"
          >
            {mutationPublier.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            {estBrouillon ? "Publier" : "Republier"}
          </button>
        </div>
      </div>

      {erreur && (
        <div className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {/* ──────── Onglets ──────── */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-6 -mb-px">
          {([
            { id: "contenu" as const, libelle: "Contenu", icone: Eye },
            { id: "taxonomies" as const, libelle: "Taxonomies", icone: Tags },
            { id: "seo" as const, libelle: "SEO", icone: Globe },
            { id: "reglages" as const, libelle: "Réglages", icone: Settings },
            { id: "historique" as const, libelle: "Historique", icone: History },
          ]).map((onglet) => {
            const Icone = onglet.icone;
            return (
              <button
                key={onglet.id}
                type="button"
                onClick={() => setOngletActif(onglet.id)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                  ongletActif === onglet.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icone className="h-4 w-4" />
                {onglet.libelle}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ──────── Onglet Contenu ──────── */}
      {ongletActif === "contenu" && (
        <div className="space-y-6">
          {/* Titre */}
          <div>
            <label htmlFor="titre-page" className="block text-sm font-medium text-foreground mb-1.5">
              Titre
            </label>
            <input
              id="titre-page"
              type="text"
              value={titre}
              onChange={(e) => {
                setTitre(e.target.value);
                marquerModifie();
              }}
              className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          {/* Zone de contenu — éditeur de blocs */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Contenu de la page
            </label>
            <EditeurBlocs
              key={page.id}
              contenuInitial={
                Array.isArray(page.contenu)
                  ? (page.contenu as unknown as ContenuPage)
                  : []
              }
              surChangement={(nouveau) => {
                setContenu(nouveau);
                marquerModifie();
              }}
            />
          </div>

          {/* Extrait (pour articles) */}
          {page.typePage === "ARTICLE" && (
            <div>
              <label htmlFor="extrait-page" className="block text-sm font-medium text-foreground mb-1.5">
                Extrait
              </label>
              <textarea
                id="extrait-page"
                value={extrait}
                onChange={(e) => {
                  setExtrait(e.target.value);
                  marquerModifie();
                }}
                rows={3}
                maxLength={500}
                className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
              />
            </div>
          )}

          {/* Historique des versions (repliable) */}
          {page.versions.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setHistoriqueOuvert((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-3 hover:text-primary transition-colors"
                aria-expanded={historiqueOuvert}
              >
                {historiqueOuvert ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Historique des versions
                <span className="ml-1 text-xs text-muted-foreground">
                  ({page.versions.length})
                </span>
              </button>
              {historiqueOuvert && (
                <div className="rounded-lg border border-border divide-y divide-border">
                  {page.versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          v{v.version}
                        </span>
                        {v.note && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            — {v.note}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.creeLe).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ──────── Onglet Taxonomies ──────── */}
      {ongletActif === "taxonomies" && (
        <div className="space-y-8 max-w-2xl">
          {/* Catégories */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Catégories</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Cliquez pour activer/désactiver. Créez de nouvelles catégories depuis la page Taxonomies du site.
            </p>
            {!categoriesDispo || categoriesDispo.length === 0 ? (
              <div className="rounded-md border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Aucune catégorie sur ce site.{" "}
                <Link
                  href={`/tableau-de-bord/sites/${params.slug}/taxonomies`}
                  className="text-primary hover:underline"
                >
                  En créer une
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categoriesDispo.map((cat) => {
                  const actif = idsCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setIdsCategories(
                          actif
                            ? idsCategories.filter((id) => id !== cat.id)
                            : [...idsCategories, cat.id]
                        );
                        marquerModifie();
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        actif
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: cat.couleur ?? "#94a3b8" }}
                      />
                      {cat.nom}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Étiquettes */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Étiquettes</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Mots-clés pour décrire et filtrer cette page.
            </p>
            {!etiquettesDispo || etiquettesDispo.length === 0 ? (
              <div className="rounded-md border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Aucune étiquette sur ce site.{" "}
                <Link
                  href={`/tableau-de-bord/sites/${params.slug}/taxonomies`}
                  className="text-primary hover:underline"
                >
                  En créer une
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {etiquettesDispo.map((et) => {
                  const actif = idsEtiquettes.includes(et.id);
                  return (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => {
                        setIdsEtiquettes(
                          actif
                            ? idsEtiquettes.filter((id) => id !== et.id)
                            : [...idsEtiquettes, et.id]
                        );
                        marquerModifie();
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        actif
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      )}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: et.couleur ?? "#94a3b8" }}
                      />
                      {et.nom}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────── Onglet SEO ──────── */}
      {ongletActif === "seo" && (
        <div className="space-y-6 max-w-xl">
          <div>
            <label htmlFor="titre-meta" className="block text-sm font-medium text-foreground mb-1.5">
              Titre meta
            </label>
            <input
              id="titre-meta"
              type="text"
              value={titreMeta}
              onChange={(e) => {
                setTitreMeta(e.target.value);
                marquerModifie();
              }}
              placeholder={titre}
              maxLength={70}
              className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            <p className="mt-1 text-xs text-muted-foreground">{titreMeta.length}/70</p>
          </div>

          <div>
            <label htmlFor="desc-meta" className="block text-sm font-medium text-foreground mb-1.5">
              Description meta
            </label>
            <textarea
              id="desc-meta"
              value={descriptionMeta}
              onChange={(e) => {
                setDescriptionMeta(e.target.value);
                marquerModifie();
              }}
              placeholder="Description affichée dans les résultats Google"
              maxLength={160}
              rows={3}
              className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">{descriptionMeta.length}/160</p>
          </div>

          {/* Aperçu Google */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Aperçu Google</h3>
            <div className="rounded-md border border-border bg-white p-4">
              <p className="text-base text-blue-700 truncate">
                {titreMeta || titre || "Titre de la page"}
              </p>
              <p className="text-xs text-emerald-700 truncate mt-0.5">
                {site?.domainePersonnalise || `${params.slug}.nexora.app`}{page.chemin}
              </p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {descriptionMeta || "Ajoutez une description meta pour améliorer votre référencement."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ──────── Onglet Réglages ──────── */}
      {ongletActif === "reglages" && (
        <div className="space-y-6 max-w-xl">
          {/* Slug */}
          {page.typePage !== "ACCUEIL" && (
            <div>
              <label htmlFor="slug-page" className="block text-sm font-medium text-foreground mb-1.5">
                Slug (URL)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">
                  /{params.slug}/
                </span>
                <input
                  id="slug-page"
                  type="text"
                  value={slugPage}
                  onChange={(e) => {
                    setSlugPage(e.target.value);
                    marquerModifie();
                  }}
                  className="flex-1 rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              </div>
            </div>
          )}

          {/* Non indexé */}
          <div className="flex items-center gap-3">
            <input
              id="non-indexe"
              type="checkbox"
              checked={nonIndexe}
              onChange={(e) => {
                setNonIndexe(e.target.checked);
                marquerModifie();
              }}
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            <label htmlFor="non-indexe" className="text-sm text-foreground">
              Cacher des moteurs de recherche
              <span className="block text-xs text-muted-foreground">
                Ajoute la balise noindex pour empêcher l&apos;indexation.
              </span>
            </label>
          </div>

          {/* Infos */}
          <div className="rounded-md border border-border bg-muted/30 p-4 text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">Type :</span>{" "}
              <span className="font-medium text-foreground">{page.typePage}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Statut :</span>{" "}
              <span className="font-medium text-foreground">{page.statut}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Créée le :</span>{" "}
              <span className="font-medium text-foreground">
                {new Date(page.creeLe).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
            {page.publieLe && (
              <p>
                <span className="text-muted-foreground">Publiée le :</span>{" "}
                <span className="font-medium text-foreground">
                  {new Date(page.publieLe).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Versions :</span>{" "}
              <span className="font-medium text-foreground">{page.versions.length}</span>
            </p>
          </div>
        </div>
      )}

      {/* ──────── Onglet Historique ──────── */}
      {ongletActif === "historique" && site && (
        <OngletHistorique
          idPage={page.id}
          idSite={site.id}
          slugSite={site.slug}
          urlBaseSite={
            process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
          }
          surRestauration={() => {
            utils.pages.obtenir.invalidate({ id: params.idPage, idSite: site.id });
            setMessageSucces("Version restaurée !");
            setTimeout(() => setMessageSucces(""), 3000);
          }}
        />
      )}
    </div>
  );
}
