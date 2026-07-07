// app/lib/file_access.js
// Signed-URL access for uploaded files.
//
// The backend no longer serves /uploads statically and requires a short-lived
// HMAC signature on /api/v1/view/*. Use these helpers instead of hand-building
// `/uploads/...` or `/api/v1/view/...` URLs:
//   - getSignedFileUrl(pathOrUrl)                  -> 5-min link for live display
//   - getSignedFileUrl(pathOrUrl, { purpose: 'export' }) -> 7-day link for exports
//
// See also the React hook `useSignedFileUrl` in app/hooks/useSignedFileUrl.js.
import apiClient from './api';

// Folders under uploads/ that hold PUBLIC documents — served directly (no login/signature).
// Must stay in sync with the public static mounts in the backend (cmd/api/main.go).
const PUBLIC_UPLOAD_FOLDERS = ['announcements/', 'fund_forms/', 'import_templates/', 'email_assets/'];

// Convert a stored file path OR an existing /uploads// or /api/v1/view/ URL into
// the upload-relative path the backend signer expects. Returns null if invalid.
export function toUploadRelPath(input) {
  if (!input || typeof input !== 'string') return null;
  let s = input.trim();
  if (!s) return null;

  // If it's an absolute URL, keep only the pathname.
  if (/^https?:\/\//i.test(s)) {
    try {
      s = new URL(s).pathname;
    } catch {
      /* fall through with the raw string */
    }
  }

  s = s.replace(/\\/g, '/');
  s = s.replace(/^\/?api\/v1\/view\//i, ''); // strip a /api/v1/view/ prefix
  s = s.replace(/^\.?\/+/, ''); // strip leading ./ or /
  s = s.replace(/^uploads\//i, ''); // strip a leading uploads/ segment

  if (!s || s.includes('..')) return null;
  return s;
}

// Mint a signed, absolute URL for viewing an uploaded file. Returns '' on failure.
// `purpose: 'export'` yields a long-lived link suitable for embedding in a
// downloaded spreadsheet/document.
export async function getSignedFileUrl(input, { purpose } = {}) {
  // Pass through absolute non-upload URLs unchanged (e.g. external links).
  if (typeof input === 'string' && /^https?:\/\//i.test(input)) {
    const rel = toUploadRelPath(input);
    // If it doesn't look like one of our upload URLs, leave it alone.
    if (rel === null) return input;
  }

  const relPath = toUploadRelPath(input);
  if (!relPath) return '';

  // Public documents (announcements, fund forms, templates, email assets) are served
  // directly without a signature so they can be viewed without logging in.
  if (PUBLIC_UPLOAD_FOLDERS.some((f) => relPath.toLowerCase().startsWith(f))) {
    return `${apiClient.getBackendBaseURL()}/uploads/${relPath}`;
  }

  const params = { path: relPath };
  if (purpose) params.purpose = purpose;

  try {
    const res = await apiClient.get('/files/sign', params);
    const signed = res?.url || res?.data?.url;
    if (!signed) return '';
    if (/^https?:\/\//i.test(signed)) return signed;
    return `${apiClient.getBackendBaseURL()}${signed}`;
  } catch {
    return '';
  }
}

// Open an uploaded file in a new tab via a signed URL. Opens a blank tab
// synchronously (so the browser doesn't block the popup after the async sign),
// then navigates it once the signed URL resolves. Use this to replace
// `<a href={getFileURL(path)} target="_blank">` links.
export async function openSignedFileInNewTab(input, { purpose } = {}) {
  if (!input) return;
  const win = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (win) win.opener = null;
  const signed = await getSignedFileUrl(input, { purpose });
  if (signed) {
    if (win) {
      win.location.href = signed;
    } else if (typeof window !== 'undefined') {
      window.open(signed, '_blank', 'noopener,noreferrer');
    }
  } else if (win) {
    win.close();
  }
}
