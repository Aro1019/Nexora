/**
 * Client tRPC côté React.
 * Fournit les hooks React Query typés pour appeler l'API tRPC.
 */
import { createTRPCReact } from "@trpc/react-query";
import type { RouteurRacine } from "@nexora/api";

/** Client tRPC avec les hooks React Query */
export const trpc = createTRPCReact<RouteurRacine>();
