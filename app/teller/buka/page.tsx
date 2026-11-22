'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePengguna } from '@/lib/sesi'
import { wargaTanpaRekening, bukaRekening, type Warga } from '@/lib/bank'
import { inisial } from '@/lib/format'
import { Ikon } from '@/components/ikon'

export default function BukaRekening() {
  const router = useRouter()
  const { pengguna, galat } = usePengguna('teller')
  const [warga, setWarga] = useState<Warga[] | null>(null)
  const [cari, setCari] = useState('')
  const [pilih, setPilih] = useState<Warga | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const [pesan, setPesan] = useState('')

  // RESET tiap kali halaman tampil lagi (alasan sama dgn form setor/tarik)
  useEffect(() => {
    setPilih(null)
    setSibuk(false)
    setPesan('')
  }, [])

  useEffect(() => {
    if (!pengguna) return
    wargaTanpaRekening()
      .then(setWarga)
      .catch((e) => setPesan('Gagal memuat: ' + e.message))
  }, [pengguna])

  async function buka() {
    if (!pilih || sibuk) return
    setSibuk(true)
    setPesan('')
    try {
      const id = await bukaRekening(pilih.id)
      router.replace(`/teller/rekening/${id}`)
    } catch (e) {
      setPesan((e as Error).message)
      setSibuk(false)
    }
  }

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>

  const q = cari.trim().toLowerCase()
  const tampil = (warga ?? []).filter(
    (w) => !q || w.nama_kk.toLowerCase().includes(q) || w.no_rumah.toLowerCase().includes(q)
  )

  return (
    <main className="layar">
      <div className="atas">
        <Link href="/teller" aria-label="Kembali"><Ikon nama="kembali" ukuran={22} /></Link>
        <h1>Buka rekening</h1>
      </div>

      {pilih ? (
        <>
          <div className="kartu" style={{ marginTop: 20, textAlign: 'center' }}>
            <span className="avatar" style={{ margin: '0 auto', width: 56, height: 56, fontSize: 18 }}>
              {inisial(pilih.nama_kk)}
            </span>
            <p style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>{pilih.nama_kk}</p>
            <p className="redup">Rumah {pilih.no_rumah}</p>
            <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>
              Buka rekening tabungan baru dengan saldo awal <b>Rp 0</b>?
              Nomor rekening dibuat otomatis.
            </p>
          </div>
          {pesan && <p className="galat" style={{ margin: '12px 20px' }}>{pesan}</p>}
          <div className="dorong" />
          <div style={{ padding: '0 20px', display: 'grid', gap: 12 }}>
            <button className="tombol" onClick={buka} disabled={sibuk}>
              {sibuk ? 'Membuka…' : 'Ya, buka rekening'}
            </button>
            <button className="tombol garis" onClick={() => setPilih(null)} disabled={sibuk}>
              Pilih anggota lain
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="redup" style={{ margin: '16px 20px 0' }}>
            Anggota Dawis aktif yang belum punya rekening:
          </p>
          <div className="cari" style={{ marginTop: 12 }}>
            <Ikon nama="cari" ukuran={18} />
            <input
              type="search"
              aria-label="Cari anggota"
              placeholder="Cari nama atau nomor rumah"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />
          </div>
          {pesan && <p className="galat" style={{ margin: '12px 20px' }}>{pesan}</p>}
          <div className="daftar" style={{ marginTop: 12 }}>
            {warga === null && <p className="redup" style={{ padding: '14px 0' }}>Memuat…</p>}
            {warga !== null && tampil.length === 0 && (
              <p className="redup" style={{ padding: '14px 0' }}>
                {warga.length === 0 ? 'Semua anggota aktif sudah punya rekening.' : 'Tidak ditemukan.'}
              </p>
            )}
            {tampil.map((w) => (
              <button key={w.id} className="baris" onClick={() => setPilih(w)}>
                <span className="avatar">{inisial(w.nama_kk)}</span>
                <span className="isi">
                  <span className="nama">{w.nama_kk}</span>
                  <span className="redup kecil">Rumah {w.no_rumah}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  )
}