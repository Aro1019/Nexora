"use client";

/**
 * Page principale du tableau de bord.
 * Greeting personnalisé temporel, cartes de stats animées avec gradients,
 * actions rapides interactives et état vide encourageant.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Globe,
  FileText,
  Image,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Zap,
  Layers,
  Activity,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { clientAuth } from "@nexora/auth/client";

/** Hook pour animer un compteur de 0 vers la valeur cible */
function useCompteurAnime(valeurCible: number, duree = 1000): number {
  const [valeur, setValeur] = useState(0);

  useEffect(() => {
    if (valeurCible === 0) {
      setValeur(0);
      return;
    }
    let debut: number | null = null;
    let frame: number;

    function animer(timestamp: number) {
      if (debut === null) debut = timestamp;
      const progression = Math.min((timestamp - debut) / duree, 1);
      const eased = 1 - Math.pow(1 - progression, 3); // ease-out cubic
      setValeur(Math.round(eased * valeurCible));
      if (progression < 1) frame = requestAnimationFrame(animer);
    }

    frame = requestAnimationFrame(animer);
    return () => cancelAnimationFrame(frame);
  }, [valeurCible, duree]);

  return valeur;
}

/** Détermine le message de salutation selon l'heure */
function obtenirSalutation(): { message: string; emoji: string } {
  const heure = new Date().getHours();
  if (heure < 6) return { message: "Bonne nuit", emoji: "🌙" };
  if (heure < 12) return { message: "Bonjour", emoji: "☀️" };
  if (heure < 18) return { message: "Bon après-midi", emoji: "✨" };
  return { message: "Bonsoir", emoji: "🌆" };
}

