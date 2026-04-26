"use client";

/**
 * Page de gestion des médias d'un site.
 * Grille de fichiers avec upload, filtres et suppression.
 */
import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  Trash2,
  Loader2,
  X,
  Info,
  FolderOpen,
} from "lucide-react";
import { cn } from "@nexora/ui";
import { trpc } from "@/lib/trpc";

/** Icône selon le type MIME */
function iconeParType(typeMime: string) {
  if (typeMime.startsWith("image/")) return ImageIcon;
  if (typeMime.startsWith("video/")) return Film;
  if (typeMime.startsWith("audio/")) return Music;
  return FileText;
}

/** Formater la taille de fichier */
function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Filtres par catégorie */
const FILTRES = [
  { valeur: undefined, libelle: "Tous" },
  { valeur: "image/", libelle: "Images" },
  { valeur: "video/", libelle: "Vidéos" },
  { valeur: "audio/", libelle: "Audio" },
  { valeur: "application/pdf", libelle: "PDF" },
] as const;

export default function PageMedias() {
  const params = useParams<{ slug: string }>();
  const refInput = useRef<HTMLInputElement>(null);
  const [filtreType, setFiltreType] = useState<string | undefined>();
  const [mediaSelectionne, setMediaSelectionne] = useState<string | null>(null);
  const [uploadsEnCours, setUploadsEnCours] = useState<string[]>([]);

  /* Récupérer le site */
  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  /* Récupérer les médias */
  const { data: resultat, isLoading } = trpc.medias.lister.useQuery(
    { idSite: site?.id ?? "", limite: 100, typeMime: filtreType },
    { enabled: !!site?.id }
  );

  /* Compter les médias */
  const { data: stats } = trpc.medias.compter.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );

  const utils = trpc.useUtils();

  /* Mutations */
  const mutationDemanderUpload = trpc.medias.demanderUpload.useMutation();
  const mutationConfirmerUpload = trpc.medias.confirmerUpload.useMutation({
    onSuccess: () => {
      utils.medias.lister.invalidate();
      utils.medias.compter.invalidate();
      utils.sites.obtenir.invalidate({ slug: params.slug });
    },
  });
  const mutationSupprimer = trpc.medias.supprimer.useMutation({
    onSuccess: () => {
      utils.medias.lister.invalidate();
      utils.medias.compter.invalidate();
      utils.sites.obtenir.invalidate({ slug: params.slug });
      setMediaSelectionne(null);
    },
  });

  /* Tous les médias */
  const medias = resultat?.medias ?? [];

  /* Média sélectionné */
  const detailMedia = mediaSelectionne
    ? medias.find((m) => m.id === mediaSelectionne)
    : null;

  const roleCourant = site?.roleCourant ?? "LECTEUR";
  const peutUploader = ["PROPRIETAIRE", "ADMINISTRATEUR", "EDITEUR"].includes(roleCourant);
  const peutSupprimer = ["PROPRIETAIRE", "ADMINISTRATEUR"].includes(roleCourant);

  /**
   * Gérer la sélection de fichiers et l'upload via URL présignée.
   */
  const gererUpload = useCallback(
    async (fichiers: FileList) => {
      if (!site?.id) return;

      for (const fichier of Array.from(fichiers)) {
        const nomTemp = fichier.name;
        setUploadsEnCours((prev) => [...prev, nomTemp]);

        try {
          /* 1. Demander l'URL présignée */
          const { urlUpload, urlPublique } = await mutationDemanderUpload.mutateAsync({
            idSite: site.id,
            nomFichier: fichier.name,
            typeMime: fichier.type,
            taille: fichier.size,
          });

          /* 2. Envoyer le fichier directement vers MinIO */
          await fetch(urlUpload, {
            method: "PUT",
            body: fichier,
            headers: { "Content-Type": fichier.type },
          });

          /* 3. Confirmer l'upload en base */
          await mutationConfirmerUpload.mutateAsync({
            idSite: site.id,
            nomFichier: fichier.name,
            url: urlPublique,
            typeMime: fichier.type,
            taille: fichier.size,
          });
        } catch {
          /* Erreur silencieuse — le fichier sera ignoré */
        } finally {
          setUploadsEnCours((prev) => prev.filter((n) => n !== nomTemp));
        }
      }
    },
    [site?.id, mutationDemanderUpload, mutationConfirmerUpload]
  );

  /** Gérer le drop de fichiers */
  const [enSurvol, setEnSurvol] = useState(false);

  return (
    <div className="flex h-full">
      {/* ==================== Panneau principal ==================== */}
      <div className={cn("flex-1 min-w-0", detailMedia && "pr-0 lg:pr-80")}>
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
            <h1 className="text-2xl font-bold text-midnight">Médias</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats?.total ?? 0} fichier{(stats?.total ?? 0) > 1 ? "s" : ""}
              {stats?.tailleTotal ? ` · ${formaterTaille(stats.tailleTotal)}` : ""}
            </p>
          </div>
          {peutUploader && (
            <>
              <input
                ref={refInput}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) gererUpload(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => refInput.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Uploader
              </button>
            </>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-1 rounded-md border border-input bg-white p-1 mb-6 w-fit">
          {FILTRES.map((f) => (
            <button
              key={f.libelle}
              type="button"
              onClick={() => setFiltreType(f.valeur)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                filtreType === f.valeur
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.libelle}
            </button>
          ))}
        </div>

        {/* Uploads en cours */}
        {uploadsEnCours.length > 0 && (
          <div className="mb-4 space-y-2">
            {uploadsEnCours.map((nom) => (
              <div
                key={nom}
                className="flex items-center gap-2 rounded-md bg-frost/30 px-3 py-2 text-sm text-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin text-nexora-blue" />
                Upload de {nom}…
              </div>
            ))}
          </div>
        )}

        {/* Chargement */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : medias.length === 0 ? (
          /* Zone de drop / État vide */
          <div
            className={cn(
              "rounded-lg border-2 border-dashed p-12 text-center transition-colors",
              enSurvol ? "border-primary bg-primary/5" : "border-border"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setEnSurvol(true);
            }}
            onDragLeave={() => setEnSurvol(false)}
            onDrop={(e) => {
              e.preventDefault();
              setEnSurvol(false);
              if (peutUploader && e.dataTransfer.files.length > 0) {
                gererUpload(e.dataTransfer.files);
              }
            }}
          >
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-sm font-semibold text-foreground">
              Aucun média
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Glissez des fichiers ici ou cliquez sur « Uploader ».
            </p>
          </div>
        ) : (
          /* ==================== Grille de médias ==================== */
          <>
            <div
              className={cn(
                "grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
                enSurvol && "ring-2 ring-primary rounded-lg"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setEnSurvol(true);
              }}
              onDragLeave={() => setEnSurvol(false)}
              onDrop={(e) => {
                e.preventDefault();
                setEnSurvol(false);
                if (peutUploader && e.dataTransfer.files.length > 0) {
                  gererUpload(e.dataTransfer.files);
                }
              }}
            >
              {medias.map((media) => {
                const estImage = media.typeMime.startsWith("image/");
                const IconeFichier = iconeParType(media.typeMime);
                const estSelectionne = mediaSelectionne === media.id;

                return (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() =>
                      setMediaSelectionne(estSelectionne ? null : media.id)
                    }
                    className={cn(
                      "group relative aspect-square rounded-lg border overflow-hidden transition-all text-left",
                      estSelectionne
                        ? "border-primary ring-2 ring-primary"
                        : "border-border hover:border-ring"
                    )}
                  >
                    {estImage ? (
                      <img
                        src={media.url}
                        alt={media.texteAlternatif || media.nomFichier}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-muted/30 p-3">
                        <IconeFichier className="h-8 w-8 text-muted-foreground" />
                        <span className="mt-2 text-xs text-muted-foreground text-center truncate w-full">
                          {media.nomFichier}
                        </span>
                      </div>
                    )}

                    {/* Overlay au hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">
                        {media.nomFichier}
                      </p>
                      <p className="text-[10px] text-white/70">
                        {formaterTaille(media.taille)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ==================== Panneau détail (sidebar droite) ==================== */}
      {detailMedia && (
        <div className="fixed right-0 top-0 bottom-0 w-80 border-l border-border bg-card p-6 overflow-y-auto z-40 lg:relative lg:top-auto lg:bottom-auto lg:z-auto">
          {/* Fermer */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Détails
            </h3>
            <button
              type="button"
              onClick={() => setMediaSelectionne(null)}
              className="rounded-sm p-1 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Aperçu */}
          {detailMedia.typeMime.startsWith("image/") ? (
            <img
              src={detailMedia.url}
              alt={detailMedia.texteAlternatif || detailMedia.nomFichier}
              className="w-full rounded-md border border-border mb-4"
            />
          ) : (
            <div className="flex items-center justify-center h-32 rounded-md bg-muted/30 mb-4">
              {(() => {
                const Icone = iconeParType(detailMedia.typeMime);
                return <Icone className="h-10 w-10 text-muted-foreground" />;
              })()}
            </div>
          )}

          {/* Infos */}
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Nom du fichier</dt>
              <dd className="text-foreground font-medium break-all">
                {detailMedia.nomFichier}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Type</dt>
              <dd className="text-foreground">{detailMedia.typeMime}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Taille</dt>
              <dd className="text-foreground">
                {formaterTaille(detailMedia.taille)}
              </dd>
            </div>
            {detailMedia.largeur && detailMedia.hauteur && (
              <div>
                <dt className="text-muted-foreground text-xs">Dimensions</dt>
                <dd className="text-foreground">
                  {detailMedia.largeur} × {detailMedia.hauteur}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground text-xs">Uploadé le</dt>
              <dd className="text-foreground">
                {new Date(detailMedia.creeLe).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">URL</dt>
              <dd>
                <input
                  type="text"
                  readOnly
                  value={detailMedia.url}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full rounded-md border border-input bg-muted/30 px-2 py-1 text-xs text-muted-foreground"
                />
              </dd>
            </div>
          </dl>

          {/* Actions */}
          {peutSupprimer && (
            <button
              type="button"
              onClick={() => {
                if (!site?.id) return;
                if (confirm(`Supprimer « ${detailMedia.nomFichier} » ?`)) {
                  mutationSupprimer.mutate({
                    id: detailMedia.id,
                    idSite: site.id,
                  });
                }
              }}
              disabled={mutationSupprimer.isPending}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
