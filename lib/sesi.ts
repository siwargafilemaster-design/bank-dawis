'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from './supabase'

export type Pengguna = {
  user_id: string
  nama: string
  peran: string[]
  warga_id: string | null
  wajib_ganti_pin: boolean
}

// Dipakai semua halaman yang butuh login.
// perluPeran: kalau diisi dan akun tak punya peran itu → dilempar ke '/'
export function usePengguna(perluPeran?: string) {
  const router = useRouter()
  const pathname = usePathname()
  const [pengguna, setPengguna] = useState<Pengguna | null>(null)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    let batal = false

    async function muat() {
      // tunggu sesi pulih dulu (pelajaran bug 42501 app Bendahara)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('pengguna')
        .select('user_id, nama, peran, warga_id, wajib_ganti_pin')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (batal) return
      if (error) {
        setGalat('Gagal memuat akun: ' + error.message)
        return
      }
      if (!data) {
        setGalat('Akun ini belum terdaftar di Bank Dawis. Hubungi teller.')
        return
      }

      // PIN dari teller → wajib diganti dulu sebelum boleh ke mana pun
      if (data.wajib_ganti_pin && pathname !== '/ganti-pin') {
        router.replace('/ganti-pin')
        return
      }

      if (perluPeran && !data.peran.includes(perluPeran)) {
        router.replace('/')
        return
      }
      setPengguna(data)
    }

    muat()
    return () => {
      batal = true
    }
  }, [router, pathname, perluPeran])

  return { pengguna, galat }
}

export async function keluar() {
  await supabase.auth.signOut()
  window.location.replace('/login')
}