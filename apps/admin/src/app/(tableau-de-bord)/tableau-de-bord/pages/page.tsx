/**
 * Page d'index "Pages" du tableau de bord.
 * La gestion des pages se fait au sein d'un site (voir /tableau-de-bord/sites/[slug]/pages).
 * Cette page sert de point d'entrée global et redirige vers la sélection d'un site.
 */
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default function PageIndexPages() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-start gap-4 rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-nexora-blue/10 text-nexora-blue">
          <FileText className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-midnight">
            Pages
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Les pages sont gérées au sein de chaque site. Choisissez un site
            pour accéder à ses pages, créer du contenu et publier.
          </p>
          <Link
            href="/tableau-de-bord/sites"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-nexora-blue px-4 py-2 text-sm font-semibold text-white hover:bg-nexora-blue/90"
          >
            Choisir un site
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
