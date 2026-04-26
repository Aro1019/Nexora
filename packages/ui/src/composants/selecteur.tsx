/**
 * Composant Selecteur — menu déroulant natif stylisé.
 */
import * as React from "react";
import { cn } from "../lib/utils";

interface PropsSelecteur extends React.SelectHTMLAttributes<HTMLSelectElement> {
  libelle?: string;
  erreur?: string;
  options: { valeur: string; libelle: string }[];
  placeholder?: string;
}

const Selecteur = React.forwardRef<HTMLSelectElement, PropsSelecteur>(
  ({ className, libelle, erreur, options, placeholder, id, ...props }, ref) => {
    const idChamp = id || props.name;
    return (
      <div className="space-y-1.5">
        {libelle && (
          <label htmlFor={idChamp} className="block text-sm font-medium text-foreground">
            {libelle}
          </label>
        )}
        <select
          id={idChamp}
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            erreur && "border-destructive focus:ring-destructive",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.valeur} value={opt.valeur}>
              {opt.libelle}
            </option>
          ))}
        </select>
        {erreur && (
          <p className="text-xs text-destructive">{erreur}</p>
        )}
      </div>
    );
  }
);
Selecteur.displayName = "Selecteur";

export { Selecteur };