/** Carte de statistique animée */
function CarteStat({
  libelle,
  valeur,
  icone: Icone,
  href,
  gradient,
  delai,
}: {
  libelle: string;
  valeur: number;
  icone: typeof Globe;
  href: string;
  gradient: string;
  delai: number;
}) {
  const valeurAnimee = useCompteurAnime(valeur, 1200);

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm p-6 hover:border-sky/30 hover:shadow-xl hover:shadow-sky/5 hover:-translate-y-1 transition-all duration-500"
      style={{ animation: `slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delai}ms both` }}
    >
      {/* Gradient décoratif au hover */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${gradient} opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500`} />

      {/* Bordure brillante au hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky/0 via-sky/5 to-sky/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${gradient} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
            <Icone className="h-6 w-6 text-white" />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-sky group-hover:translate-x-1 transition-all duration-300" />
        </div>

        <div className="mt-5">
          <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">
            {valeurAnimee}
          </p>
          <p className="mt-1 text-sm text-muted-foreground/80">{libelle}</p>
        </div>
      </div>
    </Link>
  );
}

const ACTIONS_RAPIDES = [
  {
    libelle: "Créer un site",
    description: "Lancez un nouveau projet web en quelques minutes",
    href: "/tableau-de-bord/sites/nouveau",
    icone: Globe,
    gradient: "from-nexora-blue to-sky",
  },
  {
    libelle: "Ajouter une page",
    description: "Composez du contenu riche pour votre audience",
    href: "/tableau-de-bord/pages",
    icone: FileText,
    gradient: "from-sky to-teal",
  },
  {
    libelle: "Importer un média",
    description: "Téléversez images, vidéos et documents",
    href: "/tableau-de-bord/medias",
    icone: Image,
    gradient: "from-teal to-emerald-400",
  },
];

const FONCTIONNALITES_PHARES = [
  { icone: Zap, libelle: "Édition visuelle", description: "Drag & drop intuitif" },
  { icone: Layers, libelle: "Multi-sites", description: "Gérez tous vos projets" },
  { icone: TrendingUp, libelle: "SEO intégré", description: "Optimisé par défaut" },
];

export default function PageTableauDeBord() {
  const { data: stats } = trpc.sites.compter.useQuery();
  const { data: session } = clientAuth.useSession();

  const salutation = obtenirSalutation();
  const prenom = session?.user?.name?.split(" ")[0] ?? "";

  const aDesSites = (stats?.nombreSites ?? 0) > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ==================== Hero / Greeting ==================== */}
      <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card to-frost/30 dark:from-card dark:via-card dark:to-nexora-blue/10 p-6 sm:p-8 lg:p-10 animate-slide-up">
        {/* Orbes décoratives */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-sky/15 blur-3xl animate-glow-pulse" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-teal/10 blur-3xl animate-glow-pulse" style={{ animationDelay: "2s" }} />

        {/* Particules */}
        <div className="absolute top-8 right-1/3 w-1.5 h-1.5 rounded-full bg-sky/40 animate-float" />
        <div className="absolute bottom-12 right-1/4 w-1 h-1 rounded-full bg-teal/40 animate-float-delayed" />
        <div className="absolute top-1/2 right-12 w-1 h-1 rounded-full bg-nexora-blue/30 animate-float-slow" />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky/10 border border-sky/20 px-3 py-1 text-xs font-medium text-sky animate-fade-in">
              <Sparkles className="h-3 w-3" />
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {salutation.message}
              {prenom && <span className="text-sky">, {prenom}</span>}{" "}
              <span className="inline-block animate-float">{salutation.emoji}</span>
            </h1>

            <p className="mt-3 text-base text-muted-foreground max-w-xl leading-relaxed animate-slide-up-delayed">
              {aDesSites
                ? "Voici un aperçu de votre espace de travail. Continuons à construire des choses extraordinaires."
                : "Bienvenue sur Nexora. Lancez votre premier site et commencez à créer dès maintenant."}
            </p>

            {/* Fonctionnalités phares */}
            <div className="mt-6 flex flex-wrap gap-3 animate-slide-up-delayed-2">
              {FONCTIONNALITES_PHARES.map((f) => {
                const Icone = f.icone;
                return (
                  <div
                    key={f.libelle}
                    className="group flex items-center gap-2 rounded-xl border border-border/40 bg-white/60 dark:bg-muted/30 backdrop-blur-sm px-3 py-2 hover:border-sky/30 hover:bg-white dark:hover:bg-muted/50 transition-all duration-300"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky/10 to-nexora-blue/10 group-hover:from-sky/20 group-hover:to-nexora-blue/20 transition-colors">
                      <Icone className="h-3.5 w-3.5 text-sky" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {f.libelle}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 leading-tight">
                        {f.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA principal */}
          <div className="animate-scale-in">
            <Link
              href="/tableau-de-bord/sites/nouveau"
              className="btn-glow group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-nexora-blue to-sky px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-nexora-blue/30"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              Nouveau site
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== Statistiques ==================== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky" />
              Aperçu
            </h2>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Vue d'ensemble de votre espace
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <CarteStat
            libelle="Sites publiés"
            valeur={stats?.nombreSites ?? 0}
            icone={Globe}
            href="/tableau-de-bord/sites"
            gradient="bg-gradient-to-br from-nexora-blue to-sky"
            delai={0}
          />
          <CarteStat
            libelle="Pages créées"
            valeur={stats?.nombrePages ?? 0}
            icone={FileText}
            href="/tableau-de-bord/pages"
            gradient="bg-gradient-to-br from-sky to-teal"
            delai={100}
          />
          <CarteStat
            libelle="Médias importés"
            valeur={stats?.nombreMedias ?? 0}
            icone={Image}
            href="/tableau-de-bord/medias"
            gradient="bg-gradient-to-br from-teal to-emerald-400"
            delai={200}
          />
        </div>
      </section>

      {/* ==================== Actions rapides ==================== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-sky" />
              Actions rapides
            </h2>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Commencez en un clic
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {ACTIONS_RAPIDES.map((action, index) => {
            const Icone = action.icone;
            return (
              <Link
                key={action.libelle}
                href={action.href}
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm p-6 hover:border-sky/30 hover:shadow-xl hover:shadow-sky/5 hover:-translate-y-1 transition-all duration-500"
                style={{ animation: `slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${300 + index * 80}ms both` }}
              >
                {/* Gradient révélé au hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />

                <div className="relative">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500`}>
                    <Icone className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="mt-5 font-semibold text-foreground group-hover:text-sky transition-colors duration-300">
                    {action.libelle}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground/70 leading-relaxed">
                    {action.description}
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-sky opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    Commencer
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ==================== État vide — premier site ==================== */}
      {!aDesSites && (
        <section className="relative overflow-hidden rounded-3xl border-2 border-dashed border-sky/20 bg-gradient-to-br from-frost/20 to-card dark:from-nexora-blue/10 dark:to-card p-10 sm:p-12 text-center animate-scale-in">
          {/* Orbes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-sky/10 blur-3xl animate-glow-pulse" />

          <div className="relative">
            <div className="mx-auto inline-flex relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-nexora-blue to-sky shadow-2xl shadow-nexora-blue/40 animate-float">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-nexora-blue to-sky opacity-30 blur-xl animate-glow-pulse" />
            </div>

            <h3 className="mt-6 text-2xl font-bold text-foreground">
              Créez votre premier site
            </h3>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Choisissez un type de site, personnalisez son apparence et publiez en quelques minutes. C'est ici que tout commence.
            </p>

            <Link
              href="/tableau-de-bord/sites/nouveau"
              className="btn-glow mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexora-blue to-sky px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-nexora-blue/30"
            >
              <Plus className="h-4 w-4" />
              Lancer mon premier site
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
