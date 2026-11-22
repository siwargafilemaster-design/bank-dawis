'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { usePengguna } from '@/lib/sesi'
import { ambilRekening, ambilMutasi, sudahKeluar, type Rekening, type Mutasi } from '@/lib/bank'
import { rupiah, tanggalJam, LABEL_JENIS, JENIS_MASUK } from '@/lib/format'
import { Ikon } from '@/components/ikon'

export default function DetailRekening() {
  const { id } = useParams<{ id: string }>()
  const { pengguna, galat } = usePengguna('teller')
  const [rek, setRek] = useState<Rekening | null>(null)
  const [mutasi, setMutasi] = useState<Mutasi[]>([])
  const [pesan, setPesan] = useState('Memuat…')

  useEffect(() => {
    if (!pengguna) return
    Promise.all([ambilRekening(id), ambilMutasi(id)])
      .then(([r, m]) => {
        if (!r) {
          setPesan('Rekening tidak ditemukan.')
          return
        }
        setRek(r)
        setMutasi(m)
        setPesan('')
      })
      .catch((e) => setPesan('Gagal memuat: ' + e.message))
  }, [pengguna, id])

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>

  if (!rek) {
    return (
      <main className="layar">
        <div className="atas">
          <Link href="/teller" aria-label="Kembali"><Ikon nama="kembali" ukuran={22} /></Link>
          <h1>Rekening</h1>
        </div>
        <p className="redup" style={{ padding: 20 }}>{pesan}</p>
      </main>
    )
  }

  const dikoreksi = new Set(
    mutasi.map((m) => m.koreksi_dari).filter((x): x is number => x !== null)
  )
  const aktif = rek.status === 'aktif'

  return (
    <main className="layar">
      <div style={{ background: 'var(--utama)', color: '#fff', padding: '16px 12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/teller" aria-label="Kembali" className="tombol-ikon" style={{ background: 'none' }}>
            <Ikon nama="kembali" ukuran={22} />
          </Link>
          <h1 style={{ fontSize: 17, fontWeight: 600 }}>{rek.warga?.nama_kk}</h1>
        </div>
        <div style={{ padding: '8px 12px 0' }}>
          <span style={{ fontSize: 12, color: '#CDE9F1' }}>
            {rek.warga?.no_rumah} · {rek.no_rekening} · {aktif ? 'aktif' : 'DITUTUP'}
          </span>
          <p style={{ fontSize: 30, fontWeight: 700, marginTop: 6 }}>{rupiah(rek.saldo)}</p>
        </div>
      </div>

      {aktif && sudahKeluar(rek.warga) && (
        <div className="spanduk bahaya">
          <Ikon nama="info" ukuran={18} />
          Anggota ini sudah keluar dari Dawis. Segera lakukan penutupan rekening.
        </div>
      )}

      {aktif && (
        <div className="dua-kolom" style={{ margin: '16px 20px 0', gap: 12 }}>
          <Link href={`/teller/rekening/${rek.id}/setor`} className="tombol">
            <Ikon nama="masuk" ukuran={20} />Setor
          </Link>
          <Link href={`/teller/rekening/${rek.id}/tarik`} className="tombol garis">
            <Ikon nama="keluar" ukuran={20} />Tarik
          </Link>
        </div>
      )}

      <div className="judul-bagian">
        <span>Mutasi</span>
        <span className="redup kecil">{mutasi.length} terakhir</span>
      </div>

      <div className="daftar">
        {mutasi.length === 0 && <p className="redup" style={{ padding: '14px 0' }}>Belum ada transaksi.</p>}
        {mutasi.map((m) => {
          const masuk = JENIS_MASUK.has(m.jenis)
          const coret = dikoreksi.has(m.id)
          return (
            <div key={m.id} className="baris">
              <span className="isi">
                <span className={coret ? 'nama coret' : 'nama'}>{LABEL_JENIS[m.jenis] ?? m.jenis}</span>
                <span className="redup kecil">
                  {tanggalJam(m.dibuat)}
                  {coret && ' · dikoreksi'}
                  {m.catatan && ` · ${m.catatan}`}
                </span>
              </span>
              <span className="kanan">
                <span className={`tebal ${coret ? 'coret' : masuk ? 'teks-hijau' : 'teks-merah'}`} style={{ fontSize: 14 }}>
                  {masuk ? '+' : '−'}{rupiah(m.nominal)}
                </span>
                <span className="redup kecil">{rupiah(m.saldo_setelah)}</span>
              </span>
            </div>
          )
        })}
      </div>
    </main>
  )
}