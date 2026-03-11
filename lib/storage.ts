import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const STORAGE_BASE = process.env.STORAGE_PATH || './storage/documents';

export async function ensureStorageDir(): Promise<void> {
  if (!existsSync(STORAGE_BASE)) {
    await fs.mkdir(STORAGE_BASE, { recursive: true });
  }
}

export async function saveFile(buffer: Buffer, filename: string): Promise<string> {
  await ensureStorageDir();
  const filePath = path.join(STORAGE_BASE, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function readFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist
  }
}

export async function getFileStats(filePath: string) {
  return fs.stat(filePath);
}

export function getStoragePath(filename: string): string {
  return path.join(STORAGE_BASE, filename);
}

// Future: replace with S3 implementation
export async function getFileUrl(filename: string): Promise<string> {
  return `/api/documents/file/${filename}`;
}
