import Link from "next/link";

export default function PageIntrouvable() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 px-6">
      <div className="text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Page introuvable
        </h1>
        <p className="mt-2 text-muted-foreground">
          Cette page n&apos;existe pas ou n&apos;a pas encore été publiée.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
