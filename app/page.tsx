'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePengguna, keluar } from '@/lib/sesi'
import { supabase } from '@/lib/supabase'
import { rupiah } from '@/lib/format'

type RekSaya = { no_rekening: string; saldo: number; status: string }

export default function Beranda() {
  const router = useRouter()
  const { pengguna, galat } = usePengguna()
  const [rek, setRek] = useState<RekSaya | null>(null)
  const [siap, setSiap] = useState(false)

  useEffect(() => {
    if (!pengguna) return
    if (pengguna.peran.includes('teller')) {
      router.replace('/teller')
      return
    }

    const wargaId = pengguna.warga_id
    async function muat() {
      if (wargaId) {
        const { data } = await supabase
          .from('rekening')
          .select('no_rekening, saldo, status')
          .eq('warga_id', wargaId)
          .maybeSingle()
        setRek(data)
      }
      setSiap(true)
    }
    muat()
  }, [pengguna, router])

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>
  if (!siap) return <main className="layar"><p className="redup" style={{ padding: 40 }}>Memuat…</p></main>

  return (
    <main className="layar">
      <div className="kepala" style={{ paddingBottom: 96 }}>
        <p style={{ fontSize: 12, color: '#CDE9F1' }}>Selamat datang,</p>
        <p style={{ fontSize: 17, fontWeight: 600 }}>{pengguna?.nama}</p>
      </div>

      <div className="kartu kartu-apung">
        <p className="redup">Saldo tabungan</p>
        {rek ? (
          <>
            <p className="angka-besar">{rupiah(rek.saldo)}</p>
            <p className="redup kecil">{rek.no_rekening}</p>
          </>
        ) : (
          <p style={{ marginTop: 8 }}>Belum punya rekening. Hubungi teller.</p>
        )}
      </div>

      <p className="redup kecil" style={{ margin: '16px 20px' }}>
        Halaman nasabah lengkap menyusul di Tahap 4.
      </p>

      <div className="dorong" />
      <div style={{ padding: '0 20px' }}>
        <button className="tombol garis" onClick={keluar}>Keluar</button>
      </div>
    </main>
  )
}
