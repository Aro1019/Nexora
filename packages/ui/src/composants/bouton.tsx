/**
 * Composant Bouton — bouton réutilisable avec variantes.
 * Utilise class-variance-authority pour gérer les styles.
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const variantesBouton = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variante: {
        primaire:
          "bg-primary text-primary-foreground hover:bg-nexora-blue/90",
        destructif:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        contour:
          "border border-input bg-transparent hover:bg-muted hover:text-foreground",
        secondaire:
          "bg-muted text-foreground hover:bg-muted/80",
        fantome:
          "hover:bg-muted hover:text-foreground",
        lien:
          "text-accent underline-offset-4 hover:underline",
      },
      taille: {
        defaut: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icone: "h-10 w-10",
      },
    },
    defaultVariants: {
      variante: "primaire",
      taille: "defaut",
    },
  }
);

export interface PropsBouton
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBouton> {}

const Bouton = React.forwardRef<HTMLButtonElement, PropsBouton>(
  ({ className, variante, taille, ...props }, ref) => {
    return (
      <button
        className={cn(variantesBouton({ variante, taille, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Bouton.displayName = "Bouton";

export { Bouton, variantesBouton };
