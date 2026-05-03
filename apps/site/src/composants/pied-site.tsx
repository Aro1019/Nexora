/**
 * Pied de page du site public.
 * Affiche les éléments de navigation PIED_DE_PAGE en colonnes
 * (un parent par colonne, ses enfants comme liens).
 */
import Link from "next/link";
import type { ElementMenu } from "@/lib/resoudre-navigation";

interface PropsPied {
  nomSite: string;
  elements: ElementMenu[];
}

export function PiedSite({ nomSite, elements }: PropsPied) {
  /* Si certains éléments ont des enfants, on affiche un layout en colonnes.
     Sinon, on affiche les liens en ligne. */
  const aColonnes = elements.some((e) => e.enfants.length > 0);

  return (
    <footer className="mt-24 border-t border-border bg-muted/20">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {elements.length > 0 && aColonnes && (
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 mb-10">
            {elements.map((parent) => (
              <div key={parent.id}>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {parent.libelle}
                </h3>
                {parent.enfants.length > 0 ? (
                  <ul className="space-y-2">
                    {parent.enfants.map((enfant) => (
                      <li key={enfant.id}>
                        <Link
                          href={enfant.href}
                          target={enfant.externe ? "_blank" : undefined}
                          rel={
                            enfant.externe ? "noopener noreferrer" : undefined
                          }
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          {enfant.libelle}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Link
                    href={parent.href}
                    target={parent.externe ? "_blank" : undefined}
                    rel={parent.externe ? "noopener noreferrer" : undefined}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {parent.libelle}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {elements.length > 0 && !aColonnes && (
          <nav className="mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {elements.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                target={item.externe ? "_blank" : undefined}
                rel={item.externe ? "noopener noreferrer" : undefined}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {item.libelle}
              </Link>
            ))}
          </nav>
        )}

        <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {nomSite} — Propulsé par{" "}
          <span className="font-medium text-foreground">Nexora</span>
        </div>
      </div>
    </footer>
  );
}
