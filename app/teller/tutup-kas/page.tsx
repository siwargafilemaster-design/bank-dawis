'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePengguna } from '@/lib/sesi'
import {
  daftarRekening, ringkasanHariIni, riwayatTutupKas, tutupKasHarian,
  type TutupKas,
} from '@/lib/bank'
import { rupiah, tanggalJam } from '@/lib/format'
import { Ikon } from '@/components/ikon'
import { Memuat } from '@/components/memuat'

export default function TutupKasPage() {
  const { pengguna, galat } = usePengguna('teller')
  const [sistem, setSistem] = useState<number | null>(null)
  const [hari, setHari] = useState({ masuk: 0, keluar: 0, nMasuk: 0, nKeluar: 0 })
  const [riwayat, setRiwayat] = useState<TutupKas[]>([])
  const [fisik, setFisik] = useState('')
  const [catatan, setCatatan] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [pesan, setPesan] = useState('')
  const [hasil, setHasil] = useState<TutupKas | null>(null)

  async function muat() {
    const [r, h, t] = await Promise.all([daftarRekening(), ringkasanHariIni(), riwayatTutupKas(10)])
    setSistem(r.filter((x) => x.status === 'aktif').reduce((s, x) => s + x.saldo, 0))
    setHari(h)
    setRiwayat(t)
  }

  useEffect(() => {
    if (!pengguna) return
    muat().catch((e) => setPesan('Gagal memuat: ' + e.message))
  }, [pengguna])

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>
  if (sistem === null && !pesan) return <Memuat />

  const nilaiFisik = fisik === '' ? null : Number(fisik)
  const selisih = nilaiFisik === null || sistem === null ? null : nilaiFisik - sistem
  const perluCatatan = selisih !== null && selisih !== 0

  async function simpan() {
    if (nilaiFisik === null) return setPesan('Isi jumlah uang yang dipegang')
    if (perluCatatan && !catatan.trim()) return setPesan('Ada selisih, catatan wajib diisi')
    setSibuk(true)
    setPesan('')
    try {
      const k = await tutupKasHarian(nilaiFisik, catatan)
      setHasil(k)
      setFisik('')
      setCatatan('')
      await muat()
    } catch (e) {
      setPesan((e as Error).message)
    } finally {
      setSibuk(false)
    }
  }

  return (
    <main className="layar">
      <div className="atas">
        <Link href="/teller" aria-label="Kembali"><Ikon nama="kembali" ukuran={22} /></Link>
        <h1>Tutup kas</h1>
      </div>

      {hasil && (
        <div className={`spanduk ${hasil.selisih === 0 ? 'info' : 'bahaya'}`}>
          <Ikon nama={hasil.selisih === 0 ? 'cek' : 'info'} ukuran={18} />
          {hasil.selisih === 0
            ? 'Tersimpan. Uang cocok dengan catatan sistem.'
            : `Tersimpan dengan selisih ${rupiah(hasil.selisih)}. Pengawas bisa melihat catatannya.`}
        </div>
      )}

      <div className="kartu" style={{ marginTop: 16 }}>
        <p className="redup">Seharusnya dipegang (total saldo semua rekening)</p>
        <p className="angka-besar" style={{ marginBottom: 10 }}>{rupiah(sistem ?? 0)}</p>
        <div className="dua-kolom">
          <div className="kotak-hijau kecil">Masuk hari ini · {hari.nMasuk}x<b>{rupiah(hari.masuk)}</b></div>
          <div className="kotak-merah kecil">Keluar hari ini · {hari.nKeluar}x<b>{rupiah(hari.keluar)}</b></div>
        </div>
      </div>

      <div className="kartu" style={{ marginTop: 16 }}>
        <label className="label" htmlFor="fisik" style={{ marginTop: 0 }}>Uang yang benar-benar dipegang</label>
        <input
          id="fisik"
          className="isian"
          inputMode="numeric"
          placeholder="0"
          value={fisik}
          onChange={(e) => setFisik(e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 10))}
        />
        <p className="redup kecil" style={{ marginTop: 6 }}>
          {nilaiFisik !== null ? rupiah(nilaiFisik) : 'Hitung tunai + saldo di rekening bank/e-wallet (kalau ada).'}
        </p>

        {selisih !== null && (
          <p style={{ marginTop: 12 }}>
            <span className={`lencana-status ${selisih === 0 ? 'cocok' : 'selisih'}`} style={{ fontSize: 13, padding: '4px 10px' }}>
              {selisih === 0 ? 'Cocok' : selisih > 0 ? `Lebih ${rupiah(selisih)}` : `Kurang ${rupiah(-selisih)}`}
            </span>
          </p>
        )}

        <label className="label" htmlFor="cat-kas">
          Catatan {perluCatatan ? '(wajib karena ada selisih)' : '(opsional)'}
        </label>
        <input
          id="cat-kas"
          className="isian"
          style={{ fontSize: 15 }}
          maxLength={150}
          placeholder={perluCatatan ? 'mis. ada uang kembalian belum dicatat' : ''}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />

        {pesan && <p className="galat">{pesan}</p>}

        <button
          className="tombol"
          style={{ marginTop: 20 }}
          onClick={simpan}
          disabled={sibuk || nilaiFisik === null || (perluCatatan && !catatan.trim())}
        >
          {sibuk ? 'Menyimpan…' : 'Simpan tutup kas'}
        </button>
      </div>

      <p className="judul-bagian">Riwayat tutup kas</p>
      <div className="daftar">
        {riwayat.length === 0 && <p className="redup" style={{ padding: '14px 0' }}>Belum ada.</p>}
        {riwayat.map((k) => (
          <div key={k.id} className="baris" style={{ justifyContent: 'space-between' }}>
            <span className="isi">
              <span className="nama">{tanggalJam(k.dibuat)}</span>
              <span className="redup kecil">Dipegang {rupiah(k.uang_fisik)} · sistem {rupiah(k.saldo_sistem)}</span>
            </span>
            <span className={`lencana-status ${k.selisih === 0 ? 'cocok' : 'selisih'}`}>
              {k.selisih === 0 ? 'Cocok' : rupiah(k.selisih)}
            </span>
          </div>
        ))}
      </div>
    </main>
  )
}