import { spawn } from 'child_process';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import { getFileExtension } from '@/lib/document-formats';

const DEFAULT_WINDOWS_LIBREOFFICE_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
];

function getLibreOfficeCommand() {
  const configuredPath = process.env.LIBREOFFICE_PATH;
  if (configuredPath) return configuredPath;

  const installedPath = DEFAULT_WINDOWS_LIBREOFFICE_PATHS.find((candidate) => existsSync(candidate));
  if (installedPath) return installedPath;

  return 'soffice';
}

function runLibreOfficeConvert(inputPath: string, outputDir: string) {
  const command = getLibreOfficeCommand();

  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      command,
      ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, inputPath],
      { stdio: 'pipe' }
    );

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `LibreOffice exited with code ${code}`));
    });
  });
}

/**
 * DOCX conversion shells out to LibreOffice, which exists on a container/VM but
 * not on serverless hosts. Deploys without a LibreOffice binary set
 * DOCX_CONVERSION_ENABLED=false so uploads degrade to PDF-only with a clear
 * message, instead of failing deep inside spawn().
 */
export const isDocxConversionEnabled =
  process.env.DOCX_CONVERSION_ENABLED !== 'false';

export const DOCX_DISABLED_MESSAGE =
  'DOCX upload is unavailable on this deployment. Please export your document as a PDF and upload that instead.';

export async function convertDocxToPdfBuffer(buffer: Buffer, originalName: string) {
  if (!isDocxConversionEnabled) {
    throw new Error(DOCX_DISABLED_MESSAGE);
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'markly-docx-'));
  const inputExt = getFileExtension(originalName) || '.docx';
  const inputPath = path.join(tempDir, `source${inputExt}`);
  const outputPath = path.join(tempDir, 'source.pdf');

  try {
    await fs.writeFile(inputPath, buffer);
    await runLibreOfficeConvert(inputPath, tempDir);
    return await fs.readFile(outputPath);
  } catch (error) {
    const message =
      error instanceof Error && /ENOENT/i.test(error.message)
        ? 'DOCX conversion requires LibreOffice. Set LIBREOFFICE_PATH or install LibreOffice on the server.'
        : error instanceof Error
          ? `DOCX conversion failed: ${error.message}`
          : 'DOCX conversion failed';

    throw new Error(message);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
