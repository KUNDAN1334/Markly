import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Storage has two drivers:
 *  - "r2"    → Cloudflare R2 (S3-compatible). Used in production/serverless,
 *              where the filesystem is read-only and non-persistent.
 *  - "local" → filesystem under STORAGE_PATH. Used for local dev so the app
 *              still runs with no cloud credentials configured.
 *
 * The driver is chosen from the environment, so callers never care which is active.
 */

const STORAGE_BASE = process.env.STORAGE_PATH || './storage/documents';

const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

export const isR2Enabled = Boolean(
  R2_BUCKET && R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
);

let cachedClient: S3Client | null = null;

function getR2Client(): S3Client {
  if (!isR2Enabled) {
    throw new Error(
      'R2 is not configured. Set R2_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.'
    );
  }
  if (cachedClient) return cachedClient;

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
  return cachedClient;
}

/** Object key for a stored document. Kept flat so it maps 1:1 to the old filename. */
export function getStorageKey(filename: string): string {
  return `documents/${path.basename(filename)}`;
}

export async function ensureStorageDir(): Promise<void> {
  if (isR2Enabled) return; // buckets need no provisioning
  if (!existsSync(STORAGE_BASE)) {
    await fs.mkdir(STORAGE_BASE, { recursive: true });
  }
}

/**
 * Persist a buffer. Returns an opaque locator stored on Document.path —
 * an R2 key in production, a filesystem path locally.
 */
export async function saveFile(buffer: Buffer, filename: string): Promise<string> {
  if (isR2Enabled) {
    const key = getStorageKey(filename);
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      })
    );
    return key;
  }

  await ensureStorageDir();
  const filePath = path.join(STORAGE_BASE, path.basename(filename));
  await fs.writeFile(filePath, buffer);
  return filePath;
}

/** Read a stored document by filename (not by the raw locator). */
export async function readStoredFile(filename: string): Promise<Buffer> {
  const safe = path.basename(filename);

  if (isR2Enabled) {
    const res = await getR2Client().send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: getStorageKey(safe) })
    );
    if (!res.Body) throw new Error('Empty object body');
    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  return fs.readFile(path.join(STORAGE_BASE, safe));
}

export async function deleteFile(filename: string): Promise<void> {
  const safe = path.basename(filename);
  try {
    if (isR2Enabled) {
      await getR2Client().send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: getStorageKey(safe) })
      );
      return;
    }
    await fs.unlink(path.join(STORAGE_BASE, safe));
  } catch {
    // File may not exist — deletion is idempotent.
  }
}

/** True if the object actually landed in storage. Used to verify direct uploads. */
export async function fileExists(filename: string): Promise<boolean> {
  const safe = path.basename(filename);
  try {
    if (isR2Enabled) {
      await getR2Client().send(
        new HeadObjectCommand({ Bucket: R2_BUCKET, Key: getStorageKey(safe) })
      );
      return true;
    }
    await fs.stat(path.join(STORAGE_BASE, safe));
    return true;
  } catch {
    return false;
  }
}

/** Byte size of a stored object, or null if unknown. */
export async function getStoredFileSize(filename: string): Promise<number | null> {
  const safe = path.basename(filename);
  try {
    if (isR2Enabled) {
      const res = await getR2Client().send(
        new HeadObjectCommand({ Bucket: R2_BUCKET, Key: getStorageKey(safe) })
      );
      return res.ContentLength ?? null;
    }
    const stat = await fs.stat(path.join(STORAGE_BASE, safe));
    return stat.size;
  } catch {
    return null;
  }
}

/**
 * Presigned PUT URL so the browser can upload straight to R2.
 * This is what keeps uploads off the serverless function, which on Vercel's
 * Hobby plan rejects request bodies over 4.5MB.
 */
export async function createUploadUrl(
  filename: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: getStorageKey(filename),
    ContentType: contentType,
  });
  return getSignedUrl(getR2Client(), command, { expiresIn: expiresInSeconds });
}

export function getStoragePath(filename: string): string {
  return isR2Enabled
    ? getStorageKey(filename)
    : path.join(STORAGE_BASE, path.basename(filename));
}

export async function getFileUrl(filename: string): Promise<string> {
  return `/api/documents/file/${filename}`;
}
