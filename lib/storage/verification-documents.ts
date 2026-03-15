const STORAGE_PROXY_ROUTE = '/api/storage/verification-documents/file';

export function toVerificationDocumentUrl(reference: string): string {
  if (!reference) {
    return reference;
  }

  if (/^(https?:\/\/|blob:|data:)/i.test(reference)) {
    return reference;
  }

  return `${STORAGE_PROXY_ROUTE}?path=${encodeURIComponent(reference)}`;
}
