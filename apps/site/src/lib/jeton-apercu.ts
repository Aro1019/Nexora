/**
 * Vérification locale des jetons d'aperçu signés (HMAC-SHA256).
 * Format : base64url(payloadJson) + "." + base64url(signature).
 * Doit rester compatible avec la signature côté @nexora/api.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

interface ChargeJetonApercu {
  idPage: string;
  idSite: string;
  idVersion?: string;
  exp: number;
}

function obtenirSecret(): string {
  const secret =
    process.env.BETTER_AUTH_SECRET ?? process.env.NEXORA_SECRET ?? "";
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET est requis pour vérifier les jetons d'aperçu.");
  }
  return secret;
}

function decoderBase64Url(valeur: string): Buffer {
  const normalisee = valeur.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalisee.length % 4 === 0 ? "" : "=".repeat(4 - (normalisee.length % 4));
  return Buffer.from(normalisee + padding, "base64");
}

export function verifierJetonApercu(jeton: string): ChargeJetonApercu | null {
  const parties = jeton.split(".");
  if (parties.length !== 2) return null;
  const [payload, signature] = parties;

  const signatureAttendue = createHmac("sha256", obtenirSecret())
    .update(payload)
    .digest();
  const signatureFournie = decoderBase64Url(signature);

  if (signatureFournie.length !== signatureAttendue.length) return null;
  if (!timingSafeEqual(signatureFournie, signatureAttendue)) return null;

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
