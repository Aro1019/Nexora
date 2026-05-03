/**
 * Catalogue des langues supportées par Nexora.
 * Centralisé pour garder l'orthographe / drapeaux cohérents entre admin et site.
 */

export interface InfoLangue {
  /** Code ISO 639-1 (ex: "fr", "en") ou avec région ("pt-BR") */
  code: string;
  /** Nom natif de la langue (affiché dans le sélecteur) */
  nomNatif: string;
  /** Nom en français */
  nomFr: string;
  /** Drapeau emoji (régional) */
  drapeau: string;
}

export const LANGUES_DISPONIBLES: InfoLangue[] = [
  { code: "fr", nomNatif: "Français", nomFr: "Français", drapeau: "🇫🇷" },
  { code: "en", nomNatif: "English", nomFr: "Anglais", drapeau: "🇬🇧" },
  { code: "es", nomNatif: "Español", nomFr: "Espagnol", drapeau: "🇪🇸" },
  { code: "de", nomNatif: "Deutsch", nomFr: "Allemand", drapeau: "🇩🇪" },
  { code: "it", nomNatif: "Italiano", nomFr: "Italien", drapeau: "🇮🇹" },
  { code: "pt", nomNatif: "Português", nomFr: "Portugais", drapeau: "🇵🇹" },
  { code: "nl", nomNatif: "Nederlands", nomFr: "Néerlandais", drapeau: "🇳🇱" },
  { code: "ar", nomNatif: "العربية", nomFr: "Arabe", drapeau: "🇸🇦" },
  { code: "zh", nomNatif: "中文", nomFr: "Chinois", drapeau: "🇨🇳" },
  { code: "ja", nomNatif: "日本語", nomFr: "Japonais", drapeau: "🇯🇵" },
  { code: "ru", nomNatif: "Русский", nomFr: "Russe", drapeau: "🇷🇺" },
  { code: "ko", nomNatif: "한국어", nomFr: "Coréen", drapeau: "🇰🇷" },
];

/** Récupère les infos d'une langue ou un fallback raisonnable */
export function obtenirInfoLangue(code: string): InfoLangue {
  return (
    LANGUES_DISPONIBLES.find((l) => l.code === code) ?? {
      code,
      nomNatif: code.toUpperCase(),
      nomFr: code.toUpperCase(),
      drapeau: "🌐",
    }
  );
}
