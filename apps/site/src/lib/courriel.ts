/**
 * Service d'envoi d'e-mails via Resend.
 * Utilisé pour notifier le propriétaire d'un site qu'un formulaire a été soumis.
 */
import { Resend } from "resend";

let clientResend: Resend | null = null;

/** Renvoie un client Resend initialisé, ou null si la clé n'est pas configurée. */
function obtenirClient(): Resend | null {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) return null;
  if (!clientResend) clientResend = new Resend(cle);
  return clientResend;
}

/** Adresse expéditeur par défaut (configurable via RESEND_FROM). */
function obtenirExpediteur(): string {
  return process.env.RESEND_FROM ?? "Nexora <onboarding@resend.dev>";
}

/** Échappe une chaîne pour inclusion sûre dans du HTML. */
function echapperHtml(valeur: unknown): string {
  return String(valeur ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface ParametresNotification {
  destinataire: string;
  nomFormulaire: string;
  nomSite: string;
  donnees: Record<string, unknown>;
  dateSoumission: Date;
}

export interface ResultatEnvoi {
  envoye: boolean;
  /** Raison en cas d'échec (config manquante, erreur API, etc.) */
  raison?: string;
}

/**
 * Envoie l'e-mail de notification de soumission au destinataire configuré.
 * Ne lève jamais : retourne `{envoye:false, raison}` en cas de problème.
 */
export async function envoyerNotificationSoumission(
  params: ParametresNotification
): Promise<ResultatEnvoi> {
  const client = obtenirClient();
  if (!client) {
    return { envoye: false, raison: "RESEND_API_KEY non configurée" };
  }

  const { destinataire, nomFormulaire, nomSite, donnees, dateSoumission } = params;

  const lignes = Object.entries(donnees);
  const sujet = `Nouvelle soumission — ${nomFormulaire} (${nomSite})`;

  const lignesHtml = lignes
    .map(
      ([cle, valeur]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#374151;vertical-align:top;">${echapperHtml(cle)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#111827;white-space:pre-wrap;">${echapperHtml(valeur)}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;background:#0f172a;color:#f8fafc;">
      <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;">${echapperHtml(nomSite)}</p>
      <h1 style="margin:6px 0 0;font-size:20px;font-weight:600;">Nouvelle soumission de formulaire</h1>
    </div>
    <div style="padding:20px 24px;">
      <p style="margin:0 0 16px;color:#374151;font-size:14px;">
        Le formulaire <strong>${echapperHtml(nomFormulaire)}</strong> vient d'être soumis le
        ${echapperHtml(dateSoumission.toLocaleString("fr-FR"))}.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        ${lignesHtml || '<tr><td style="padding:12px;color:#6b7280;">Aucune donnée</td></tr>'}
      </table>
    </div>
    <div style="padding:14px 24px;background:#f3f4f6;color:#6b7280;font-size:12px;text-align:center;">
      Envoyé automatiquement par Nexora.
    </div>
  </div>
</body></html>`;

  const texte = [
    `Nouvelle soumission — ${nomFormulaire} (${nomSite})`,
    `Date : ${dateSoumission.toLocaleString("fr-FR")}`,
    "",
    ...lignes.map(([cle, valeur]) => `${cle} : ${String(valeur ?? "")}`),
  ].join("\n");

  try {
    const { error } = await client.emails.send({
      from: obtenirExpediteur(),
      to: [destinataire],
      subject: sujet,
      html,
      text: texte,
    });
    if (error) {
      console.error("[courriel] Erreur Resend :", error);
      return { envoye: false, raison: error.message ?? "Erreur Resend" };
    }
    return { envoye: true };
  } catch (err) {
    console.error("[courriel] Exception lors de l'envoi :", err);
    return {
      envoye: false,
      raison: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}
