/**
 * Disposition pour les pages d'authentification.
 * Affiche un layout centré avec le logo Nexora, sans sidebar.
 */
export default function DispositionAuthentification({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Panneau gauche — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-midnight items-center justify-center p-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Nexora
          </h1>
          <p className="mt-4 text-lg text-frost/80 max-w-md">
            La plateforme CMS moderne pour créer et gérer vos sites internet
          </p>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex flex-1 items-center justify-center p-6 bg-white-ice">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
