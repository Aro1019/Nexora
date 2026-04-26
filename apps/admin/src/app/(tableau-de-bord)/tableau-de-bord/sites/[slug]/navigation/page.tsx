"use client";

/**
 * Page de gestion des menus de navigation d'un site.
 * Éditeur visuel pour les menus entête, pied de page et barre latérale.
 */
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  Menu,
  Loader2,
  ExternalLink,
  Link as LinkIcon,
  FileText,
} from "lucide-react";
import { cn } from "@nexora/ui";
import { trpc } from "@/lib/trpc";

/** Emplacements disponibles */
const EMPLACEMENTS = [
  { valeur: "ENTETE" as const, libelle: "En-tête" },
  { valeur: "PIED_DE_PAGE" as const, libelle: "Pied de page" },
  { valeur: "BARRE_LATERALE" as const, libelle: "Barre latérale" },
];

/** Type d'un élément de menu */
interface ElementMenu {
  id: string;
  libelle: string;
  type: "page" | "url" | "categorie";
  idPage?: string;
  url?: string;
  ouvrirNouvelOnglet: boolean;
  enfants?: ElementMenu[];
}

/** Générer un ID unique court */
function genererIdCourt(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function PageNavigations() {
  const params = useParams<{ slug: string }>();
  const [emplacementActif, setEmplacementActif] = useState<"ENTETE" | "PIED_DE_PAGE" | "BARRE_LATERALE">("ENTETE");
  const [elements, setElements] = useState<ElementMenu[]>([]);
  const [libelle, setLibelle] = useState("Menu principal");
  const [elementOuvert, setElementOuvert] = useState<string | null>(null);
  const [messageSucces, setMessageSucces] = useState("");
  const [erreur, setErreur] = useState("");

  /* Formulaire nouvel élément */
  const [nouveauLibelle, setNouveauLibelle] = useState("");
  const [nouveauType, setNouveauType] = useState<"page" | "url">("url");
  const [nouvelleUrl, setNouvelleUrl] = useState("");

  /* Récupérer le site */
  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  /* Récupérer la navigation */
  const { data: navigation, isLoading } = trpc.navigations.obtenir.useQuery(
    { idSite: site?.id ?? "", emplacement: emplacementActif },
    { enabled: !!site?.id }
  );

  /* Récupérer les pages pour le select */
  const { data: pages } = trpc.pages.lister.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );

  const utils = trpc.useUtils();

  /* Mutation sauvegarder */
  const mutationSauvegarder = trpc.navigations.enregistrer.useMutation({
    onSuccess: () => {
      utils.navigations.obtenir.invalidate({ idSite: site?.id ?? "", emplacement: emplacementActif });
      utils.navigations.lister.invalidate({ idSite: site?.id ?? "" });
      setErreur("");
      setMessageSucces("Menu sauvegardé !");
      setTimeout(() => setMessageSucces(""), 3000);
    },
    onError: (err) => setErreur(err.message),
  });

  /* Charger les données quand la navigation change */
  useEffect(() => {
    if (navigation) {
      setLibelle(navigation.libelle);
      setElements((navigation.elements as unknown as ElementMenu[]) ?? []);
    } else {
      setLibelle(emplacementActif === "ENTETE" ? "Menu principal" : emplacementActif === "PIED_DE_PAGE" ? "Pied de page" : "Barre latérale");
      setElements([]);
    }
  }, [navigation, emplacementActif]);

  /** Sauvegarder */
  function gererSauvegarde() {
    if (!site?.id) return;
    setErreur("");
    mutationSauvegarder.mutate({
      idSite: site.id,
      emplacement: emplacementActif,
      libelle,
      elements,
    });
  }

  /** Ajouter un élément */
  function ajouterElement() {
    if (!nouveauLibelle.trim()) return;

    const nouvel: ElementMenu = {
      id: genererIdCourt(),
      libelle: nouveauLibelle,
      type: nouveauType,
      url: nouveauType === "url" ? nouvelleUrl : undefined,
      ouvrirNouvelOnglet: false,
      enfants: [],
    };

    setElements([...elements, nouvel]);
    setNouveauLibelle("");
    setNouvelleUrl("");
  }

  /** Supprimer un élément */
  function supprimerElement(id: string) {
    setElements(elements.filter((e) => e.id !== id));
    if (elementOuvert === id) setElementOuvert(null);
  }

  /** Modifier un élément */
  function modifierElement(id: string, modifications: Partial<ElementMenu>) {
    setElements(
      elements.map((e) => (e.id === id ? { ...e, ...modifications } : e))
    );
  }

  /** Déplacer un élément vers le haut */
  function monter(index: number) {
    if (index === 0) return;
    const copie = [...elements];
    [copie[index - 1], copie[index]] = [copie[index], copie[index - 1]];
    setElements(copie);
  }

  /** Déplacer un élément vers le bas */
  function descendre(index: number) {
    if (index >= elements.length - 1) return;
    const copie = [...elements];
    [copie[index], copie[index + 1]] = [copie[index + 1], copie[index]];
    setElements(copie);
  }

  const roleCourant = site?.roleCourant ?? "LECTEUR";
  const peutModifier = ["PROPRIETAIRE", "ADMINISTRATEUR", "EDITEUR"].includes(roleCourant);

  return (
    <div>
      {/* Retour */}
      <Link
        href={`/tableau-de-bord/sites/${params.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au site
      </Link>

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight">Navigation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configurez les menus de votre site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {messageSucces && (
            <span className="text-sm text-emerald-600 font-medium">{messageSucces}</span>
          )}
          {peutModifier && (
            <button
              type="button"
              onClick={gererSauvegarde}
              disabled={mutationSauvegarder.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 transition-colors"
            >
              {mutationSauvegarder.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      {erreur && (
        <div className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {/* Sélecteur d'emplacement */}
      <div className="flex gap-1 rounded-md border border-input bg-white p-1 mb-6 w-fit">
        {EMPLACEMENTS.map((emp) => (
          <button
            key={emp.valeur}
            type="button"
            onClick={() => setEmplacementActif(emp.valeur)}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-medium transition-colors",
              emplacementActif === emp.valeur
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {emp.libelle}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ==================== Liste des éléments ==================== */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Éléments du menu
            </h3>

            {elements.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                <Menu className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Aucun élément. Ajoutez des liens ci-dessous.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border divide-y divide-border">
                {elements.map((element, index) => (
                  <div key={element.id}>
                    {/* Ligne principale */}
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab" />

                      <button
                        type="button"
                        onClick={() =>
                          setElementOuvert(
                            elementOuvert === element.id ? null : element.id
                          )
                        }
                        className="flex-1 flex items-center gap-2 text-left min-w-0"
                      >
                        {element.type === "url" ? (
                          <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm font-medium text-foreground truncate">
                          {element.libelle}
                        </span>
                        {element.type === "url" && element.url && (
                          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                            {element.url}
                          </span>
                        )}
                        {elementOuvert === element.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                        )}
                      </button>

                      {/* Flèches haut/bas */}
                      <div className="flex flex-col shrink-0">
                        <button
                          type="button"
                          onClick={() => monter(index)}
                          disabled={index === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => descendre(index)}
                          disabled={index === elements.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                        >
                          ▼
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => supprimerElement(element.id)}
                        className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Détails dépliés */}
                    {elementOuvert === element.id && (
                      <div className="px-4 pb-3 pt-1 bg-muted/20 space-y-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Libellé</label>
                          <input
                            type="text"
                            value={element.libelle}
                            onChange={(e) => modifierElement(element.id, { libelle: e.target.value })}
                            className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-sm text-foreground"
                          />
                        </div>
                        {element.type === "url" && (
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">URL</label>
                            <input
                              type="url"
                              value={element.url ?? ""}
                              onChange={(e) => modifierElement(element.id, { url: e.target.value })}
                              className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-sm text-foreground"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            id={`nouvel-onglet-${element.id}`}
                            type="checkbox"
                            checked={element.ouvrirNouvelOnglet}
                            onChange={(e) => modifierElement(element.id, { ouvrirNouvelOnglet: e.target.checked })}
                            className="h-3.5 w-3.5 rounded border-input"
                          />
                          <label htmlFor={`nouvel-onglet-${element.id}`} className="text-xs text-foreground">
                            Ouvrir dans un nouvel onglet
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ==================== Formulaire d'ajout ==================== */}
          {peutModifier && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Ajouter un élément
              </h3>
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                {/* Type */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNouveauType("url")}
                    className={cn(
                      "flex-1 rounded-md border-2 px-3 py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                      nouveauType === "url"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-ring"
                    )}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Lien URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setNouveauType("page")}
                    className={cn(
                      "flex-1 rounded-md border-2 px-3 py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                      nouveauType === "page"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-ring"
                    )}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Page du site
                  </button>
                </div>

                {/* Libellé */}
                <div>
                  <label htmlFor="nouveau-libelle" className="block text-xs text-muted-foreground mb-1">
                    Libellé
                  </label>
                  <input
                    id="nouveau-libelle"
                    type="text"
                    value={nouveauLibelle}
                    onChange={(e) => setNouveauLibelle(e.target.value)}
                    placeholder="Accueil"
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* URL ou sélecteur de page */}
                {nouveauType === "url" ? (
                  <div>
                    <label htmlFor="nouvelle-url" className="block text-xs text-muted-foreground mb-1">
                      URL
                    </label>
                    <input
                      id="nouvelle-url"
                      type="url"
                      value={nouvelleUrl}
                      onChange={(e) => setNouvelleUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="select-page" className="block text-xs text-muted-foreground mb-1">
                      Page
                    </label>
                    <select
                      id="select-page"
                      onChange={(e) => {
                        const page = pages?.find((p) => p.id === e.target.value);
                        if (page) {
                          setNouveauLibelle(page.titre);
                          setNouvelleUrl(page.chemin);
                        }
                      }}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Sélectionner…</option>
                      {pages?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.titre} ({p.chemin})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={ajouterElement}
                  disabled={!nouveauLibelle.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
