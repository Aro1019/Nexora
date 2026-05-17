/**
 * Page "Réglages" du tableau de bord.
 * Réglages globaux du compte utilisateur. Les réglages d'un site se trouvent
 * dans /tableau-de-bord/sites/[slug]/reglages.
 */
import { Settings, User2, Bell, Shield } from "lucide-react";

export default function PageReglages() {
  const sections = [
    {
      titre: "Profil",
      description: "Nom, email et avatar.",
      icone: User2,
    },
    {
      titre: "Sécurité",
      description: "Mot de passe, sessions actives et connexions OAuth.",
      icone: Shield,
    },
    {
      titre: "Notifications",
      description: "Préférences d'envoi d'emails et alertes.",
      icone: Bell,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-nexora-blue/10 text-nexora-blue">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-midnight">
            Réglages
          </h1>
          <p className="text-sm text-muted-foreground">
            Préférences globales de votre compte Nexora.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {sections.map((section) => (
          <div
            key={section.titre}
            className="flex items-start gap-4 rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <section.icone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-midnight">
                {section.titre}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
            <span className="self-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Bientôt
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
