"use client";

/**
 * Page des réglages d'un site.
 * Apparence, SEO, code personnalisé, réseaux sociaux.
 */
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Palette,
  Code,
  Share2,
  BarChart3,
  Languages,
  Globe,
  Plus,
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn, LANGUES_DISPONIBLES, obtenirInfoLangue } from "@nexora/ui";
import { trpc } from "@/lib/trpc";

type Onglet = "apparence" | "langues" | "domaine" | "code" | "reseaux" | "analytics";

/** Polices disponibles */
const POLICES = ["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Playfair Display", "Merriweather"];

/** Rayons de bordure */
const RAYONS = [
  { valeur: "0", libelle: "Aucun" },
  { valeur: "0.25rem", libelle: "Petit" },
  { valeur: "0.5rem", libelle: "Moyen" },
  { valeur: "0.75rem", libelle: "Grand" },
  { valeur: "1rem", libelle: "Très grand" },
];

export default function PageReglages() {
  const params = useParams<{ slug: string }>();

  const [ongletActif, setOngletActif] = useState<Onglet>("apparence");
  const [messageSucces, setMessageSucces] = useState("");
  const [erreur, setErreur] = useState("");

  /* Champs formulaire */
  const [couleurPrincipale, setCouleurPrincipale] = useState("#06182E");
  const [couleurAccent, setCouleurAccent] = useState("#185FA5");
  const [policeEnTete, setPoliceEnTete] = useState("Inter");
  const [policeCorps, setPoliceCorps] = useState("Inter");
  const [rayonBordure, setRayonBordure] = useState("0.5rem");
  const [codeEntete, setCodeEntete] = useState("");
  const [codeFinCorps, setCodeFinCorps] = useState("");
  const [idSuiviGA, setIdSuiviGA] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("");

  /* Langues du site */
  const [langues, setLangues] = useState<string[]>(["fr"]);
  const [langueParDefaut, setLangueParDefaut] = useState("fr");

  /* Domaine personnalisé */
  const [domainePersonnalise, setDomainePersonnalise] = useState("");
  const [resultatVerif, setResultatVerif] = useState<{
    valide: boolean;
    raison: string;
  } | null>(null);

  /* Récupérer le site */
  const { data: site } = trpc.sites.obtenir.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  /* Récupérer les réglages */
  const { data: reglages, isLoading } = trpc.reglages.obtenir.useQuery(
    { idSite: site?.id ?? "" },
    { enabled: !!site?.id }
  );

  const utils = trpc.useUtils();

  /* Mutation modifier */
  const mutationModifier = trpc.reglages.modifier.useMutation({
    onSuccess: () => {
      utils.reglages.obtenir.invalidate({ idSite: site?.id ?? "" });
      setErreur("");
      setMessageSucces("Réglages sauvegardés !");
      setTimeout(() => setMessageSucces(""), 3000);
    },
    onError: (err) => setErreur(err.message),
  });

  /* Mutation pour sauvegarder les langues (sur le modèle Site) */
  const mutationSite = trpc.sites.modifier.useMutation({
    onSuccess: () => {
      utils.sites.obtenir.invalidate({ slug: params.slug });
      setErreur("");
      setMessageSucces("Langues sauvegardées !");
      setTimeout(() => setMessageSucces(""), 3000);
    },
    onError: (err) => setErreur(err.message),
  });

  /* Remplir les champs au chargement */
  useEffect(() => {
    if (reglages) {
      setCouleurPrincipale(reglages.couleurPrincipale);
      setCouleurAccent(reglages.couleurAccent);
      setPoliceEnTete(reglages.policeEnTete);
      setPoliceCorps(reglages.policeCorps);
      setRayonBordure(reglages.rayonBordure);
      setCodeEntete(reglages.codeEntete ?? "");
      setCodeFinCorps(reglages.codeFinCorps ?? "");
      setIdSuiviGA(reglages.idSuiviGA ?? "");
      const liens = (reglages.liensReseauxSociaux as Record<string, string>) ?? {};
      setTwitter(liens.twitter ?? "");
      setInstagram(liens.instagram ?? "");
      setFacebook(liens.facebook ?? "");
      setLinkedin(liens.linkedin ?? "");
    }
  }, [reglages]);

  /* Synchroniser les langues depuis le site */
  useEffect(() => {
    if (site) {
      setLangues(site.langues);
      setLangueParDefaut(site.langueParDefaut);
      setDomainePersonnalise(site.domainePersonnalise ?? "");
    }
  }, [site]);

  /* Mutation vérification DNS */
  const mutationVerifier = trpc.sites.verifierDomaine.useMutation({
    onSuccess: (r) => setResultatVerif({ valide: r.valide, raison: r.raison }),
    onError: (err) =>
      setResultatVerif({ valide: false, raison: err.message }),
  });

  /** Sauvegarder */
  function gererSauvegarde() {
    if (!site?.id) return;
    setErreur("");

    if (ongletActif === "langues") {
      mutationSite.mutate({
        id: site.id,
        langues,
        langueParDefaut,
      });
      return;
    }

    if (ongletActif === "domaine") {
      mutationSite.mutate({
        id: site.id,
        domainePersonnalise: domainePersonnalise.trim()
          ? domainePersonnalise.trim().toLowerCase()
          : null,
      });
      return;
    }

    const liens: Record<string, string> = {};
    if (twitter) liens.twitter = twitter;
    if (instagram) liens.instagram = instagram;
    if (facebook) liens.facebook = facebook;
    if (linkedin) liens.linkedin = linkedin;

    mutationModifier.mutate({
      idSite: site.id,
      couleurPrincipale,
      couleurAccent,
      policeEnTete,
      policeCorps,
      rayonBordure,
      codeEntete: codeEntete || null,
      codeFinCorps: codeFinCorps || null,
      idSuiviGA: idSuiviGA || null,
      liensReseauxSociaux: Object.keys(liens).length > 0 ? liens : null,
    });
  }

  const roleCourant = site?.roleCourant ?? "LECTEUR";
  const peutModifier = ["PROPRIETAIRE", "ADMINISTRATEUR"].includes(roleCourant);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight">Réglages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personnalisez l&apos;apparence et le comportement de votre site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {messageSucces && (
            <span className="text-sm text-emerald-600 font-medium">{messageSucces}</span>
          )}
          {peutModifier && (
            <button
              type="button"
              onClick={gererSauvegarde}
              disabled={mutationModifier.isPending || mutationSite.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-nexora-blue/90 disabled:opacity-50 transition-colors"
            >
              {mutationModifier.isPending || mutationSite.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      {erreur && (
        <div className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {/* Onglets */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-6 -mb-px">
          {([
            { id: "apparence" as const, libelle: "Apparence", icone: Palette },
            { id: "langues" as const, libelle: "Langues", icone: Languages },
            { id: "domaine" as const, libelle: "Domaine", icone: Globe },
            { id: "code" as const, libelle: "Code", icone: Code },
            { id: "reseaux" as const, libelle: "Réseaux sociaux", icone: Share2 },
            { id: "analytics" as const, libelle: "Analytics", icone: BarChart3 },
          ]).map((onglet) => {
            const Icone = onglet.icone;
            return (
              <button
                key={onglet.id}
                type="button"
                onClick={() => setOngletActif(onglet.id)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                  ongletActif === onglet.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icone className="h-4 w-4" />
                {onglet.libelle}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ──────── Onglet Apparence ──────── */}
      {ongletActif === "apparence" && (
        <div className="space-y-8 max-w-xl">
          {/* Couleurs */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Couleurs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="couleur-principale" className="block text-sm text-foreground mb-1.5">
                  Couleur principale
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="couleur-principale"
                    type="color"
                    value={couleurPrincipale}
                    onChange={(e) => setCouleurPrincipale(e.target.value)}
                    className="h-10 w-10 rounded border border-input cursor-pointer"
                  />
                  <input
                    type="text"
                    value={couleurPrincipale}
                    onChange={(e) => setCouleurPrincipale(e.target.value)}
                    className="flex-1 rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="couleur-accent" className="block text-sm text-foreground mb-1.5">
                  Couleur d&apos;accent
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="couleur-accent"
                    type="color"
                    value={couleurAccent}
                    onChange={(e) => setCouleurAccent(e.target.value)}
                    className="h-10 w-10 rounded border border-input cursor-pointer"
                  />
                  <input
                    type="text"
                    value={couleurAccent}
                    onChange={(e) => setCouleurAccent(e.target.value)}
                    className="flex-1 rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Polices */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Typographie</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="police-entete" className="block text-sm text-foreground mb-1.5">
                  Police des titres
                </label>
                <select
                  id="police-entete"
                  value={policeEnTete}
                  onChange={(e) => setPoliceEnTete(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2.5 text-sm text-foreground"
                >
                  {POLICES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="police-corps" className="block text-sm text-foreground mb-1.5">
                  Police du texte
                </label>
                <select
                  id="police-corps"
                  value={policeCorps}
                  onChange={(e) => setPoliceCorps(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2.5 text-sm text-foreground"
                >
                  {POLICES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Rayon de bordure */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-4">
              Rayon de bordure
            </label>
            <div className="flex gap-2">
              {RAYONS.map((r) => (
                <button
                  key={r.valeur}
                  type="button"
                  onClick={() => setRayonBordure(r.valeur)}
                  className={cn(
                    "flex-1 rounded-md border-2 px-3 py-2 text-xs font-medium transition-all text-center",
                    rayonBordure === r.valeur
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-ring"
                  )}
                >
                  {r.libelle}
                </button>
              ))}
            </div>
          </div>

          {/* Aperçu */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Aperçu</h3>
            <div className="rounded-lg border border-border p-6 bg-white">
              <div
                className="inline-block px-4 py-2 text-sm font-semibold text-white"
                style={{
                  backgroundColor: couleurPrincipale,
                  borderRadius: rayonBordure,
                  fontFamily: policeEnTete,
                }}
              >
                Bouton principal
              </div>
              <div
                className="mt-3 inline-block px-4 py-2 text-sm font-semibold text-white ml-2"
                style={{
                  backgroundColor: couleurAccent,
                  borderRadius: rayonBordure,
                  fontFamily: policeEnTete,
                }}
              >
                Bouton accent
              </div>
              <p className="mt-4 text-sm" style={{ fontFamily: policeCorps }}>
                Voici un exemple de texte avec la police sélectionnée.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ──────── Onglet Langues ──────── */}
      {ongletActif === "langues" && (
        <div className="space-y-8 max-w-2xl">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1.5">
              Langues activées
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Les pages peuvent être créées dans chaque langue activée. Les visiteurs
              pourront basculer entre elles via le sélecteur dans l&apos;en-tête.
            </p>

            {/* Liste des langues activées */}
            <div className="space-y-2 mb-4">
              {langues.map((code) => {
                const info = obtenirInfoLangue(code);
                const estDefaut = code === langueParDefaut;
                return (
                  <div
                    key={code}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border p-3",
                      estDefaut
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{info.drapeau}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {info.nomNatif}
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            ({info.nomFr})
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {info.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {estDefaut ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-medium">
                          <Star className="h-3 w-3 fill-current" />
                          Par défaut
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLangueParDefaut(code)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                          title="Définir comme langue par défaut"
                        >
                          <Star className="h-3 w-3" />
                          Définir par défaut
                        </button>
                      )}
                      {langues.length > 1 && !estDefaut && (
                        <button
                          type="button"
                          onClick={() =>
                            setLangues(langues.filter((l) => l !== code))
                          }
                          className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Retirer cette langue"
                          aria-label="Retirer cette langue"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ajouter une langue */}
            <div>
              <p className="text-xs font-medium text-foreground/80 mb-2">
                Ajouter une langue
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUES_DISPONIBLES.filter((l) => !langues.includes(l.code)).map(
                  (l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLangues([...langues, l.code])}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-card px-3 py-2 text-left text-sm text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <span className="text-lg">{l.drapeau}</span>
                      <span className="flex-1 min-w-0 truncate">{l.nomNatif}</span>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )
                )}
              </div>
              {LANGUES_DISPONIBLES.filter((l) => !langues.includes(l.code))
                .length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Toutes les langues disponibles sont déjà activées.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">À savoir</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>
                Les pages dans la langue par défaut sont accessibles via l&apos;URL
                racine (ex&nbsp;: <code className="font-mono">/s/mon-site/</code>).
              </li>
              <li>
                Les autres langues sont préfixées par leur code (ex&nbsp;:{" "}
                <code className="font-mono">/s/mon-site/en/</code>).
              </li>
              <li>
                Pour traduire une page existante, ouvrez-la et utilisez le bouton
                «&nbsp;Dupliquer dans une autre langue&nbsp;».
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ──────── Onglet Domaine ──────── */}
      {ongletActif === "domaine" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <label
              htmlFor="domaine"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Domaine personnalisé
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Servez votre site depuis votre propre domaine (ex&nbsp;:{" "}
              <code className="font-mono">monsite.com</code>) plutôt que via
              l&apos;URL Nexora.
            </p>
            <div className="flex gap-2">
              <input
                id="domaine"
                type="text"
                value={domainePersonnalise}
                onChange={(e) => {
                  setDomainePersonnalise(e.target.value);
                  setResultatVerif(null);
                }}
                placeholder="monsite.com"
                className="flex-1 rounded-md border border-input bg-white px-3.5 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                disabled={
                  !domainePersonnalise.trim() ||
                  mutationVerifier.isPending ||
                  !site?.id
                }
                onClick={() => {
                  if (!site?.id) return;
                  setResultatVerif(null);
                  mutationVerifier.mutate({
                    idSite: site.id,
                    domaine: domainePersonnalise.trim().toLowerCase(),
                  });
                }}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {mutationVerifier.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                Vérifier
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Sans préfixe (ni <code className="font-mono">https://</code>, ni{" "}
              <code className="font-mono">www</code>). Laissez vide pour
              désactiver.
            </p>
          </div>

          {/* Résultat de la vérification */}
          {resultatVerif && (
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-sm",
                resultatVerif.valide
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              )}
            >
              {resultatVerif.valide ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  {resultatVerif.valide
                    ? "Domaine correctement résolu."
                    : "Configuration DNS à vérifier."}
                </p>
                <p className="mt-0.5 opacity-90">{resultatVerif.raison}</p>
              </div>
            </div>
          )}

          {/* Instructions DNS */}
          <div className="rounded-lg border border-border bg-muted/30 p-5">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Comment configurer votre DNS&nbsp;?
            </h4>
            <ol className="list-decimal pl-4 space-y-2 text-sm text-muted-foreground">
              <li>
                Connectez-vous chez votre registrar (OVH, Gandi, Cloudflare,
                Google Domains…).
              </li>
              <li>
                Ajoutez un enregistrement <strong>CNAME</strong> ou{" "}
                <strong>A</strong> selon le type de domaine&nbsp;:
              </li>
            </ol>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                  Sous-domaine (recommandé)
                </p>
                <code className="block text-xs font-mono text-foreground">
                  CNAME <strong>www</strong> → cname.nexora.app
                </code>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                  Domaine racine
                </p>
                <code className="block text-xs font-mono text-foreground">
                  A <strong>@</strong> → 76.76.21.21
                </code>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              La propagation DNS peut prendre quelques minutes à plusieurs
              heures. Cliquez sur «&nbsp;Vérifier&nbsp;» dès que c&apos;est fait.
            </p>
          </div>

          {site?.domainePersonnalise && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-medium">Domaine actif</p>
              <p className="mt-0.5">
                Votre site répond actuellement sur{" "}
                <a
                  href={`https://${site.domainePersonnalise}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline"
                >
                  {site.domainePersonnalise}
                </a>
                .
              </p>
            </div>
          )}
        </div>
      )}

      {/* ──────── Onglet Code ──────── */}
      {ongletActif === "code" && (
        <div className="space-y-6 max-w-xl">
          <div>
            <label htmlFor="code-entete" className="block text-sm font-medium text-foreground mb-1.5">
              Code dans &lt;head&gt;
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                (Google Fonts, meta tags…)
              </span>
            </label>
            <textarea
              id="code-entete"
              value={codeEntete}
              onChange={(e) => setCodeEntete(e.target.value)}
              rows={6}
              placeholder="<link href='...' rel='stylesheet' />"
              className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div>
            <label htmlFor="code-fin-corps" className="block text-sm font-medium text-foreground mb-1.5">
              Code avant &lt;/body&gt;
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                (scripts, widgets…)
              </span>
            </label>
            <textarea
              id="code-fin-corps"
              value={codeFinCorps}
              onChange={(e) => setCodeFinCorps(e.target.value)}
              rows={6}
              placeholder="<script>...</script>"
              className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
      )}

      {/* ──────── Onglet Réseaux sociaux ──────── */}
      {ongletActif === "reseaux" && (
        <div className="space-y-4 max-w-xl">
          {([
            { id: "twitter", libelle: "Twitter / X", valeur: twitter, setter: setTwitter, placeholder: "https://twitter.com/monsite" },
            { id: "instagram", libelle: "Instagram", valeur: instagram, setter: setInstagram, placeholder: "https://instagram.com/monsite" },
            { id: "facebook", libelle: "Facebook", valeur: facebook, setter: setFacebook, placeholder: "https://facebook.com/monsite" },
            { id: "linkedin", libelle: "LinkedIn", valeur: linkedin, setter: setLinkedin, placeholder: "https://linkedin.com/company/monsite" },
          ]).map((reseau) => (
            <div key={reseau.id}>
              <label htmlFor={reseau.id} className="block text-sm font-medium text-foreground mb-1.5">
                {reseau.libelle}
              </label>
              <input
                id={reseau.id}
                type="url"
                value={reseau.valeur}
                onChange={(e) => reseau.setter(e.target.value)}
                placeholder={reseau.placeholder}
                className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          ))}
        </div>
      )}

      {/* ──────── Onglet Analytics ──────── */}
      {ongletActif === "analytics" && (
        <div className="space-y-6 max-w-xl">
          <div>
            <label htmlFor="ga-id" className="block text-sm font-medium text-foreground mb-1.5">
              Identifiant Google Analytics
            </label>
            <input
              id="ga-id"
              type="text"
              value={idSuiviGA}
              onChange={(e) => setIdSuiviGA(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Entrez votre identifiant de mesure Google Analytics 4 pour suivre le trafic de votre site.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
