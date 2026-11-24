import type { MetadataRoute } from 'next'
import { IDENTITAS } from '@/lib/identitas'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bank Dawis',
    short_name: 'Bank Dawis',
    description: `Tabungan anggota ${IDENTITAS.namaDawis} · ${IDENTITAS.lokasi}`,
    lang: 'id',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    // putih = sama dengan latar intro → splash Android menyambung mulus
    background_color: '#FFFFFF',
    theme_color: '#0A6E8C',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}