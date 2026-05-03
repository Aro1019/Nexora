/**
 * Endpoint d'enregistrement d'une vue de page (analytique sans cookies).
 *
 * Le visiteur est identifié par un hash quotidien (IP + UA + sel + date)
 * — aucun cookie, aucun stockage côté client. Conforme RGPD.
 *
 * POST /s/[siteSlug]/api/vue
 * Corps JSON : { chemin: string; langue: string; idPage?: string; referent?: string }
 */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@nexora/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CorpsVue {
  chemin?: string;
  langue?: string;
  idPage?: string;
  referent?: string;
}

/** Détecte un type d'appareil grossier à partir du User-Agent. */
function detecterAppareil(ua: string | null): string | null {
  if (!ua) return null;
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  if (/iPad|Tablet/i.test(ua)) return "tablette";
  return "bureau";
}

/** Extrait l'hôte d'un référent (sans path ni protocole). */
function extraireReferent(brut: string | null | undefined): string | null {
  if (!brut) return null;
  try {
    return new URL(brut).hostname || null;
  } catch {
    return null;
  }
}

/** Hash anonyme stable sur la journée (visiteur unique). */
function calculerVisiteurAnonyme(ip: string, ua: string, idSite: string): string {
  const sel = process.env.BETTER_AUTH_SECRET ?? "nexora";
  const jour = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${ip}|${ua}|${idSite}|${jour}|${sel}`)
    .digest("hex")
    .slice(0, 32);
}

export async function POST(
  requete: Request,
  contexte: { params: Promise<{ siteSlug: string }> }
) {
  const { siteSlug } = await contexte.params;

  /* Charger le site (uniquement publié — on ne traque pas les brouillons) */
  const site = await db.site.findUnique({
    where: { slug: siteSlug },
    select: { id: true, statut: true },
  });
  if (!site || site.statut !== "PUBLIE") {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  /* Lecture du corps */
  let corps: CorpsVue;
  try {
    corps = (await requete.json()) as CorpsVue;
  } catch {
    return NextResponse.json({ erreur: "JSON invalide" }, { status: 400 });
  }

  const chemin = typeof corps.chemin === "string" ? corps.chemin : "/";
  const langue = typeof corps.langue === "string" ? corps.langue : "fr";
  const idPage = typeof corps.idPage === "string" ? corps.idPage : null;

  /* Filtrage des bots évidents */
  const ua = requete.headers.get("user-agent") ?? "";
  if (!ua || /bot|spider|crawler|preview|monitor|wget|curl/i.test(ua)) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  /* IP : derrière proxy via x-forwarded-for, sinon vide */
  const ip =
    requete.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requete.headers.get("x-real-ip") ??
    "0.0.0.0";

  /* Pays via en-tête Vercel/Cloudflare si présent */
  const pays =
    requete.headers.get("x-vercel-ip-country") ??
    requete.headers.get("cf-ipcountry") ??
    null;

  await db.evenementVue.create({
    data: {
      idSite: site.id,
      idPage,
      chemin,
      langue,
      pays,
      referent: extraireReferent(corps.referent),
      typeAppareil: detecterAppareil(ua),
      idVisiteurAnonyme: calculerVisiteurAnonyme(ip, ua, site.id),
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
