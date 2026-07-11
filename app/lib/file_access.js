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

// Folders under uploads/ that hold PUBLIC documents (announcements, blank forms,
// templates, email logos). These are non-sensitive and meant to be shareable, so
// they are served WITHOUT login via a proxy-routable public URL. Must stay in sync
// with the /api/v1/public/* static mounts in the backend (cmd/api/main.go).
const PUBLIC_UPLOAD_FOLDERS = ['announcements/', 'fund_forms/', 'import_templates/', 'email_assets/'];

// Single switch for how the PUBLIC_UPLOAD_FOLDERS are accessed:
//   false -> login-free, shareable public URL (/api/v1/public/<path>)  [current]
//   true  -> short-lived signed URL (login required, not shareable)
// Flip to true (and optionally drop the backend /api/v1/public/* mounts) to move
// every public-document link behind signed URLs — no other code needs to change.
const SIGN_PUBLIC_DOCS = false;

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

// Resolve an absolute URL for viewing an uploaded file. Returns '' on failure.
//
// - Public-document folders: a login-free, shareable public URL under
//   `/api/v1/public/...` (unless SIGN_PUBLIC_DOCS or `forceSigned` opts into signing).
// - Everything else (private submission/user files): a short-lived signed
//   `/api/v1/view/...` URL minted via /files/sign (login required).
//
// Both live under /api/* so they work behind a reverse proxy that only forwards
// /api/* to the backend. `purpose: 'export'` yields a long-lived signed link for
// embedding in a downloaded spreadsheet/document. `forceSigned` (per call) overrides
// the SIGN_PUBLIC_DOCS default for public docs.
export async function getSignedFileUrl(input, { purpose, forceSigned } = {}) {
  // Pass through absolute non-upload URLs unchanged (e.g. external links).
  if (typeof input === 'string' && /^https?:\/\//i.test(input)) {
    const rel = toUploadRelPath(input);
    // If it doesn't look like one of our upload URLs, leave it alone.
    if (rel === null) return input;
  }

  const relPath = toUploadRelPath(input);
  if (!relPath) return '';

  const isPublicDoc = PUBLIC_UPLOAD_FOLDERS.some((f) => relPath.toLowerCase().startsWith(f));
  // Private files always sign; public docs follow forceSigned, then the global flag.
  const useSigned = forceSigned ?? (isPublicDoc ? SIGN_PUBLIC_DOCS : true);

  if (isPublicDoc && !useSigned) {
    // Login-free, shareable, proxy-routable public URL.
    return `${apiClient.getBackendBaseURL()}/api/v1/public/${relPath}`;
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
export async function openSignedFileInNewTab(input, { purpose, forceSigned } = {}) {
  if (!input) return;
  const win = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (win) win.opener = null;
  const signed = await getSignedFileUrl(input, { purpose, forceSigned });
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

// Open an uploaded file as a blob URL (fetched with the caller's auth). Use for
// private files that must not be exposed as a shareable URL, or public docs when
// forceSigned is true.
export async function openSignedFileAsBlobInNewTab(input, { purpose, forceSigned } = {}) {
  if (!input) return;
  const win = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (win) win.opener = null;

  try {
    const signed = await getSignedFileUrl(input, { purpose, forceSigned });
    if (!signed) throw new Error('Unable to resolve signed file URL');

    const token = apiClient.getToken?.();
    const res = await fetch(signed, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`File request failed: ${res.status}`);

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    if (win) {
      win.location.href = blobUrl;
    } else if (typeof window !== 'undefined') {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    }

    setTimeout(() => {
      try {
        window.URL.revokeObjectURL(blobUrl);
      } catch {}
    }, 60000);
  } catch (error) {
    console.error('openSignedFileAsBlobInNewTab failed', error);
    if (win) win.close();
  }
}
