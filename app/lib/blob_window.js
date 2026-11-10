// Open a fetched file (Blob) in a new tab in a way iOS Safari allows.
//
// iOS Safari only lets window.open run within ~1s of the user's tap. Files are
// fetched first (auth header, fallbacks), which often takes longer on mobile, so
// a window.open after `await` is silently blocked: nothing happens, no error.
// Fix: call openPendingWindow() synchronously in the click handler BEFORE any
// await, then hand the blob to showBlobInWindow() once it arrives.

const REVOKE_AFTER_MS = 60000;

export function openPendingWindow() {
  if (typeof window === 'undefined') return null;
  let win = null;
  try {
    // No 'noopener': it makes window.open return null, and we need the handle.
    win = window.open('', '_blank');
  } catch {
    win = null;
  }
  if (win) {
    try {
      win.document.title = 'กำลังโหลดไฟล์...';
      win.document.body.style.cssText = 'font-family:sans-serif;padding:24px;color:#475569';
      win.document.body.textContent = 'กำลังโหลดไฟล์...';
    } catch {
      /* cross-origin or locked document: harmless */
    }
  }
  return win;
}

export function closePendingWindow(win) {
  try {
    if (win && !win.closed) win.close();
  } catch {
    /* ignore */
  }
}

// Shows the blob in the pending window (or a new one if none). Returns false
// when the browser blocked every attempt, so the caller can tell the user.
export function showBlobInWindow(win, blob) {
  const url = window.URL.createObjectURL(blob);
  setTimeout(() => {
    try {
      window.URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }, REVOKE_AFTER_MS);

  if (win && !win.closed) {
    win.location.href = url;
    return true;
  }
  return !!window.open(url, '_blank');
}

export function showUrlInWindow(win, url) {
  if (win && !win.closed) {
    win.location.href = url;
    return true;
  }
  return !!window.open(url, '_blank');
}
