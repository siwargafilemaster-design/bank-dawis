'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePengguna } from '@/lib/sesi'

export default function Pembagi() {
  const router = useRouter()
  const { pengguna, galat } = usePengguna()

  useEffect(() => {
    if (!pengguna) return
    router.replace(pengguna.peran.includes('teller') ? '/teller' : '/tabungan')
  }, [pengguna, router])

  return (
    <main className="layar">
      {galat ? (
        <div className="kartu" style={{ marginTop: 40 }}>{galat}</div>
      ) : (
        <p className="redup" style={{ padding: 40 }}>Memuat…</p>
      )}
    </main>
  )
}
