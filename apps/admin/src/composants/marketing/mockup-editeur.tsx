/**
 * Maquette stylisée de l'éditeur Nexora — purement décorative,
 * affichée dans le hero pour donner envie.
 */
import {
  Type,
  Image as ImageIcon,
  Layout,
  ListOrdered,
  Sparkles,
  Eye,
  GripVertical,
} from "lucide-react";

export function MockupEditeur() {
  return (
    <div className="relative">
      {/* Halo lumineux derrière */}
      <div
        className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-br from-sky/30 via-frost/40 to-teal/20 blur-3xl opacity-70 animate-glow-pulse"
        aria-hidden
      />

      {/* Fenêtre */}
      <div className="relative rounded-2xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(6,24,46,0.35)] overflow-hidden">
        {/* Barre de fenêtre */}
        <div className="flex items-center gap-2 border-b border-frost/40 bg-gradient-to-r from-white-ice to-frost/20 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <div className="ml-3 flex items-center gap-1.5 rounded-md bg-white/70 px-3 py-1 text-[11px] text-midnight/60 font-mono">
            <span className="text-teal">●</span>
            mon-site.nexora.app
          </div>
          <div className="ml-auto flex items-center gap-1 text-[11px] text-midnight/50">
            <Eye className="h-3.5 w-3.5" />
            Aperçu en direct
          </div>
        </div>

        <div className="grid grid-cols-[180px_1fr] min-h-[320px]">
          {/* Sidebar blocs */}
          <aside className="border-r border-frost/40 bg-white-ice/50 p-3 space-y-1">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-midnight/40">
              Blocs
            </p>
            {[
              { icone: Type, libelle: "Titre" },
              { icone: ImageIcon, libelle: "Image" },
              { icone: Layout, libelle: "Colonnes" },
              { icone: ListOrdered, libelle: "Articles" },
            ].map((b) => {
              const Icone = b.icone;
              return (
                <div
                  key={b.libelle}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-midnight/80 hover:bg-frost/30 transition-colors cursor-grab"
                >
                  <Icone className="h-3.5 w-3.5 text-nexora-blue" />
                  {b.libelle}
                </div>
              );
            })}
          </aside>

          {/* Zone de page */}
          <div className="p-5 space-y-3 bg-gradient-to-b from-white to-white-ice/40">
            <div className="group flex items-start gap-2 rounded-lg border border-transparent hover:border-sky/40 hover:bg-sky/5 px-3 py-2 transition-all">
              <GripVertical className="h-3.5 w-3.5 text-midnight/30 opacity-0 group-hover:opacity-100 mt-1" />
              <div className="flex-1">
                <div className="h-5 w-3/4 rounded bg-gradient-to-r from-midnight to-nexora-blue" />
                <div className="mt-2 h-2 w-1/2 rounded bg-frost" />
              </div>
            </div>

            <div className="group flex items-start gap-2 rounded-lg border-2 border-sky/60 bg-sky/5 px-3 py-2 ring-2 ring-sky/20 transition-all">
              <GripVertical className="h-3.5 w-3.5 text-sky" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2 rounded bg-frost/80" />
                <div className="h-2 w-5/6 rounded bg-frost/80" />
                <div className="h-2 w-4/6 rounded bg-frost/80" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-video rounded-lg bg-gradient-to-br from-sky/30 to-teal/30" />
              <div className="aspect-video rounded-lg bg-gradient-to-br from-frost/60 to-nexora-blue/20" />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-teal/10 px-3 py-2 border border-teal/30">
              <Sparkles className="h-3.5 w-3.5 text-teal" />
              <span className="text-xs text-midnight/70">
                Sauvegarde automatique · v12
              </span>
              <span className="ml-auto text-[10px] text-midnight/40">
                à l&apos;instant
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Carte flottante — stats */}
      <div
        className="absolute -bottom-6 -left-6 hidden md:flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl px-4 py-3 animate-float"
        aria-hidden
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20">
          <Sparkles className="h-5 w-5 text-teal" />
        </div>
        <div>
          <p className="text-xs text-midnight/60">Visiteurs aujourd&apos;hui</p>
          <p className="text-lg font-bold text-midnight">
            2 847{" "}
            <span className="text-xs font-medium text-teal">+12%</span>
          </p>
        </div>
      </div>

      {/* Badge flottant — multilingue */}
      <div
        className="absolute -top-4 -right-4 hidden md:flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl px-3 py-1.5 animate-float-delayed"
        aria-hidden
      >
        <span className="text-xs font-mono text-midnight/70">FR · EN · ES</span>
        <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
      </div>
    </div>
  );
}
