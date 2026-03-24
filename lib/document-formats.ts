import path from 'path';

export const PDF_MIME_TYPE = 'application/pdf';
export const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function getFileExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

export function isPdfFile(file: { name?: string; type?: string }) {
  return file.type === PDF_MIME_TYPE || getFileExtension(file.name || '') === '.pdf';
}

export function isDocxFile(file: { name?: string; type?: string }) {
  return file.type === DOCX_MIME_TYPE || getFileExtension(file.name || '') === '.docx';
}

export function isSupportedUpload(file: { name?: string; type?: string }) {
  return isPdfFile(file) || isDocxFile(file);
}

export function getUploadSupportMessage() {
  return 'Only PDF and DOCX files are supported';
}
