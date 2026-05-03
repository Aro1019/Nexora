"use server";

/**
 * Server Action — soumission publique d'un formulaire.
 * Validation côté serveur basée sur la définition stockée.
 */
import { db } from "@nexora/db";
import { headers } from "next/headers";
import { envoyerNotificationSoumission } from "./courriel";

export interface ResultatSoumission {
  succes: boolean;
  message: string;
  erreurs?: Record<string, string>;
}

interface ChampDef {
  nom: string;
  type: string;
  obligatoire?: boolean;
}

/** Vérifie qu'une chaîne est un e-mail simple */
function estEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Vérifie qu'une chaîne est une URL http(s) */
function estUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Soumet un formulaire publiquement.
 * `donneesBrutes` provient d'un FormData converti en objet.
 */
export async function soumettreFormulaire(
  idFormulaire: string,
  donneesBrutes: Record<string, FormDataEntryValue | FormDataEntryValue[]>
): Promise<ResultatSoumission> {
  const formulaire = await db.formulaire.findUnique({
    where: { id: idFormulaire },
    include: { site: { select: { nom: true } } },
  });
  if (!formulaire) {
    return { succes: false, message: "Formulaire introuvable." };
  }

  const champs = (formulaire.champs as unknown as ChampDef[]) ?? [];
  const erreurs: Record<string, string> = {};
  const donneesValidees: Record<string, unknown> = {};

  for (const champ of champs) {
    const brut = donneesBrutes[champ.nom];

    /* Cases à cocher : présence implique true */
    if (champ.type === "case-a-cocher") {
      const coche = brut === "on" || brut === "true";
      if (champ.obligatoire && !coche) {
        erreurs[champ.nom] = "Ce champ est obligatoire.";
        continue;
      }
      donneesValidees[champ.nom] = coche;
      continue;
    }

    const valeur = typeof brut === "string" ? brut.trim() : "";
    if (!valeur) {
      if (champ.obligatoire) {
        erreurs[champ.nom] = "Ce champ est obligatoire.";
      }
      continue;
    }

    if (champ.type === "email" && !estEmail(valeur)) {
      erreurs[champ.nom] = "Adresse e-mail invalide.";
      continue;
    }
    if (champ.type === "url" && !estUrl(valeur)) {
      erreurs[champ.nom] = "URL invalide.";
      continue;
    }
    if (champ.type === "nombre") {
      const n = Number(valeur);
      if (Number.isNaN(n)) {
        erreurs[champ.nom] = "Nombre invalide.";
        continue;
      }
      donneesValidees[champ.nom] = n;
      continue;
    }

    donneesValidees[champ.nom] = valeur;
  }

  if (Object.keys(erreurs).length > 0) {
    return {
      succes: false,
      message: "Certains champs sont invalides.",
      erreurs,
    };
  }

  /* Récupération facultative de l'IP / agent pour traçabilité */
  const en = await headers();
  const adresseIP =
    en.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    en.get("x-real-ip") ??
    null;
  const agentUtilisateur = en.get("user-agent") ?? null;

  const soumission = await db.soumissionFormulaire.create({
    data: {
      idFormulaire: formulaire.id,
      donnees: donneesValidees as object,
      adresseIP,
      agentUtilisateur,
    },
  });

  await db.journalAudit.create({
    data: {
      idSite: formulaire.idSite,
      action: "formulaire.soumission",
      typeRessource: "soumission_formulaire",
      idRessource: soumission.id,
      adresseIP,
      metadonnees: { idFormulaire: formulaire.id },
    },
  });

  /* Notification e-mail (best-effort : n'échoue pas la soumission) */
  if (formulaire.emailNotification) {
    void envoyerNotificationSoumission({
      destinataire: formulaire.emailNotification,
      nomFormulaire: formulaire.nom,
      nomSite: formulaire.site.nom,
      donnees: donneesValidees,
      dateSoumission: soumission.creeLe,
    });
  }

  return { succes: true, message: formulaire.messageSucces };
}
