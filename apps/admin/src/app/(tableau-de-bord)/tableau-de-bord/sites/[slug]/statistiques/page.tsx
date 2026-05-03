"use client";

/**
 * Page Statistiques d'un site.
 * Affiche les vues, visiteurs uniques, top pages, top référents,
 * répartition appareil et pays sur une période choisie.
 */
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Eye,
  Users,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type Periode = 7 | 30 | 90;

const PERIODES: { valeur: Periode; libelle: string }[] = [
  { valeur: 7, libelle: "7 jours" },
  { valeur: 30, libelle: "30 jours" },
  { valeur: 90, libelle: "90 jours" },
];

export default function PageStatistiques() {
  const params = useParams<{ slug: string }>();
  const [jours, setJours] = useState<Periode>(30);

  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const idSite = site?.id ?? "";
  const requete = { idSite, jours } as const;

  const ensemble = trpc.analytics.vueEnsemble.useQuery(requete, {
    enabled: !!idSite,
  });
  const topChemins = trpc.analytics.topChemins.useQuery(
    { ...requete, limite: 10 },
    { enabled: !!idSite }
  );
  const topReferents = trpc.analytics.topReferents.useQuery(
    { ...requete, limite: 10 },
    { enabled: !!idSite }
  );
  const parAppareil = trpc.analytics.parAppareil.useQuery(requete, {
    enabled: !!idSite,
  });
  const parPays = trpc.analytics.parPays.useQuery(
    { ...requete, limite: 10 },
    { enabled: !!idSite }
  );

  /* Calcul de la valeur max pour les sparklines */
  const maxSerie = useMemo(() => {
    if (!ensemble.data) return 0;
    return Math.max(1, ...ensemble.data.serie.map((s) => s.vues));
  }, [ensemble.data]);

  if (!site) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/tableau-de-bord/sites/${params.slug}`}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-midnight flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Statistiques
            </h1>
            <p className="text-sm text-muted-foreground">
              Analytique sans cookies — conforme RGPD
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-md border border-input bg-white p-0.5">
          {PERIODES.map((p) => (
            <button
              key={p.valeur}
              type="button"
              onClick={() => setJours(p.valeur)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                jours === p.valeur
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.libelle}
            </button>
          ))}
        </div>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Carte
          icone={<Eye className="h-5 w-5" />}
          libelle="Vues"
          valeur={ensemble.data?.vues ?? 0}
          chargement={ensemble.isLoading}
        />
        <Carte
          icone={<Users className="h-5 w-5" />}
          libelle="Visiteurs uniques"
          valeur={ensemble.data?.visiteurs ?? 0}
          chargement={ensemble.isLoading}
        />
      </div>

      {/* Série quotidienne */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Vues par jour
        </h2>
        {ensemble.isLoading ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !ensemble.data || ensemble.data.serie.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Aucune donnée pour cette période.
          </div>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {ensemble.data.serie.map((s) => (
              <div
                key={s.jour}
                className="flex-1 group relative"
                title={`${s.jour} : ${s.vues} vues, ${s.visiteurs} visiteurs`}
              >
                <div
                  className="w-full bg-primary/70 group-hover:bg-primary rounded-t transition-colors"
                  style={{
                    height: `${Math.max(2, (s.vues / maxSerie) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top chemins + référents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <CarteListe
          titre="Pages les plus consultées"
          chargement={topChemins.isLoading}
          items={
            topChemins.data?.map((t) => ({
              libelle: t.chemin,
              valeur: t.vues,
              mono: true,
            })) ?? []
          }
        />
        <CarteListe
          titre="Sources de trafic"
          chargement={topReferents.isLoading}
          items={
            topReferents.data?.map((t) => ({
              libelle: t.referent,
              valeur: t.vues,
            })) ?? []
          }
        />
      </div>

      {/* Appareil + pays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Appareils
          </h2>
          {parAppareil.isLoading ? (
            <div className="h-24 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !parAppareil.data || parAppareil.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée.</p>
          ) : (
            <div className="space-y-2">
              {parAppareil.data.map((a) => (
                <div key={a.typeAppareil} className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {a.typeAppareil === "mobile" ? (
                      <Smartphone className="h-4 w-4" />
                    ) : a.typeAppareil === "tablette" ? (
                      <Tablet className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                  </span>
                  <span className="flex-1 text-sm capitalize text-foreground">
                    {a.typeAppareil}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {a.vues}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <CarteListe
          titre="Pays"
          chargement={parPays.isLoading}
          items={
            parPays.data?.map((p) => ({
              libelle: p.pays,
              valeur: p.vues,
              mono: true,
            })) ?? []
          }
          videLibelle="Aucune donnée pays (pas de proxy géo configuré)."
        />
      </div>
    </div>
  );
}

/* ──────────── Sous-composants ──────────── */

function Carte({
  icone,
  libelle,
  valeur,
  chargement,
}: {
  icone: React.ReactNode;
  libelle: string;
  valeur: number;
  chargement: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icone}
        <span className="text-xs uppercase tracking-wide">{libelle}</span>
      </div>
      <p className="text-3xl font-bold text-foreground tabular-nums">
        {chargement ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          valeur.toLocaleString("fr-FR")
        )}
      </p>
    </div>
  );
}

function CarteListe({
  titre,
  items,
  chargement,
  videLibelle = "Aucune donnée.",
}: {
  titre: string;
  items: { libelle: string; valeur: number; mono?: boolean }[];
  chargement: boolean;
  videLibelle?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">{titre}</h2>
      {chargement ? (
        <div className="h-24 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{videLibelle}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={`${item.libelle}-${i}`} className="flex items-center gap-3">
              <span
                className={`flex-1 text-sm text-foreground truncate ${
                  item.mono ? "font-mono" : ""
                }`}
                title={item.libelle}
              >
                {item.libelle}
              </span>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {item.valeur}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
