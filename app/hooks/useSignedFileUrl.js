// app/hooks/useSignedFileUrl.js
'use client';

import { useState, useEffect } from 'react';
import { getSignedFileUrl } from '../lib/file_access';

// Resolve a stored file path (or /uploads//view URL) into a signed, viewable URL
// for inline display. Returns '' until the signature has been fetched.
//
//   const url = useSignedFileUrl(doc.stored_path);
//   return url ? <img src={url} /> : <Spinner />;
export function useSignedFileUrl(input, opts) {
  const purpose = opts?.purpose;
  const [url, setUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (!input) {
      setUrl('');
      return undefined;
    }
    getSignedFileUrl(input, { purpose }).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [input, purpose]);

  return url;
}

export default useSignedFileUrl;
