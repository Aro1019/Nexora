"use client";

/**
 * SelecteurMedia — modale qui liste les médias d'un site et permet
 * d'en choisir un pour insérer son URL dans une propriété de bloc.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Image as IconeImage, Search, X, Upload } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

interface PropsSelecteur {
  ouvert: boolean;
  surFermeture: () => void;
  surSelection: (url: string, alt?: string) => void;
  /** Filtre par préfixe MIME ; "image/" par défaut */
  prefixeMime?: string;
}

export function SelecteurMedia({
  ouvert,
  surFermeture,
  surSelection,
  prefixeMime = "image/",
}: PropsSelecteur) {
  const params = useParams<{ slug?: string }>();
  const [recherche, setRecherche] = useState("");

  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug && ouvert }
  );

  const { data, isLoading } = trpc.medias.lister.useQuery(
    { idSite: site?.id ?? "", typeMime: prefixeMime, limite: 60 },
    { enabled: !!site?.id && ouvert }
  );

  /* Fermeture sur Échap */
  useEffect(() => {
    if (!ouvert) return;
    function gererEchap(e: KeyboardEvent) {
      if (e.key === "Escape") surFermeture();
    }
    window.addEventListener("keydown", gererEchap);
    return () => window.removeEventListener("keydown", gererEchap);
  }, [ouvert, surFermeture]);

  if (!ouvert) return null;

  const medias = (data?.medias ?? []).filter((m) =>
    recherche
      ? m.nomFichier.toLowerCase().includes(recherche.toLowerCase()) ||
        (m.texteAlternatif ?? "").toLowerCase().includes(recherche.toLowerCase())
      : true
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={surFermeture}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky/10 text-sky">
              <IconeImage className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Choisir un média
              </h2>
              <p className="text-xs text-muted-foreground/70">
                {medias.length} {prefixeMime === "image/" ? "image" : "fichier"}
                {medias.length > 1 ? "s" : ""} disponible
                {medias.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={surFermeture}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="border-b border-border/60 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom ou texte alternatif…"
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-sky/40 focus:ring-2 focus:ring-sky/15 transition-all"
            />
          </div>
        </div>

        {/* Grille de médias */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Chargement…
            </p>
          ) : medias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconeImage className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {recherche
                  ? "Aucun média ne correspond à votre recherche."
                  : "Aucun média téléversé pour ce site."}
              </p>
              {!recherche && params.slug && (
                <Link
                  href={`/tableau-de-bord/sites/${params.slug}/medias`}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky text-white px-3 py-1.5 text-xs font-semibold hover:bg-sky/90 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Aller à la médiathèque
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {medias.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    surSelection(m.url, m.texteAlternatif ?? undefined);
                    surFermeture();
                  }}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted/30 hover:border-sky/60 hover:shadow-lg transition-all"
                  title={m.nomFichier}
                >
                  {m.typeMime.startsWith("image/") ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={m.url}
                      alt={m.texteAlternatif ?? m.nomFichier}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <IconeImage className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-medium text-white truncate">
                      {m.nomFichier}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="border-t border-border/60 px-5 py-3 flex items-center justify-between">
          {params.slug ? (
            <Link
              href={`/tableau-de-bord/sites/${params.slug}/medias`}
              className="text-xs text-muted-foreground hover:text-sky transition-colors inline-flex items-center gap-1"
            >
              <Upload className="h-3 w-3" />
              Téléverser dans la médiathèque
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={surFermeture}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
