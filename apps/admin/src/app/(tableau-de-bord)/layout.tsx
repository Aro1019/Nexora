/**
 * Disposition du tableau de bord.
 * Toutes les pages enfant sont protégées par le middleware.
 * Récupère la session côté serveur et passe les infos au shell client.
 */
import { headers } from "next/headers";
import { auth } from "@nexora/auth";
import { ShellTableauDeBord } from "@/composants/shell-tableau-de-bord";

export default async function DispositionTableauDeBord({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Récupération de la session côté serveur */
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <ShellTableauDeBord
      nomUtilisateur={session?.user?.name ?? "Utilisateur"}
      emailUtilisateur={session?.user?.email ?? ""}
      avatarUrl={session?.user?.image ?? undefined}
    >
      {children}
    </ShellTableauDeBord>
  );
}
