"use client";

/**
 * Page de création d'un nouveau site.
 * Formulaire en étapes : type → infos → confirmation.
 * (L'envoi réel sera implémenté avec tRPC en Phase 1.5)
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  BookOpen,
  Briefcase,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@nexora/ui";
import { trpc } from "@/lib/trpc";

/** Types de site disponibles avec icônes */
const TYPES_SITE = [
  {
    valeur: "VITRINE",
    libelle: "Vitrine",
    description: "Site de présentation pour votre entreprise ou projet.",
    icone: Globe,
  },
  {
    valeur: "BLOG",
    libelle: "Blog",
    description: "Publiez des articles et partagez vos connaissances.",
    icone: BookOpen,
  },
  {
    valeur: "PORTFOLIO",
    libelle: "Portfolio",
    description: "Présentez vos travaux et réalisations.",
    icone: Briefcase,
  },
  {
    valeur: "ECOMMERCE",
    libelle: "E-commerce",
    description: "Vendez vos produits en ligne.",
    icone: ShoppingBag,
  },
] as const;

/** Étapes du formulaire */
const ETAPES = ["Type de site", "Informations", "Confirmation"] as const;

export default function PageNouveauSite() {
  const routeur = useRouter();
  const [etape, setEtape] = useState(0);
  const [chargement, setChargement] = useState(false);

  /* Données du formulaire */
  const [typeSite, setTypeSite] = useState("");
  const [nomSite, setNomSite] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [erreur, setErreur] = useState("");

  /** Générer un slug à partir du nom */
  function genererSlug(nom: string): string {
    return nom
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /** Mettre à jour le nom et auto-générer le slug */
  function gererChangementNom(valeur: string) {
    setNomSite(valeur);
    setSlug(genererSlug(valeur));
  }

  /** Avancer à l'étape suivante */
  function etapeSuivante() {
    setErreur("");
    if (etape === 0 && !typeSite) {
      setErreur("Veuillez choisir un type de site.");
      return;
    }
    if (etape === 1) {
      if (!nomSite.trim()) {
        setErreur("Le nom du site est requis.");
        return;
      }
      if (!slug.trim()) {
        setErreur("Le slug est requis.");
        return;
      }
    }
    setEtape((e) => Math.min(e + 1, ETAPES.length - 1));
  }

  /** Reculer à l'étape précédente */
  function etapePrecedente() {
    setErreur("");
    setEtape((e) => Math.max(e - 1, 0));
  }

  /** Soumettre la création */
  const utils = trpc.useUtils();
  const mutationCreer = trpc.sites.creer.useMutation({
    onSuccess: () => {
      utils.sites.lister.invalidate();
      utils.sites.compter.invalidate();
      routeur.push("/tableau-de-bord/sites");
      routeur.refresh();
    },
  });

  async function gererCreation() {
    setErreur("");
    setChargement(true);

    try {
      await mutationCreer.mutateAsync({
        nom: nomSite,
        slug,
        description: description || undefined,
        typeSite: typeSite as "VITRINE" | "BLOG" | "PORTFOLIO" | "ECOMMERCE",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur lors de la création du site.";
      setErreur(message);
    } finally {
      setChargement(false);
    }
  }

  const typeChoisi = TYPES_SITE.find((t) => t.valeur === typeSite);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Retour */}
      <Link
        href="/tableau-de-bord/sites"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux sites
      </Link>

      <h1 className="text-2xl font-bold text-midnight mb-2">
        Créer un nouveau site
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Configurez votre site en quelques étapes simples.
      </p>

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2 mb-8">
        {ETAPES.map((libelle, i) => (
          <div key={libelle} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < etape
                  ? "bg-success text-white"
                  : i === etape
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < etape ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-sm hidden sm:inline",
                i === etape ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {libelle}
            </span>
            {i < ETAPES.length - 1 && (
              <div className="h-px w-8 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Erreur */}
      {erreur && (
        <div className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {/* ==================== Étape 0 : Choix du type ==================== */}
      {etape === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {TYPES_SITE.map((type) => {
            const Icone = type.icone;
            const selectionne = typeSite === type.valeur;
            return (
              <button
                key={type.valeur}
                type="button"
                onClick={() => setTypeSite(type.valeur)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-lg border-2 p-5 text-left transition-all",
                  selectionne
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-sky hover:bg-frost/10"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    selectionne ? "bg-primary text-white" : "bg-frost/40 text-nexora-blue"
                  )}
                >
                  <Icone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{type.libelle}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ==================== Étape 1 : Informations ==================== */}
      {etape === 1 && (
        <div className="space-y-5">
          <div>
            <label
              htmlFor="nom-site"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Nom du site *
            </label>
            <input
              id="nom-site"
              type="text"
              value={nomSite}
              onChange={(e) => gererChangementNom(e.target.value)}
              placeholder="Mon super site"
              className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Slug (URL) *
            </label>
            <div className="flex items-center rounded-md border border-input bg-white focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-colors">
              <span className="pl-3.5 text-sm text-muted-foreground select-none">
                nexora.app/
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="mon-super-site"
                className="flex-1 bg-transparent px-1 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Description (optionnelle)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement votre site..."
              rows={3}
              className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none"
            />
          </div>
        </div>
      )}

      {/* ==================== Étape 2 : Confirmation ==================== */}
      {etape === 2 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Récapitulatif
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Type</dt>
              <dd className="text-sm font-medium text-foreground">
                {typeChoisi?.libelle}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Nom</dt>
              <dd className="text-sm font-medium text-foreground">{nomSite}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">URL</dt>
              <dd className="text-sm font-medium text-accent">
                nexora.app/{slug}
              </dd>
            </div>
            {description && (
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Description</dt>
                <dd className="text-sm text-foreground max-w-xs text-right">
                  {description}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* ==================== Boutons de navigation ==================== */}
      <div className="flex items-center justify-between mt-8">
        {etape > 0 ? (
          <button
            type="button"
            onClick={etapePrecedente}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-transparent px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </button>
        ) : (
          <div />
        )}

        {etape < ETAPES.length - 1 ? (
          <button
            type="button"
            onClick={etapeSuivante}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 transition-colors"
          >
            Suivant
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={gererCreation}
            disabled={chargement}
            className="inline-flex items-center gap-2 rounded-md bg-success px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {chargement ? (
              "Création en cours..."
            ) : (
              <>
                <Check className="h-4 w-4" />
                Créer le site
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
