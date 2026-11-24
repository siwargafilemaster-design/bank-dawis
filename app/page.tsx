'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePengguna } from '@/lib/sesi'
import { Memuat } from '@/components/memuat'

export default function Pembagi() {
  const router = useRouter()
  const { pengguna, galat } = usePengguna()

  useEffect(() => {
    if (!pengguna) return
    const peran = pengguna.peran
    router.replace(
      peran.includes('teller') ? '/teller'
        : peran.includes('pengawas') ? '/pengawas'
          : '/tabungan'
    )
  }, [pengguna, router])

  if (galat) {
    return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>
  }
  return <Memuat />
}
