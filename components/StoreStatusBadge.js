'use client';

import { useState, useEffect } from 'react';

export default function StoreStatusBadge({ storeSlug }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!storeSlug) return;
    fetch(`/api/stores/${storeSlug}/status`)
      .then(r => r.json())
      .then(d => { if (!d.error) setStatus(d); })
      .catch(() => {});
  }, [storeSlug]);

  if (!status || status.is_open === null) return null;

  if (status.is_open) {
    return (
      <span style={{
        display: 'inline-block',
        background: '#e8f5e9', color: '#2e7d32',
        padding: '3px 12px', borderRadius: '20px',
        fontSize: '0.72rem', letterSpacing: '0.04em',
      }}>
        Abierto · Cierra a las {status.closes_at}
      </span>
    );
  }

  const nextText = status.opens_next_day && status.opens_next_time
    ? `Abre ${status.opens_next_day} a las ${status.opens_next_time}`
    : 'Cerrado';

  return (
    <span style={{
      display: 'inline-block',
      background: '#f5f3f0', color: '#6b6560',
      padding: '3px 12px', borderRadius: '20px',
      fontSize: '0.72rem', letterSpacing: '0.04em',
    }}>
      Cerrado · {nextText}
    </span>
  );
}
