/**
 * Composant Badge — étiquette colorée pour les statuts.
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const variantesBadge = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variante: {
        defaut: "border-transparent bg-primary text-primary-foreground",
        secondaire: "border-transparent bg-muted text-foreground",
        contour: "text-foreground",
        succes: "border-transparent bg-success/20 text-success-foreground",
        destructif: "border-transparent bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variante: "defaut",
    },
  }
);

export interface PropsBadge
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof variantesBadge> {}

function Badge({ className, variante, ...props }: PropsBadge) {
  return <div className={cn(variantesBadge({ variante }), className)} {...props} />;
}

export { Badge, variantesBadge };
