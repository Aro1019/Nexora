/**
 * Déclenche la livraison d'un événement à tous les webhooks abonnés d'un site.
 * - Crée un enregistrement LivraisonWebhook pour chaque webhook actif.
 * - Tente la livraison HTTP avec signature HMAC.
 * - Met à jour le statut (REUSSIE / ECHOUEE) et planifie une retentative en cas d'échec.
 *
 * Conçu pour être appelé en "fire and forget" depuis une mutation sans bloquer la réponse.
 */
import { createHmac, randomBytes } from "node:crypto";
import { type PrismaClient } from "@nexora/db";

const TIMEOUT_MS = 10_000;
const MAX_TENTATIVES = 5;
const DELAIS_RELANCE_SEC = [60, 300, 1800, 7200, 21600]; // 1m, 5m, 30m, 2h, 6h

export function genererSecretWebhook(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

export function signerCharge(secret: string, corps: string): string {
  return createHmac("sha256", secret).update(corps).digest("hex");
}

export interface OptionsLivraison {
  db: PrismaClient;
  idSite: string;
  evenement: string;
  charge: Record<string, unknown>;
}

/** À appeler depuis une mutation : déclenche les livraisons en arrière-plan. */
export function declencherEvenementWebhook(options: OptionsLivraison): void {
  void livrerEvenement(options).catch((e) => {
    console.error("[webhook] Erreur de déclenchement:", e);
  });
}

async function livrerEvenement({
  db,
  idSite,
  evenement,
  charge,
}: OptionsLivraison) {
  const webhooks = await db.webhook.findMany({
    where: {
      idSite,
      actif: true,
      evenements: { has: evenement },
    },
  });

  for (const webhook of webhooks) {
    const livraison = await db.livraisonWebhook.create({
      data: {
        idWebhook: webhook.id,
        evenement,
        charge: charge as object,
        statut: "EN_ATTENTE",
      },
    });
    void tenterLivraison(db, livraison.id).catch((e) =>
      console.error("[webhook] Tentative échouée:", e)
    );
  }
}

/** Tente une livraison ; programme une relance si échec et tentatives < MAX. */
export async function tenterLivraison(db: PrismaClient, idLivraison: string) {
  const livraison = await db.livraisonWebhook.findUnique({
    where: { id: idLivraison },
    include: { webhook: true },
  });
  if (!livraison || !livraison.webhook.actif) return;

  const corps = JSON.stringify({
    evenement: livraison.evenement,
    cree_le: livraison.creeLe.toISOString(),
    donnees: livraison.charge,
  });
  const signature = signerCharge(livraison.webhook.secret, corps);
  const tentatives = livraison.tentatives + 1;

  let codeReponse: number | null = null;
  let texteReponse = "";
  let reussi = false;

  try {
    const controleur = new AbortController();
    const minuteur = setTimeout(() => controleur.abort(), TIMEOUT_MS);
    const reponse = await fetch(livraison.webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Nexora-Webhook/1.0",
        "X-Nexora-Evenement": livraison.evenement,
        "X-Nexora-Livraison": livraison.id,
        "X-Nexora-Signature": `sha256=${signature}`,
      },
      body: corps,
      signal: controleur.signal,
    });
    clearTimeout(minuteur);
    codeReponse = reponse.status;
    texteReponse = (await reponse.text().catch(() => "")).slice(0, 2000);
    reussi = reponse.ok;
  } catch (e) {
    texteReponse = e instanceof Error ? e.message : "Erreur réseau";
  }

  const statut = reussi
    ? "REUSSIE"
    : tentatives >= MAX_TENTATIVES
      ? "ECHOUEE"
      : "EN_ATTENTE";

  const prochaine =
    !reussi && tentatives < MAX_TENTATIVES
      ? new Date(
          Date.now() +
            (DELAIS_RELANCE_SEC[tentatives - 1] ??
              DELAIS_RELANCE_SEC[DELAIS_RELANCE_SEC.length - 1]!) *
              1000
        )
      : null;

  await db.livraisonWebhook.update({
    where: { id: idLivraison },
    data: {
      statut,
      codeReponse,
      reponse: texteReponse || null,
      tentatives,
      prochaineTentative: prochaine,
    },
  });
}
