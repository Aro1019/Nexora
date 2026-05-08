/**
 * Route d'aperçu signé : /s/[siteSlug]/preview/[token]
 * Permet de prévisualiser une page (même en BROUILLON) sans authentification,
 * tant que le jeton HMAC est valide.
 *
 * Le mode "live" (?live=1) intègre un écouteur postMessage qui reçoit
 * les changements de contenu depuis l'éditeur admin et re-rend la page
 * côté client.
 */
import { notFound } from "next/navigation";
import { db } from "@nexora/db";
import { verifierJetonApercu } from "@/lib/jeton-apercu";
import { resoudreSiteParSlug } from "@/lib/resoudre-page";
import { RendreContenuPage, type Bloc } from "@/composants/rendre-bloc";
import { EcouteurApercuDirect } from "@/composants/apercu-direct";

type Params = Promise<{ siteSlug: string; token: string }>;
type RechercheParams = Promise<{ live?: string }>;

export const dynamic = "force-dynamic";

/** Désactive l'indexation pour les pages d'aperçu. */
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PageApercu({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: RechercheParams;
}) {
  const { siteSlug, token } = await params;
  const { live } = await searchParams;

  const site = await resoudreSiteParSlug(siteSlug);
  if (!site) notFound();

  const charge = verifierJetonApercu(token);
  if (!charge || charge.idSite !== site.id) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Lien d&apos;aperçu invalide ou expiré
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Demandez un nouveau lien depuis l&apos;éditeur.
          </p>
        </div>
      </main>
    );
  }

  const page = await db.page.findUnique({
    where: { id: charge.idPage },
  });

  if (!page || page.idSite !== site.id) notFound();

  /* Si le jeton cible une version spécifique, on remplace contenu/titre/meta. */
  let titreEffectif = page.titre;
  let contenuEffectif: unknown = page.contenu;
  let labelVersion: string | null = null;
  if (charge.idVersion) {
    const version = await db.versionPage.findUnique({
      where: { id: charge.idVersion },
      select: {
        idPage: true,
        version: true,
        titre: true,
        contenu: true,
      },
    });
    if (!version || version.idPage !== page.id) notFound();
    titreEffectif = version.titre;
    contenuEffectif = version.contenu;
    labelVersion = `version ${version.version}`;
  }

  /* Couleurs personnalisées du site */
  const reglages = await db.reglagesSite.findUnique({
    where: { idSite: site.id },
  });
  const stylesSite: React.CSSProperties = reglages
    ? ({
        ["--site-couleur-principale" as string]: reglages.couleurPrincipale,
        ["--site-couleur-accent" as string]: reglages.couleurAccent,
        ["--site-rayon-bordure" as string]: reglages.rayonBordure,
      } as React.CSSProperties)
    : {};

  const blocs = (Array.isArray(contenuEffectif) ? contenuEffectif : []) as unknown as Bloc[];
  const modeDirect = live === "1";

  return (
    <div style={stylesSite} className="min-h-screen bg-background" lang={page.langue}>
      {/* Bandeau aperçu */}
      <div className="sticky top-0 z-50 bg-amber-100 border-b border-amber-300 text-amber-900 text-xs px-4 py-2 flex items-center justify-between">
        <span>
          <strong>Aperçu</strong>
          {labelVersion
            ? ` — ${labelVersion}`
            : page.statut === "BROUILLON"
              ? " — brouillon non publié"
              : " — version publiée"}
          {modeDirect ? " · mode direct" : ""}
        </span>
        <span className="font-mono">{page.langue}</span>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground" data-apercu-titre>
            {modeDirect ? null : titreEffectif}
          </h1>
        </header>

        <div data-apercu-contenu>
          {modeDirect ? null : (
            <RendreContenuPage
              blocs={blocs}
              contexte={{
                idSite: site.id,
                slugSite: site.slug,
                langue: page.langue,
                langueParDefaut: site.langueParDefaut,
              }}
            />
          )}
        </div>
      </main>

      {modeDirect && <EcouteurApercuDirect />}
    </div>
  );
}
