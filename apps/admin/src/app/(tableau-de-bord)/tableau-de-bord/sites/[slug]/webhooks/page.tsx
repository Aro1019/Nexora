"use client";

/**
 * Page de gestion des webhooks d'un site.
 * - Liste, création, modification, suppression
 * - Test, consultation des livraisons, relance
 */
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Webhook,
  Plus,
  Loader2,
  ArrowLeft,
  Trash2,
  Edit3,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const EVENEMENTS_LIBELLES: Record<string, string> = {
  "soumission_formulaire.creee": "Nouvelle soumission de formulaire",
  "page.publiee": "Page publiée",
  "page.depubliee": "Page dépubliée",
};

const EVENEMENTS = [
  "soumission_formulaire.creee",
  "page.publiee",
  "page.depubliee",
] as const;

type Evenement = (typeof EVENEMENTS)[number];

export default function PageWebhooks() {
  const params = useParams<{ slug: string }>();
  const utils = trpc.useUtils();

  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );
  const { data: webhooks, isLoading } = trpc.webhooks.lister.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );

  const [formOuvert, setFormOuvert] = useState(false);
  const [edition, setEdition] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [url, setUrl] = useState("");
  const [evenementsSelectionnes, setEvenementsSelectionnes] = useState<Evenement[]>([
    "soumission_formulaire.creee",
  ]);
  const [erreur, setErreur] = useState("");
  const [secretsAffiches, setSecretsAffiches] = useState<Set<string>>(new Set());
  const [livraisonsOuvertes, setLivraisonsOuvertes] = useState<string | null>(null);
  const [confirmSupprimer, setConfirmSupprimer] = useState<string | null>(null);
  const [resultatTest, setResultatTest] = useState<{
    id: string;
    statut: string;
    code: number | null;
  } | null>(null);

  const reset = () => {
    setFormOuvert(false);
    setEdition(null);
    setNom("");
    setUrl("");
    setEvenementsSelectionnes(["soumission_formulaire.creee"]);
    setErreur("");
  };

  const mutationCreer = trpc.webhooks.creer.useMutation({
    onSuccess: () => {
      utils.webhooks.lister.invalidate({ idSite: site?.id ?? "" });
      reset();
    },
    onError: (e) => setErreur(e.message),
  });
  const mutationModifier = trpc.webhooks.modifier.useMutation({
    onSuccess: () => {
      utils.webhooks.lister.invalidate({ idSite: site?.id ?? "" });
      reset();
    },
    onError: (e) => setErreur(e.message),
  });
  const mutationSupprimer = trpc.webhooks.supprimer.useMutation({
    onSuccess: () => {
      utils.webhooks.lister.invalidate({ idSite: site?.id ?? "" });
      setConfirmSupprimer(null);
    },
  });
  const mutationTester = trpc.webhooks.tester.useMutation({
    onSuccess: (livraison) => {
      if (livraison) {
        setResultatTest({
          id: livraison.idWebhook,
          statut: livraison.statut,
          code: livraison.codeReponse,
        });
      }
    },
  });
  const mutationRegenerer = trpc.webhooks.regenererSecret.useMutation({
    onSuccess: () => utils.webhooks.lister.invalidate({ idSite: site?.id ?? "" }),
  });

  const soumettre = () => {
    if (!site) return;
    setErreur("");
    if (edition) {
      mutationModifier.mutate({
        id: edition,
        idSite: site.id,
        nom,
        url,
        evenements: evenementsSelectionnes,
      });
    } else {
      mutationCreer.mutate({ idSite: site.id, nom, url, evenements: evenementsSelectionnes });
    }
  };

  if (isLoading || !site) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/tableau-de-bord/sites/${params.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {site.nom}
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-midnight flex items-center gap-2">
            <Webhook className="h-6 w-6 text-nexora-blue" />
            Webhooks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Notifications HTTP signées vers vos systèmes externes
          </p>
        </div>
        {!formOuvert && (
          <button
            type="button"
            onClick={() => setFormOuvert(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau webhook
          </button>
        )}
      </div>

      {/* Formulaire */}
      {formOuvert && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {edition ? "Modifier le webhook" : "Nouveau webhook"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Slack notifications, Zapier prod…"
                className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.example.com/abc123"
                className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Événements</label>
              <div className="space-y-2">
                {EVENEMENTS.map((ev) => (
                  <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={evenementsSelectionnes.includes(ev)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEvenementsSelectionnes([...evenementsSelectionnes, ev]);
                        } else {
                          setEvenementsSelectionnes(
                            evenementsSelectionnes.filter((x) => x !== ev)
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                    />
                    <span className="text-foreground">{EVENEMENTS_LIBELLES[ev]}</span>
                    <span className="text-xs font-mono text-muted-foreground">{ev}</span>
                  </label>
                ))}
              </div>
            </div>

            {erreur && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {erreur}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={soumettre}
                disabled={
                  !nom ||
                  !url ||
                  evenementsSelectionnes.length === 0 ||
                  mutationCreer.isPending ||
                  mutationModifier.isPending
                }
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 transition-colors"
              >
                {(mutationCreer.isPending || mutationModifier.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {edition ? "Enregistrer" : "Créer"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-input bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      {!webhooks || webhooks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Webhook className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Aucun webhook configuré. Ajoutez-en un pour recevoir des notifications.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {webhooks.map((w) => (
            <li key={w.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{w.nom}</h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          w.actif
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {w.actif ? "Actif" : "Inactif"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-mono text-muted-foreground break-all">
                      {w.url}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {w.evenements.map((ev) => (
                        <span
                          key={ev}
                          className="inline-flex items-center rounded bg-frost/40 px-1.5 py-0.5 text-[10px] font-mono text-nexora-blue"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>

                    {/* Secret */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Secret :</span>
                      <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                        {secretsAffiches.has(w.id)
                          ? w.secret
                          : `${w.secret.slice(0, 8)}${"•".repeat(20)}`}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          const next = new Set(secretsAffiches);
                          if (next.has(w.id)) next.delete(w.id);
                          else next.add(w.id);
                          setSecretsAffiches(next);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        title={secretsAffiches.has(w.id) ? "Masquer" : "Afficher"}
                      >
                        {secretsAffiches.has(w.id) ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Régénérer le secret ? L'ancien sera invalidé.")) {
                            mutationRegenerer.mutate({ id: w.id, idSite: site.id });
                          }
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Régénérer
                      </button>
                    </div>

                    {resultatTest?.id === w.id && (
                      <div
                        className={`mt-3 rounded-md px-3 py-2 text-xs ${
                          resultatTest.statut === "REUSSIE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        Test : {resultatTest.statut}
                        {resultatTest.code !== null && ` (HTTP ${resultatTest.code})`}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setResultatTest(null);
                        mutationTester.mutate({ id: w.id, idSite: site.id });
                      }}
                      disabled={mutationTester.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-input bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                      title="Envoyer un test"
                    >
                      {mutationTester.isPending && mutationTester.variables?.id === w.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Tester
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        mutationModifier.mutate({
                          id: w.id,
                          idSite: site.id,
                          actif: !w.actif,
                        })
                      }
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title={w.actif ? "Désactiver" : "Activer"}
                    >
                      {w.actif ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEdition(w.id);
                        setNom(w.nom);
                        setUrl(w.url);
                        setEvenementsSelectionnes(w.evenements as Evenement[]);
                        setFormOuvert(true);
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Modifier"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {confirmSupprimer === w.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            mutationSupprimer.mutate({ id: w.id, idSite: site.id })
                          }
                          className="rounded-md bg-destructive px-2 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors"
                        >
                          Supprimer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmSupprimer(null)}
                          className="text-xs text-muted-foreground px-1"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmSupprimer(w.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Toggle livraisons */}
                <button
                  type="button"
                  onClick={() => setLivraisonsOuvertes(livraisonsOuvertes === w.id ? null : w.id)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {livraisonsOuvertes === w.id ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  {w._count.livraisons} livraison{w._count.livraisons > 1 ? "s" : ""}
                </button>
              </div>

              {livraisonsOuvertes === w.id && (
                <ListeLivraisons idWebhook={w.id} idSite={site.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ListeLivraisons({ idWebhook, idSite }: { idWebhook: string; idSite: string }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.webhooks.listerLivraisons.useQuery({
    idWebhook,
    idSite,
    limite: 30,
  });
  const mutationRelancer = trpc.webhooks.relancerLivraison.useMutation({
    onSuccess: () => utils.webhooks.listerLivraisons.invalidate({ idWebhook, idSite }),
  });

  if (isLoading) {
    return (
      <div className="border-t border-border px-5 py-3 text-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground inline-block" />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        Aucune livraison pour le moment.
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-muted/20">
      <ul className="divide-y divide-border">
        {data.map((l) => {
          const Icone =
            l.statut === "REUSSIE" ? CheckCircle2 : l.statut === "ECHOUEE" ? XCircle : Clock;
          const couleur =
            l.statut === "REUSSIE"
              ? "text-emerald-600"
              : l.statut === "ECHOUEE"
                ? "text-destructive"
                : "text-amber-600";
          return (
            <li key={l.id} className="px-5 py-2.5 flex items-center gap-3 text-xs">
              <Icone className={`h-4 w-4 shrink-0 ${couleur}`} />
              <span className="font-mono text-foreground">{l.evenement}</span>
              <span className="text-muted-foreground">
                {new Date(l.creeLe).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {l.codeReponse !== null && (
                <span
                  className={`font-mono ${
                    l.codeReponse >= 200 && l.codeReponse < 300
                      ? "text-emerald-600"
                      : "text-destructive"
                  }`}
                >
                  HTTP {l.codeReponse}
                </span>
              )}
              <span className="text-muted-foreground">
                {l.tentatives} tentative{l.tentatives > 1 ? "s" : ""}
              </span>
              <div className="ml-auto">
                {l.statut !== "REUSSIE" && (
                  <button
                    type="button"
                    onClick={() => mutationRelancer.mutate({ id: l.id, idSite })}
                    disabled={mutationRelancer.isPending}
                    className="inline-flex items-center gap-1 rounded border border-input bg-white px-2 py-0.5 text-[11px] hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Relancer
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
