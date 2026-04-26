/**
 * Composant ChampSaisie — input de formulaire stylisé.
 */
import * as React from "react";
import { cn } from "../lib/utils";

const ChampSaisie = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { libelle?: string; erreur?: string }
>(({ className, libelle, erreur, id, ...props }, ref) => {
  const idChamp = id || props.name;
  return (
    <div className="space-y-1.5">
      {libelle && (
        <label htmlFor={idChamp} className="block text-sm font-medium text-foreground">
          {libelle}
        </label>
      )}
      <input
        id={idChamp}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          erreur && "border-destructive focus:ring-destructive",
          className
        )}
        {...props}
      />
      {erreur && (
        <p className="text-xs text-destructive">{erreur}</p>
      )}
    </div>
  );
});
ChampSaisie.displayName = "ChampSaisie";

export { ChampSaisie };
