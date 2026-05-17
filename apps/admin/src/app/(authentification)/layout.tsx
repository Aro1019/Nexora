/**
 * Disposition pour les pages d'authentification.
 * Fond statique sobre (animations retirées pour la performance).
 */
import { LogoNexora } from "@/composants/logo-nexora";

export default function DispositionAuthentification({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Fond gradient statique */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #06182E 0%, #0D2B4A 50%, #185FA5 100%)",
        }}
      />

      {/* Panneau gauche — Branding (desktop) */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-16">
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <LogoNexora
              taille={72}
              avecHalo={false}
              avecTexte
              couleurTexte="text-white"
              classeTexte="text-4xl font-bold tracking-tight"
              prioritaire
            />
          </div>

          <p className="text-xl text-frost/90 leading-relaxed font-light">
            La plateforme CMS nouvelle génération pour créer des sites web extraordinaires.
          </p>

          <p className="mt-4 text-frost/60 leading-relaxed">
            Conception visuelle, publication instantanée, collaboration en temps réel.
          </p>

          {/* Badges fonctionnalités */}
          <div className="mt-10 flex flex-wrap gap-3">
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
          <div className="mt-12 grid grid-cols-3 gap-6">
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

      {/* Panneau droit — Formulaire */}
      <div className="relative flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-[#0D2B4A] p-8 lg:p-10 shadow-2xl ring-1 ring-white/10">
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-frost/40">
            © 2026 Nexora. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
