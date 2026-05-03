"use client";

/**
 * Formulaire interactif côté visiteur public.
 * Valide via le Server Action `soumettreFormulaire` et affiche le résultat.
 */
import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  soumettreFormulaire,
  type ResultatSoumission,
} from "@/lib/actions-formulaire";

export interface ChampPublic {
  id: string;
  type: string;
  libelle: string;
  nom: string;
  placeholder?: string;
  obligatoire?: boolean;
  options?: string[];
}

export interface DefinitionFormulaire {
  id: string;
  nom: string;
  champs: ChampPublic[];
  libelleEnvoi: string;
  messageSucces: string;
}

export function FormulairePublic({
  formulaire,
}: {
  formulaire: DefinitionFormulaire;
}) {
  const [enCours, demarrer] = useTransition();
  const [resultat, setResultat] = useState<ResultatSoumission | null>(null);

  function gererSoumission(formData: FormData) {
    setResultat(null);
    const donnees: Record<string, FormDataEntryValue> = {};
    formData.forEach((v, k) => {
      donnees[k] = v;
    });
    demarrer(async () => {
      const r = await soumettreFormulaire(formulaire.id, donnees);
      setResultat(r);
    });
  }

  if (resultat?.succes) {
    return (
      <div className="rounded-xl border border-teal/30 bg-teal/10 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-teal" />
        <p className="mt-3 text-base font-medium text-foreground">
          {resultat.message}
        </p>
      </div>
    );
  }

  return (
    <form
      action={gererSoumission}
      className="rounded-xl border border-border bg-card p-6 space-y-4"
      noValidate
    >
      {formulaire.champs.map((c) => {
        const erreur = resultat?.erreurs?.[c.nom];
        return (
          <div key={c.id}>
            {c.type !== "case-a-cocher" && (
              <label
                htmlFor={`${formulaire.id}-${c.nom}`}
                className="block text-sm font-medium text-foreground mb-1"
              >
                {c.libelle}
                {c.obligatoire && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
              </label>
            )}
            <RenduChamp champ={c} idFormulaire={formulaire.id} />
            {erreur && (
              <p className="mt-1 text-xs text-destructive">{erreur}</p>
            )}
          </div>
        );
      })}

      {resultat && !resultat.succes && !resultat.erreurs && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {resultat.message}
        </div>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {enCours ? "Envoi…" : formulaire.libelleEnvoi}
      </button>
    </form>
  );
}

/* Rendu d'un champ selon son type */
function RenduChamp({
  champ,
  idFormulaire,
}: {
  champ: ChampPublic;
  idFormulaire: string;
}) {
  const id = `${idFormulaire}-${champ.nom}`;
  const classes =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  if (champ.type === "zone-texte") {
    return (
      <textarea
        id={id}
        name={champ.nom}
        placeholder={champ.placeholder}
        required={champ.obligatoire}
        rows={4}
        className={`${classes} resize-y`}
      />
    );
  }
  if (champ.type === "case-a-cocher") {
    return (
      <label htmlFor={id} className="flex items-center gap-2 text-sm text-foreground">
        <input
          id={id}
          type="checkbox"
          name={champ.nom}
          required={champ.obligatoire}
        />
        {champ.libelle}
        {champ.obligatoire && (
          <span className="text-destructive">*</span>
        )}
      </label>
    );
  }
  if (champ.type === "selection") {
    return (
      <select
        id={id}
        name={champ.nom}
        required={champ.obligatoire}
        className={classes}
        defaultValue=""
      >
        <option value="" disabled>
          {champ.placeholder || "— Sélectionner —"}
        </option>
        {(champ.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  const typeHtml =
    champ.type === "email"
      ? "email"
      : champ.type === "nombre"
        ? "number"
        : champ.type === "url"
          ? "url"
          : champ.type === "telephone"
            ? "tel"
            : "text";

  return (
    <input
      id={id}
      type={typeHtml}
      name={champ.nom}
      placeholder={champ.placeholder}
      required={champ.obligatoire}
      className={classes}
    />
  );
}
