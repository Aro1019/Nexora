"use client";

/**
 * FournisseurTRPC — encapsule l'app avec le client tRPC et React Query.
 * Doit envelopper tous les composants qui utilisent les hooks tRPC.
 */
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";

/** Obtenir l'URL de base selon l'environnement */
function obtenirUrlBase() {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function FournisseurTRPC({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /* Pas de refetch automatique lors du focus en développement */
            refetchOnWindowFocus: false,
            /* Réessayer une seule fois */
            retry: 1,
            /* Données considérées fraîches pendant 30 secondes */
            staleTime: 30 * 1000,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${obtenirUrlBase()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
