/**
 * Composant Dialogue — modale accessible avec overlay.
 * Implémenté en pur React (pas de dépendance Radix).
 */
"use client";

import * as React from "react";
import { cn } from "../lib/utils";

/* ========================
 * Contexte du dialogue
 * ======================== */
interface ContexteDialogue {
  ouvert: boolean;
  setOuvert: (ouvert: boolean) => void;
}

const CtxDialogue = React.createContext<ContexteDialogue>({
  ouvert: false,
  setOuvert: () => {},
});

/* ========================
 * Racine du dialogue
 * ======================== */
interface PropsDialogue {
  ouvert?: boolean;
  surChangement?: (ouvert: boolean) => void;
  children: React.ReactNode;
}

function Dialogue({ ouvert: ouvertControle, surChangement, children }: PropsDialogue) {
  const [ouvertInterne, setOuvertInterne] = React.useState(false);
  const ouvert = ouvertControle ?? ouvertInterne;
  const setOuvert = surChangement ?? setOuvertInterne;

  return (
    <CtxDialogue.Provider value={{ ouvert, setOuvert }}>
      {children}
    </CtxDialogue.Provider>
  );
}

/* ========================
 * Déclencheur
 * ======================== */
const DialogueDeclencheur = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { setOuvert } = React.useContext(CtxDialogue);
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        setOuvert(true);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
DialogueDeclencheur.displayName = "DialogueDeclencheur";

/* ========================
 * Overlay
 * ======================== */
function DialogueOverlay({ className }: { className?: string }) {
  const { setOuvert } = React.useContext(CtxDialogue);
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0",
        className
      )}
      onClick={() => setOuvert(false)}
      aria-hidden="true"
    />
  );
}

/* ========================
 * Contenu
 * ======================== */
const DialogueContenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { ouvert, setOuvert } = React.useContext(CtxDialogue);

  /* Fermer avec Escape */
  React.useEffect(() => {
    if (!ouvert) return;
    const gererEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("keydown", gererEscape);
    return () => document.removeEventListener("keydown", gererEscape);
  }, [ouvert, setOuvert]);

  /* Empêcher le scroll du body */
  React.useEffect(() => {
    if (ouvert) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [ouvert]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <DialogueOverlay />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg animate-in fade-in-0 zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
        {/* Bouton fermer */}
        <button
          type="button"
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          onClick={() => setOuvert(false)}
          aria-label="Fermer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
});
DialogueContenu.displayName = "DialogueContenu";

/* ========================
 * En-tête
 * ======================== */
const DialogueEntete = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
    {...props}
  />
));
DialogueEntete.displayName = "DialogueEntete";

/* ========================
 * Titre
 * ======================== */
const DialogueTitre = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogueTitre.displayName = "DialogueTitre";

/* ========================
 * Description
 * ======================== */
const DialogueDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogueDescription.displayName = "DialogueDescription";

/* ========================
 * Pied
 * ======================== */
const DialoguePied = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}
    {...props}
  />
));
DialoguePied.displayName = "DialoguePied";

export {
  Dialogue,
  DialogueDeclencheur,
  DialogueContenu,
  DialogueEntete,
  DialogueTitre,
  DialogueDescription,
  DialoguePied,
};
