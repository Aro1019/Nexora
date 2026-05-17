/**
 * Client S3 pour MinIO — gestion du stockage de fichiers.
 * Fournit les opérations : URL présignée (upload/download), suppression.
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ─────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "nexora";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "nexora_dev";
const S3_BUCKET = process.env.S3_BUCKET || "nexora-media";
const S3_REGION = process.env.S3_REGION || "us-east-1";

/** Instance du client S3 configurée pour MinIO */
export const clientS3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

/** Nom du bucket par défaut */
export const NOM_BUCKET = S3_BUCKET;

// ─────────────────────────────────────────
// Initialisation du bucket
// ─────────────────────────────────────────

let bucketInitialise = false;

/**
 * Policy IAM qui autorise la lecture publique (`s3:GetObject`) de tous
 * les objets du bucket. Les médias d'un CMS sont par nature accessibles
 * sur le web public ; les opérations d'écriture restent protégées par
 * les URLs présignées générées côté serveur.
 */
function policyLecturePublique(nomBucket: string): string {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${nomBucket}/*`],
      },
    ],
  });
}

/** Crée le bucket s'il n'existe pas encore et garantit l'accès public en lecture. */
export async function initialiserBucket(): Promise<void> {
  if (bucketInitialise) return;

  try {
    await clientS3.send(new HeadBucketCommand({ Bucket: NOM_BUCKET }));
  } catch {
    await clientS3.send(new CreateBucketCommand({ Bucket: NOM_BUCKET }));
  }

  /* Toujours (ré)appliquer la policy de lecture publique. Idempotent. */
  try {
    await clientS3.send(
      new PutBucketPolicyCommand({
        Bucket: NOM_BUCKET,
        Policy: policyLecturePublique(NOM_BUCKET),
      })
    );
  } catch (erreur) {
    /* Ne pas bloquer l'init si la policy échoue (ex: permissions
       restreintes en prod où la policy est gérée par l'infra). */
    console.warn("[storage] Impossible d'appliquer la bucket policy :", erreur);
  }

  bucketInitialise = true;
}

// ─────────────────────────────────────────
// Opérations
// ─────────────────────────────────────────

/**
 * Génère une URL présignée pour uploader un fichier.
 * Le client envoie directement le fichier vers MinIO sans passer par le serveur.
 *
 * @param cle     Clé de l'objet (ex: "sites/abc123/images/photo.jpg")
 * @param typeMime  Type MIME du fichier
 * @param duree   Durée de validité en secondes (défaut: 5 min)
 */
export async function genererUrlUpload(
  cle: string,
  typeMime: string,
  duree: number = 300
): Promise<string> {
  await initialiserBucket();

  const commande = new PutObjectCommand({
    Bucket: NOM_BUCKET,
    Key: cle,
    ContentType: typeMime,
  });

  return getSignedUrl(clientS3, commande, { expiresIn: duree });
}

/**
 * Construit l'URL publique d'un fichier stocké.
 * En développement, pointe directement vers MinIO.
 */
export function construireUrlPublique(cle: string): string {
  return `${S3_ENDPOINT}/${NOM_BUCKET}/${cle}`;
}

/**
 * Supprime un fichier du stockage.
 *
 * @param cle  Clé de l'objet à supprimer
 */
export async function supprimerFichier(cle: string): Promise<void> {
  await clientS3.send(
    new DeleteObjectCommand({
      Bucket: NOM_BUCKET,
      Key: cle,
    })
  );
}

/**
 * Extrait la clé S3 à partir de l'URL publique.
 */
export function extraireCleDepuisUrl(url: string): string | null {
  const prefixe = `${S3_ENDPOINT}/${NOM_BUCKET}/`;
  if (url.startsWith(prefixe)) {
    return url.slice(prefixe.length);
  }
  return null;
}
