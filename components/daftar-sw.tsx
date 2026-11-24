'use client'

import { useEffect } from 'react'

// Service worker hanya dipasang di versi produksi (Vercel).
// Di `npm run dev` sengaja tidak, supaya cache tidak mengacaukan saat mengedit kode.
export function DaftarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}