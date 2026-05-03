/**
 * Disposition pour les pages d'authentification.
 * Fond immersif avec gradient animé, particules flottantes et glassmorphism.
 */
import { LogoNexora } from "@/composants/logo-nexora";

export default function DispositionAuthentification({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* ── Fond gradient animé ── */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: "linear-gradient(135deg, #06182E 0%, #0D2B4A 25%, #185FA5 50%, #0D2B4A 75%, #06182E 100%)",
          backgroundSize: "400% 400%",
        }}
      />

      {/* ── Couche de bruit subtil ── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Orbes lumineuses ── */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-nexora-blue/20 blur-[100px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-sky/15 blur-[80px] animate-glow-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-2/3 left-1/2 w-64 h-64 rounded-full bg-teal/10 blur-[60px] animate-glow-pulse" style={{ animationDelay: "4s" }} />

      {/* ── Particules flottantes ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Grandes particules */}
        <div className="absolute top-[10%] left-[15%] w-2 h-2 rounded-full bg-frost/30 animate-float" />
        <div className="absolute top-[20%] right-[20%] w-1.5 h-1.5 rounded-full bg-sky/40 animate-float-delayed" />
        <div className="absolute top-[50%] left-[10%] w-1 h-1 rounded-full bg-teal/30 animate-float-slow" />
        <div className="absolute bottom-[30%] right-[15%] w-2.5 h-2.5 rounded-full bg-frost/20 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[70%] left-[60%] w-1.5 h-1.5 rounded-full bg-sky/25 animate-float-delayed" />
        <div className="absolute top-[15%] right-[40%] w-1 h-1 rounded-full bg-white/20 animate-float-slow" />
        <div className="absolute bottom-[15%] left-[35%] w-2 h-2 rounded-full bg-frost/15 animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-[40%] right-[10%] w-1 h-1 rounded-full bg-teal/20 animate-float-delayed" style={{ animationDelay: "1.5s" }} />

        {/* Lignes orbitales subtiles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-[500px] h-[500px] rounded-full border border-white/[0.03] animate-orbit" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-[700px] h-[700px] rounded-full border border-white/[0.02] animate-orbit-reverse" />
        </div>
      </div>

      {/* ── Panneau gauche — Branding immersif (desktop) ── */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-16">
        <div className="relative z-10 max-w-lg animate-fade-in">
          {/* Logo animé */}
          <div className="flex items-center gap-4 mb-8 animate-scale-in">
            <LogoNexora
              taille={72}
              avecHalo
              avecTexte
              couleurTexte="text-white"
              classeTexte="text-4xl font-bold tracking-tight"
              prioritaire
            />
          </div>

          <p className="text-xl text-frost/90 leading-relaxed font-light animate-slide-up">
            La plateforme CMS nouvelle génération pour créer des sites web extraordinaires.
          </p>

          <p className="mt-4 text-frost/60 leading-relaxed animate-slide-up-delayed">
            Conception visuelle, publication instantanée, collaboration en temps réel.
          </p>

          {/* Badges fonctionnalités */}
          <div className="mt-10 flex flex-wrap gap-3 animate-slide-up-delayed-2">
            {["Drag & Drop", "Multi-sites", "SEO intégré", "Rapide"].map((fonctionnalite) => (
              <span
                key={fonctionnalite}
                className="glass-card-dark rounded-full px-4 py-1.5 text-sm text-frost/80 font-medium"
              >
                {fonctionnalite}
              </span>
            ))}
          </div>

          {/* Statistiques */}
          <div className="mt-12 grid grid-cols-3 gap-6 animate-fade-in-delayed">
            {[
              { valeur: "99.9%", libelle: "Disponibilité" },
              { valeur: "<1s", libelle: "Temps de charge" },
              { valeur: "∞", libelle: "Possibilités" },
            ].map((stat) => (
              <div key={stat.libelle} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.valeur}</div>
                <div className="text-xs text-frost/50 mt-1">{stat.libelle}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit — Formulaire ── */}
      <div className="relative flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-scale-in">
          {/* Carte glassmorphism */}
          <div className="glass-card glow-blue rounded-2xl p-8 lg:p-10">
            {children}
          </div>

          {/* Footer discret */}
          <p className="mt-6 text-center text-xs text-frost/40 animate-fade-in-delayed">
            © 2026 Nexora. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
