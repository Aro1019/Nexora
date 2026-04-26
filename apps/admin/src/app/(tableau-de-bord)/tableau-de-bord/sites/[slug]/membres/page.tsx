"use client";

/**
 * Page de gestion des membres d'un site.
 * Affiche la liste, permet d'inviter, changer les rôles et retirer.
 */
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Shield,
  Crown,
  Edit3,
  Eye,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@nexora/ui";
import { trpc } from "@/lib/trpc";

/** Icônes et libellés par rôle */
const INFO_ROLE: Record<string, { libelle: string; icone: typeof Crown; classe: string }> = {
  PROPRIETAIRE: { libelle: "Propriétaire", icone: Crown, classe: "text-amber-600" },
  ADMINISTRATEUR: { libelle: "Administrateur", icone: Shield, classe: "text-nexora-blue" },
  EDITEUR: { libelle: "Éditeur", icone: Edit3, classe: "text-teal" },
  LECTEUR: { libelle: "Lecteur", icone: Eye, classe: "text-muted-foreground" },
};

/** Options de rôle pour le select */
const OPTIONS_ROLES = [
  { valeur: "ADMINISTRATEUR", libelle: "Administrateur" },
  { valeur: "EDITEUR", libelle: "Éditeur" },
  { valeur: "LECTEUR", libelle: "Lecteur" },
];

export default function PageMembres() {
  const params = useParams<{ slug: string }>();
  const [modalInvitation, setModalInvitation] = useState(false);
  const [emailInvite, setEmailInvite] = useState("");
  const [roleInvite, setRoleInvite] = useState("EDITEUR");
  const [erreur, setErreur] = useState("");

  /* Récupérer le site pour avoir l'ID */
  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  /* Récupérer les membres */
  const {
    data: membres,
    isLoading,
  } = trpc.membres.lister.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );

  const utils = trpc.useUtils();

  /* Mutation : inviter */
  const mutationInviter = trpc.membres.inviter.useMutation({
    onSuccess: () => {
      utils.membres.lister.invalidate({ idSite: site?.id ?? "" });
      setModalInvitation(false);
      setEmailInvite("");
      setRoleInvite("EDITEUR");
      setErreur("");
    },
    onError: (err) => setErreur(err.message),
  });

  /* Mutation : changer rôle */
  const mutationRole = trpc.membres.changerRole.useMutation({
    onSuccess: () => {
      utils.membres.lister.invalidate({ idSite: site?.id ?? "" });
    },
  });

  /* Mutation : retirer */
  const mutationRetirer = trpc.membres.retirer.useMutation({
    onSuccess: () => {
      utils.membres.lister.invalidate({ idSite: site?.id ?? "" });
      utils.sites.obtenir.invalidate({ slug: params.slug });
    },
  });

  /** Soumettre l'invitation */
  function gererInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!site?.id) return;
    setErreur("");
    mutationInviter.mutate({
      idSite: site.id,
      email: emailInvite,
      role: roleInvite as "ADMINISTRATEUR" | "EDITEUR" | "LECTEUR",
    });
  }

  /** Le rôle de l'utilisateur courant sur ce site */
  const roleCourant = site?.roleCourant ?? "LECTEUR";
  const peutGerer = roleCourant === "PROPRIETAIRE" || roleCourant === "ADMINISTRATEUR";

  /** Initiales d'un nom */
  function initiales(nom: string) {
    return nom
      .split(" ")
      .map((m) => m[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div>
      {/* Retour */}
      <Link
        href={`/tableau-de-bord/sites/${params.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au site
      </Link>

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-midnight">Membres</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les membres et leurs rôles sur ce site.
          </p>
        </div>
        {peutGerer && (
          <button
            type="button"
            onClick={() => setModalInvitation(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Inviter un membre
          </button>
        )}
      </div>

      {/* Chargement */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* ==================== Liste des membres ==================== */
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {membres?.map((membre) => {
            const info = INFO_ROLE[membre.role] || INFO_ROLE.LECTEUR;
            const IconeRole = info.icone;
            const estProprietaire = membre.role === "PROPRIETAIRE";

            return (
              <div
                key={membre.id}
                className="flex items-center justify-between p-4"
              >
                {/* Infos membre */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground shrink-0">
                    {initiales(membre.nom)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {membre.nom}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {membre.email}
                    </p>
                  </div>
                </div>

                {/* Rôle + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Badge rôle ou select */}
                  {peutGerer && !estProprietaire ? (
                    <select
                      value={membre.role}
                      onChange={(e) => {
                        if (!site?.id) return;
                        mutationRole.mutate({
                          idSite: site.id,
                          idMembre: membre.id,
                          nouveauRole: e.target.value as "ADMINISTRATEUR" | "EDITEUR" | "LECTEUR",
                        });
                      }}
                      className="rounded-md border border-input bg-white px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {OPTIONS_ROLES.map((opt) => (
                        <option key={opt.valeur} value={opt.valeur}>
                          {opt.libelle}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", info.classe)}>
                      <IconeRole className="h-3.5 w-3.5" />
                      {info.libelle}
                    </span>
                  )}

                  {/* Bouton retirer */}
                  {peutGerer && !estProprietaire && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!site?.id) return;
                        if (confirm(`Retirer ${membre.nom} de ce site ?`)) {
                          mutationRetirer.mutate({
                            idSite: site.id,
                            idMembre: membre.id,
                          });
                        }
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Retirer du site"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {(!membres || membres.length === 0) && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucun membre trouvé.
            </div>
          )}
        </div>
      )}

      {/* ==================== Modal d'invitation ==================== */}
      {modalInvitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalInvitation(false)}
            aria-hidden="true"
          />
          <div className="relative z-50 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg mx-4">
            {/* Fermer */}
            <button
              type="button"
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              onClick={() => {
                setModalInvitation(false);
                setErreur("");
              }}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-foreground mb-1">
              Inviter un membre
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              L&apos;utilisateur doit déjà avoir un compte Nexora.
            </p>

            {erreur && (
              <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {erreur}
              </div>
            )}

            <form onSubmit={gererInvitation} className="space-y-4">
              <div>
                <label htmlFor="email-invite" className="block text-sm font-medium text-foreground mb-1.5">
                  Adresse email
                </label>
                <input
                  id="email-invite"
                  type="email"
                  value={emailInvite}
                  onChange={(e) => setEmailInvite(e.target.value)}
                  placeholder="membre@exemple.com"
                  required
                  className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="role-invite" className="block text-sm font-medium text-foreground mb-1.5">
                  Rôle
                </label>
                <select
                  id="role-invite"
                  value={roleInvite}
                  onChange={(e) => setRoleInvite(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                >
                  {OPTIONS_ROLES.map((opt) => (
                    <option key={opt.valeur} value={opt.valeur}>
                      {opt.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalInvitation(false);
                    setErreur("");
                  }}
                  className="rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={mutationInviter.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 transition-colors"
                >
                  {mutationInviter.isPending ? "Envoi..." : "Inviter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
