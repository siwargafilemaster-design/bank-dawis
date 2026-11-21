'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Pengguna = {
  nama: string
  peran: string[]
  warga_id: string | null
}

type Rekening = {
  no_rekening: string
  saldo: number
  status: string
}

const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

export default function Beranda() {
  const router = useRouter()
  const [saya, setSaya] = useState<Pengguna | null>(null)
  const [rekSaya, setRekSaya] = useState<Rekening | null>(null)
  const [jumlahRek, setJumlahRek] = useState<number | null>(null)
  const [pesan, setPesan] = useState('Memuat…')

  useEffect(() => {
    async function muat() {
      // TUNGGU sesi pulih dulu, baru query
      // (pelajaran bug 42501 di app Bendahara)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const { data: p, error } = await supabase
        .from('pengguna')
        .select('nama, peran, warga_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) {
        setPesan('Gagal memuat: ' + error.message)
        return
      }
      if (!p) {
        setPesan('Akun ini belum terdaftar di Bank Dawis. Hubungi teller.')
        return
      }
      setSaya(p)

      if (p.warga_id) {
        const { data: r } = await supabase
          .from('rekening')
          .select('no_rekening, saldo, status')
          .eq('warga_id', p.warga_id)
          .maybeSingle()
        setRekSaya(r)
      }

      if (p.peran.includes('teller') || p.peran.includes('pengawas')) {
        const { count } = await supabase
          .from('rekening')
          .select('id', { count: 'exact', head: true })
        setJumlahRek(count ?? 0)
      }

      setPesan('')
    }
    muat()
  }, [router])

  async function keluar() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <main className="wadah">
      <p className="redup" style={{ marginBottom: 12 }}>
        🧪 Halaman uji login — diganti di Tahap 3
      </p>

      {pesan && <div className="kartu">{pesan}</div>}

      {saya && (
        <>
          <div className="kartu">
            <p className="redup">Masuk sebagai</p>
            <p className="judul">{saya.nama}</p>
            <p className="redup">Peran: {saya.peran.join(', ')}</p>
          </div>

          <div className="kartu">
            <p className="redup">Tabungan saya</p>
            {rekSaya ? (
              <>
                <p className="saldo">{rupiah(rekSaya.saldo)}</p>
                <p className="redup">
                  {rekSaya.no_rekening} · {rekSaya.status}
                </p>
              </>
            ) : (
              <p>Belum punya rekening</p>
            )}
          </div>

          {jumlahRek !== null && (
            <div className="kartu">
              <p className="redup">Rekening yang bisa saya lihat</p>
              <p className="saldo">{jumlahRek}</p>
            </div>
          )}

          <button className="tipis" onClick={keluar}>
            Keluar
          </button>
        </>
      )}
    </main>
  )
}
