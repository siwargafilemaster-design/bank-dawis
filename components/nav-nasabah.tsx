'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ikon, type NamaIkon } from './ikon'

const MENU: { href: string; label: string; ikon: NamaIkon }[] = [
  { href: '/tabungan', label: 'Beranda', ikon: 'rumah' },
  { href: '/tabungan/mutasi', label: 'Mutasi', ikon: 'daftar' },
  { href: '/tabungan/akun', label: 'Akun', ikon: 'orang' },
]

export function NavNasabah() {
  const pathname = usePathname()
  return (
    <nav className="nav-bawah" aria-label="Menu utama">
      {MENU.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          className={pathname === m.href ? 'aktif' : ''}
          aria-current={pathname === m.href ? 'page' : undefined}
        >
          <Ikon nama={m.ikon} />
          {m.label}
        </Link>
      ))}
    </nav>
  )
}