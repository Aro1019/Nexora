"use client";

/**
 * FAQ accordéon — composant client utilisé sur la landing page.
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const QUESTIONS = [
  {
    q: "Faut-il savoir coder pour utiliser Nexora ?",
    r: "Pas du tout. Tout se passe dans un éditeur visuel par blocs : titres, images, formulaires, listes d'articles… vous composez vos pages en quelques clics. Le code est généré automatiquement et reste léger et rapide.",
  },
  {
    q: "Puis-je connecter mon propre nom de domaine ?",
    r: "Oui, chaque site peut être servi sur un domaine personnalisé via une simple configuration DNS. HTTPS est automatique.",
  },
  {
    q: "Mes données m'appartiennent-elles ?",
    r: "Vos contenus, médias, soumissions de formulaires : tout reste vôtre. Export complet possible à tout moment, et auto-hébergement disponible pour les plans Entreprise.",
  },
  {
    q: "Comment fonctionne l'historique des versions ?",
    r: "Chaque modification déclenche un instantané automatique. Vous pouvez revenir à n'importe quelle version, prévisualiser une ancienne ou la restaurer en un clic. Les 50 dernières versions sont conservées.",
  },
  {
    q: "Y a-t-il des analyses intégrées ?",
    r: "Oui — analytics intégré, sans cookies et respectueux de la vie privée. Pages vues, top contenus, sources de trafic, types d'appareils. Aucune bannière de consentement nécessaire.",
  },
  {
    q: "Puis-je collaborer en équipe ?",
    r: "Bien sûr. Invitez des membres avec des rôles précis : Propriétaire, Administrateur, Éditeur, Lecteur. Les actions sont tracées dans un journal d'audit.",
  },
];

export function FaqAccordeon() {
  const [ouvert, setOuvert] = useState<number | null>(0);

  return (
    <ul className="space-y-3">
      {QUESTIONS.map((item, i) => {
        const estOuvert = ouvert === i;
        return (
          <li
            key={i}
            className="rounded-xl border border-border bg-card overflow-hidden transition-all"
          >
            <button
              type="button"
              onClick={() => setOuvert(estOuvert ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-frost/20 transition-colors"
              aria-expanded={estOuvert}
            >
              <span className="font-semibold text-midnight">{item.q}</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-nexora-blue transition-transform duration-300 ${estOuvert ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                estOuvert
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.r}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
