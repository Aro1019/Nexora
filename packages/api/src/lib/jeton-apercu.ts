/**
 * Jetons d'aperçu signés (HMAC-SHA256).
 * Permettent de partager un lien d'aperçu d'une page en BROUILLON
 * sans exposer la base : le jeton encode { idPage, idSite, expiration }
 * et est signé avec le secret serveur.
 *
 * Format : base64url(payloadJson) + "." + base64url(signature)
 */
import { createHmac, timingSafeEqual } from "node:crypto";

interface ChargeJetonApercu {
  /** Identifiant de la page à prévisualiser */
  idPage: string;
  /** Identifiant du site (vérification croisée) */
  idSite: string;
  /** Identifiant d'une version spécifique à prévisualiser (optionnel) */
  idVersion?: string;
  /** Timestamp Unix (secondes) d'expiration */
  exp: number;
}

/** Récupère le secret commun (réutilise BETTER_AUTH_SECRET pour éviter une 2e variable). */
function obtenirSecret(): string {
  const secret =
    process.env.BETTER_AUTH_SECRET ?? process.env.NEXORA_SECRET ?? "";
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET est requis pour signer les jetons d'aperçu."
    );
  }
  return secret;
}

/** Encode une valeur en base64url (sans padding). */
function encoderBase64Url(donnees: Buffer | string): string {
  const buf = typeof donnees === "string" ? Buffer.from(donnees) : donnees;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Décode une chaîne base64url en buffer. */
function decoderBase64Url(valeur: string): Buffer {
  const normalisee = valeur.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalisee.length % 4 === 0 ? "" : "=".repeat(4 - (normalisee.length % 4));
  return Buffer.from(normalisee + padding, "base64");
}

/** Signe une charge utile et renvoie le jeton final. */
export function signerJetonApercu(
  charge: Omit<ChargeJetonApercu, "exp">,
  dureeSecondes: number
): string {
  const exp = Math.floor(Date.now() / 1000) + dureeSecondes;
  const chargeComplete: ChargeJetonApercu = { ...charge, exp };
  const payload = encoderBase64Url(JSON.stringify(chargeComplete));
  const signature = createHmac("sha256", obtenirSecret())
    .update(payload)
    .digest();
  return `${payload}.${encoderBase64Url(signature)}`;
}

/**
 * Vérifie un jeton d'aperçu et renvoie sa charge.
 * Renvoie null si invalide, expiré, ou mal formé.
 */
export function verifierJetonApercu(jeton: string): ChargeJetonApercu | null {
  const parties = jeton.split(".");
  if (parties.length !== 2) return null;
  const [payload, signature] = parties;

  /* Recalcul de la signature attendue */
  const signatureAttendue = createHmac("sha256", obtenirSecret())
    .update(payload)
    .digest();
  const signatureFournie = decoderBase64Url(signature);

  if (signatureFournie.length !== signatureAttendue.length) return null;
  if (!timingSafeEqual(signatureFournie, signatureAttendue)) return null;

  /* Décodage de la charge */
  let charge: ChargeJetonApercu;
  try {
    charge = JSON.parse(decoderBase64Url(payload).toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof charge.idPage !== "string" ||
    typeof charge.idSite !== "string" ||
    typeof charge.exp !== "number"
  ) {
    return null;
  }

  if (charge.exp < Math.floor(Date.now() / 1000)) return null;

  return charge;
}
