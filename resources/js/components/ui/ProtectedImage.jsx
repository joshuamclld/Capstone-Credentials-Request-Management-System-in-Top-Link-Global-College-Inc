import React, { useState, useEffect, useRef } from 'react';

export default function ProtectedImage({ src, alt, className }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setError(false);

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
      setBlobUrl(null);
    }

    fetch(src, { credentials: 'same-origin' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.blob();
      })
      .then(blob => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [src]);

  if (!src) return null;
  if (error) return <div className={`flex items-center justify-center bg-slate-100 text-slate-400 text-xs ${className}`}>Unable to load image</div>;

  return blobUrl ? <img src={blobUrl} alt={alt} className={className} /> : (
    <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
      <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
