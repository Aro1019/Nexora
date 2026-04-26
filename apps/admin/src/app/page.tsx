/** Page d'accueil de l'application Nexora */
export default function PageAccueil() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white-ice">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-midnight">
          Nexora
        </h1>
        <p className="mt-3 text-lg text-nexora-blue">
          La plateforme CMS moderne pour créer vos sites internet
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-nexora-blue/90 transition-colors">
            Commencer
          </button>
          <button className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-frost/30 transition-colors">
            En savoir plus
          </button>
        </div>
      </div>
    </main>
  );
}
