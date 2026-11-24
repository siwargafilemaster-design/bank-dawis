import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { DaftarSW } from '@/components/daftar-sw'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bank Dawis',
  description: 'Tabungan anggota Dasa Wisma',
  applicationName: 'Bank Dawis',
  appleWebApp: {
    capable: true,
    title: 'Bank Dawis',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A6E8C',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={poppins.className}>
        {children}
        <DaftarSW />
      </body>
    </html>
  )
}
