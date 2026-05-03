/**
 * Landing page marketing de Nexora.
 * Server component pur ; les interactions sont isolées dans des composants client.
 */
import Link from "next/link";
import {
  ArrowRight,
  Layout,
  Languages,
  Search,
  BarChart3,
  Webhook,
  History,
  Eye,
  Shield,
  Sparkles,
  Zap,
  Check,
  Github,
} from "lucide-react";
import { FaqAccordeon } from "@/composants/marketing/faq-accordeon";
import { MockupEditeur } from "@/composants/marketing/mockup-editeur";
import { LogoNexora } from "@/composants/logo-nexora";

export const metadata = {
  title: "Nexora — La plateforme CMS moderne pour créer vos sites internet",
  description:
    "Concevez, publiez et faites évoluer vos sites web sans code. Éditeur visuel, multilingue, analytics intégré et collaboration en temps réel.",
};

export default function PageAccueil() {
  return (
    <div className="min-h-screen bg-white-ice text-midnight overflow-hidden">
      <EnTete />
      <Hero />
      <BarreConfiance />
      <Fonctionnalites />
      <CommentCaMarche />
      <Statistiques />
      <Tarifs />
      <Faq />
      <CtaFinal />
      <PiedDePage />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EN-TÊTE
// ─────────────────────────────────────────────────────────────────────

function EnTete() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white-ice/70 border-b border-frost/40">
      <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold tracking-tight text-midnight">Nexora</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-midnight/70">
          <a href="#fonctionnalites" className="hover:text-nexora-blue transition-colors">
            Fonctionnalités
          </a>
          <a href="#comment" className="hover:text-nexora-blue transition-colors">
            Comment ça marche
          </a>
          <a href="#tarifs" className="hover:text-nexora-blue transition-colors">
            Tarifs
          </a>
          <a href="#faq" className="hover:text-nexora-blue transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/connexion"
            className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-midnight hover:text-nexora-blue transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="inline-flex items-center gap-1.5 rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white-ice hover:bg-nexora-blue transition-colors"
          >
            Commencer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-20 pb-32 px-6">
      {/* Fond décoratif */}
      <div className="absolute inset-0 bg-grid-subtle mask-radial pointer-events-none" aria-hidden />
      <div
        className="absolute top-32 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-sky/20 via-frost/40 to-teal/20 blur-3xl -z-10 animate-glow-pulse"
        aria-hidden
      />
      {/* Orbes flottantes */}
      <div
        className="absolute top-40 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-sky/30 to-teal/20 blur-2xl animate-float"
        aria-hidden
      />
      <div
        className="absolute top-60 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-frost/50 to-nexora-blue/20 blur-2xl animate-float-delayed"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center">
        <div className="animate-slide-up">
          {/* Badge Nouveau */}
          <div className="inline-flex items-center gap-2 rounded-full border border-frost bg-white/60 backdrop-blur px-3 py-1 text-xs font-medium text-nexora-blue mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
            </span>
            Nouveau · Versions, webhooks &amp; recherche full-text
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-midnight">
            Créez des sites{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-nexora-blue via-sky to-teal bg-clip-text text-transparent">
                modernes
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 8 Q 50 2, 100 6 T 198 4"
                  stroke="url(#g)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#185FA5" />
                    <stop offset="50%" stopColor="#378ADD" />
                    <stop offset="100%" stopColor="#5DCAA5" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <br />
            sans écrire une ligne de code.
          </h1>

          <p className="mt-6 text-lg md:text-xl text-midnight/70 leading-relaxed max-w-xl animate-slide-up-delayed">
            Nexora est la plateforme CMS qui réunit éditeur visuel, multilingue,
            SEO, analytics et collaboration. Pensée pour les équipes qui veulent
            avancer vite sans sacrifier la qualité.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 animate-slide-up-delayed-2">
            <Link
              href="/inscription"
              className="group inline-flex items-center gap-2 rounded-lg bg-midnight px-6 py-3.5 text-sm font-semibold text-white-ice shadow-lg shadow-midnight/20 hover:bg-nexora-blue hover:shadow-nexora-blue/30 hover:scale-[1.02] transition-all"
            >
              Démarrer gratuitement
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#fonctionnalites"
              className="inline-flex items-center gap-2 rounded-lg border border-frost bg-white/70 backdrop-blur px-6 py-3.5 text-sm font-semibold text-midnight hover:bg-white hover:border-sky transition-all"
            >
              <Eye className="h-4 w-4" />
              Découvrir
            </a>
          </div>

          <p className="mt-6 text-xs text-midnight/50 animate-fade-in-delayed">
            ✓ Sans carte bancaire · ✓ Démarrage en 30 secondes · ✓ Export complet
          </p>
        </div>

        <div className="animate-scale-in">
          <MockupEditeur />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// BARRE DE CONFIANCE
// ─────────────────────────────────────────────────────────────────────

function BarreConfiance() {
  return (
    <section className="py-12 border-y border-frost/40 bg-white/40 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-widest font-semibold text-midnight/40 mb-8">
          Conçu pour les équipes exigeantes
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-midnight/40">
          {[
            { icon: Shield, label: "RGPD compliant" },
            { icon: Zap, label: "Performance native" },
            { icon: Languages, label: "Multilingue" },
            { icon: BarChart3, label: "Analytics intégré" },
          ].map((item) => {
            const Icone = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-center gap-2 hover:text-nexora-blue transition-colors"
              >
                <Icone className="h-5 w-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// FONCTIONNALITÉS
// ─────────────────────────────────────────────────────────────────────

const FONCTIONNALITES = [
  {
    icone: Layout,
    titre: "Éditeur visuel par blocs",
    description:
      "Composez vos pages en glissant titres, images, formulaires, listes d'articles. Tout reste cohérent grâce au design system intégré.",
    teinte: "from-nexora-blue to-sky",
  },
  {
    icone: Languages,
    titre: "Multilingue natif",
    description:
      "Gérez autant de langues que nécessaire avec préfixes d'URL automatiques, duplication entre langues et balises hreflang générées.",
    teinte: "from-sky to-teal",
  },
  {
    icone: Search,
    titre: "SEO &amp; recherche full-text",
    description:
      "Méta-titres, sitemaps, RSS, et recherche Postgres pondérée avec mise en évidence des résultats — tout est prêt.",
    teinte: "from-teal to-nexora-blue",
  },
  {
    icone: BarChart3,
    titre: "Analytics sans cookies",
    description:
      "Pages vues, top contenus, sources de trafic, types d'appareils — sans bannière de consentement, dans le respect de vos visiteurs.",
    teinte: "from-nexora-blue to-teal",
  },
  {
    icone: History,
    titre: "Versions &amp; restauration",
    description:
      "Chaque modification crée un instantané. Comparez, prévisualisez et restaurez n'importe quelle version en un clic.",
    teinte: "from-sky to-nexora-blue",
  },
  {
    icone: Webhook,
    titre: "Webhooks signés",
    description:
      "Connectez Slack, Zapier, votre CRM. Chaque soumission ou publication déclenche un appel HTTP signé HMAC, avec retentatives.",
    teinte: "from-teal to-sky",
  },
];

function Fonctionnalites() {
  return (
    <section id="fonctionnalites" className="py-24 px-6 relative">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-nexora-blue mb-3">
            Fonctionnalités
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-midnight">
            Tout ce qu&apos;il faut pour publier{" "}
            <span className="bg-gradient-to-r from-nexora-blue to-teal bg-clip-text text-transparent">
              avec confiance
            </span>
          </h2>
          <p className="mt-4 text-lg text-midnight/70">
            Une plateforme complète, pas une collection de plug-ins.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FONCTIONNALITES.map((f) => {
            const Icone = f.icone;
            return (
              <div
                key={f.titre}
                className="group relative rounded-2xl border border-frost/60 bg-white/70 backdrop-blur p-6 hover:border-sky hover:shadow-xl hover:shadow-nexora-blue/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.teinte} text-white shadow-lg shadow-nexora-blue/20 mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icone className="h-6 w-6" />
                </div>
                <h3
                  className="text-lg font-bold text-midnight mb-2"
                  dangerouslySetInnerHTML={{ __html: f.titre }}
                />
                <p
                  className="text-sm text-midnight/65 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: f.description }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// COMMENT ÇA MARCHE
// ─────────────────────────────────────────────────────────────────────

function CommentCaMarche() {
  const ETAPES = [
    {
      n: "01",
      titre: "Créez votre site",
      texte:
        "Choisissez un type (vitrine, blog, portfolio), nommez-le, et démarrez avec un design propre prêt à personnaliser.",
    },
    {
      n: "02",
      titre: "Composez vos pages",
      texte:
        "Glissez des blocs, modifiez les couleurs, ajoutez vos contenus. L'aperçu en direct vous montre le résultat en temps réel.",
    },
    {
      n: "03",
      titre: "Publiez et mesurez",
      texte:
        "Un clic pour mettre en ligne. Suivez l'audience, recevez les soumissions de formulaires et itérez en confiance.",
    },
  ];

  return (
    <section
      id="comment"
      className="py-24 px-6 bg-gradient-to-b from-frost/20 via-white-ice to-white-ice"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-nexora-blue mb-3">
            Comment ça marche
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-midnight">
            De l&apos;idée à la publication, en 3 étapes
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Ligne décorative entre étapes */}
          <div
            className="hidden md:block absolute top-12 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-frost via-sky to-frost"
            aria-hidden
          />

          {ETAPES.map((e) => (
            <div key={e.n} className="relative text-center">
              <div className="relative mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-white border-2 border-frost shadow-lg">
                <span className="text-2xl font-bold bg-gradient-to-br from-nexora-blue to-teal bg-clip-text text-transparent">
                  {e.n}
                </span>
              </div>
              <h3 className="text-xl font-bold text-midnight mb-2">{e.titre}</h3>
              <p className="text-sm text-midnight/65 leading-relaxed max-w-xs mx-auto">
                {e.texte}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// STATISTIQUES
// ─────────────────────────────────────────────────────────────────────

function Statistiques() {
  const STATS = [
    { valeur: "< 100ms", label: "Temps de réponse moyen" },
    { valeur: "99,9 %", label: "Disponibilité garantie" },
    { valeur: "0 cookie", label: "Vie privée respectée" },
    { valeur: "30 s", label: "Pour publier votre première page" },
  ];

  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-gradient-to-br from-midnight via-nexora-blue to-midnight p-12 relative overflow-hidden">
          <div
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-teal/20 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-sky/30 blur-3xl"
            aria-hidden
          />

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-white to-frost bg-clip-text text-transparent">
                  {s.valeur}
                </div>
                <p className="mt-2 text-sm text-frost/80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TARIFS
// ─────────────────────────────────────────────────────────────────────

function Tarifs() {
  const PLANS = [
    {
      nom: "Découverte",
      prix: "0",
      suffixe: "€/mois",
      description: "Pour démarrer un projet personnel.",
      cta: "Commencer gratuitement",
      lien: "/inscription",
      features: [
        "1 site",
        "10 pages",
        "Sous-domaine nexora.app",
        "Analytics intégré",
        "Communauté",
      ],
      vedette: false,
    },
    {
      nom: "Pro",
      prix: "19",
      suffixe: "€/mois",
      description: "Pour les créateurs et petites équipes.",
      cta: "Essayer Pro",
      lien: "/inscription",
      features: [
        "5 sites · pages illimitées",
        "Domaine personnalisé",
        "Multilingue",
        "Webhooks &amp; API",
        "Versions illimitées",
        "Support email",
      ],
      vedette: true,
    },
    {
      nom: "Entreprise",
      prix: "Sur devis",
      suffixe: "",
      description: "Pour les grandes équipes et besoins spécifiques.",
      cta: "Nous contacter",
      lien: "mailto:contact@nexora.app",
      features: [
        "Sites illimités",
        "SSO &amp; RBAC avancé",
        "Auto-hébergement possible",
        "SLA 99,99 %",
        "Support dédié",
      ],
      vedette: false,
    },
  ];

  return (
    <section id="tarifs" className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-nexora-blue mb-3">
            Tarifs
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-midnight">
            Simple, transparent, sans surprise
          </h2>
          <p className="mt-4 text-lg text-midnight/70">
            Démarrez gratuitement. Évoluez quand vous êtes prêt.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((p) => (
            <div
              key={p.nom}
              className={`relative rounded-2xl p-8 transition-all hover:-translate-y-1 ${
                p.vedette
                  ? "bg-gradient-to-br from-midnight via-nexora-blue to-midnight text-white shadow-2xl shadow-nexora-blue/30 border border-sky/30 scale-[1.03]"
                  : "bg-white border border-frost/60 shadow-md"
              }`}
            >
              {p.vedette && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-teal px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-midnight shadow-lg">
                  <Sparkles className="h-3 w-3" />
                  Le plus populaire
                </span>
              )}
              <h3
                className={`text-lg font-bold ${p.vedette ? "text-white" : "text-midnight"}`}
              >
                {p.nom}
              </h3>
              <p
                className={`mt-1 text-sm ${p.vedette ? "text-frost/80" : "text-midnight/60"}`}
              >
                {p.description}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${p.vedette ? "text-white" : "text-midnight"}`}
                >
                  {p.prix}
                </span>
                {p.suffixe && (
                  <span
                    className={`text-sm ${p.vedette ? "text-frost/70" : "text-midnight/50"}`}
                  >
                    {p.suffixe}
                  </span>
                )}
              </div>

              <Link
                href={p.lien}
                className={`mt-6 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-all ${
                  p.vedette
                    ? "bg-teal text-midnight hover:bg-white"
                    : "bg-midnight text-white hover:bg-nexora-blue"
                }`}
              >
                {p.cta}
              </Link>

              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      className={`h-4 w-4 mt-0.5 shrink-0 ${p.vedette ? "text-teal" : "text-nexora-blue"}`}
                    />
                    <span
                      className={p.vedette ? "text-frost/90" : "text-midnight/75"}
                      dangerouslySetInnerHTML={{ __html: f }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────

function Faq() {
  return (
    <section id="faq" className="py-24 px-6 bg-gradient-to-b from-white-ice to-frost/20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-nexora-blue mb-3">
            FAQ
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-midnight">
            Vos questions, nos réponses
          </h2>
        </div>
        <FaqAccordeon />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CTA FINAL
// ─────────────────────────────────────────────────────────────────────

function CtaFinal() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="relative rounded-3xl bg-gradient-to-br from-midnight via-nexora-blue to-midnight p-12 md:p-20 text-center overflow-hidden">
          <div
            className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-sky/30 blur-3xl animate-glow-pulse"
            aria-hidden
          />
          <div
            className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-teal/30 blur-3xl animate-glow-pulse"
            aria-hidden
          />

          <div className="relative">
            <Sparkles className="h-10 w-10 text-teal mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Prêt à publier votre prochain site ?
            </h2>
            <p className="text-lg text-frost/80 max-w-xl mx-auto mb-8">
              Démarrage en 30 secondes. Aucune carte bancaire requise. Vous gardez
              toujours le contrôle de vos données.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/inscription"
                className="group inline-flex items-center gap-2 rounded-lg bg-white px-7 py-4 text-sm font-semibold text-midnight hover:bg-teal hover:scale-105 transition-all shadow-2xl"
              >
                Créer mon premier site
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/connexion"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/5 backdrop-blur px-7 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PIED DE PAGE
// ─────────────────────────────────────────────────────────────────────

function PiedDePage() {
  return (
    <footer className="border-t border-frost/40 bg-white-ice py-12 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center mb-3">
              <LogoNexora taille={40} avecTexte />
            </Link>
            <p className="text-sm text-midnight/60 max-w-sm">
              La plateforme CMS moderne pour créer, publier et faire évoluer vos
              sites internet.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-midnight/40 mb-3">
              Produit
            </p>
            <ul className="space-y-2 text-sm text-midnight/70">
              <li>
                <a href="#fonctionnalites" className="hover:text-nexora-blue transition-colors">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a href="#tarifs" className="hover:text-nexora-blue transition-colors">
                  Tarifs
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-nexora-blue transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-midnight/40 mb-3">
              Compte
            </p>
            <ul className="space-y-2 text-sm text-midnight/70">
              <li>
                <Link href="/inscription" className="hover:text-nexora-blue transition-colors">
                  S&apos;inscrire
                </Link>
              </li>
              <li>
                <Link href="/connexion" className="hover:text-nexora-blue transition-colors">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link href="/tableau-de-bord" className="hover:text-nexora-blue transition-colors">
                  Tableau de bord
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-frost/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-midnight/50">
            © {new Date().getFullYear()} Nexora. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="GitHub"
              className="text-midnight/50 hover:text-nexora-blue transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
