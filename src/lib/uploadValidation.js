// Shared file validation for document management upload zones.

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

export const ALLOWED_UPLOAD_EXTENSIONS = [
  'doc', 'docx', 'pdf', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'ppt', 'pptx', 'png',
];

/** accept attribute for the file input — restricts the OS picker to supported types. */
export const UPLOAD_ACCEPT = ALLOWED_UPLOAD_EXTENSIONS.map((e) => `.${e}`).join(',');

export const UPLOAD_ERROR = 'File format is not supported.';
export const UPLOAD_SIZE_ERROR = 'File size must be 50 MB or less.';
export const UPLOAD_HINT = 'Word, PDF, Excel, CSV, PPT, JPEG, PNG up to 50MB';

/**
 * Returns null when the file is acceptable, otherwise the error message to show.
 */
export function validateUploadFile(file) {
  if (!file) return UPLOAD_ERROR;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) return UPLOAD_ERROR;
  if (file.size > MAX_UPLOAD_BYTES) return UPLOAD_SIZE_ERROR;
  return null;
}