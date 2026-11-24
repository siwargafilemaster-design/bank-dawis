'use client'

import { useEffect, useState } from 'react'
import { usePengguna } from '@/lib/sesi'
import {
  rekeningSaya, mutasiTahun, saldoSebelum, idDikoreksi,
  type RekeningSaya, type Mutasi,
} from '@/lib/bank'
import {
  rupiah, jamSaja, tanggalPendek, judulBulan,
  tahunSekarang, tahunDari, awalTahunISO,
  LABEL_JENIS, JENIS_MASUK,
} from '@/lib/format'
import { unduhStatement } from '@/lib/statement'
import { Ikon } from '@/components/ikon'
import { NavNasabah } from '@/components/nav-nasabah'
import { Memuat } from '@/components/memuat'

export default function MutasiNasabah() {
  const { pengguna, galat } = usePengguna()
  const [rek, setRek] = useState<RekeningSaya | null | undefined>(undefined)
  const [daftarTahun, setDaftarTahun] = useState<number[]>([])
  const [tahun, setTahun] = useState(0)
  const [mutasi, setMutasi] = useState<Mutasi[] | null>(null)
  const [saldoAwal, setSaldoAwal] = useState(0)
  const [dikoreksi, setDikoreksi] = useState<Set<number>>(new Set())
  const [mengunduh, setMengunduh] = useState(false)
  const [pesan, setPesan] = useState('')

  // 1. rekening + daftar tahun sejak rekening dibuka
  useEffect(() => {
    if (!pengguna) return
    const wargaId = pengguna.warga_id
    async function muat() {
      try {
        const r = wargaId ? await rekeningSaya(wargaId) : null
        setRek(r)
        if (!r) return
        const awal = tahunDari(r.dibuka_pada)
        const daftar: number[] = []
        for (let t = tahunSekarang(); t >= awal; t--) daftar.push(t)
        setDaftarTahun(daftar) // terbaru di depan
        setTahun(daftar[0])
      } catch (e) {
        setPesan('Gagal memuat: ' + (e as Error).message)
      }
    }
    muat()
  }, [pengguna])

  // 2. mutasi tahun terpilih
  useEffect(() => {
    if (!rek || !tahun) return
    const rekId = rek.id
    setMutasi(null)
    Promise.all([
      mutasiTahun(rekId, tahun),
      saldoSebelum(rekId, awalTahunISO(tahun)),
      idDikoreksi(rekId),
    ])
      .then(([m, s, k]) => {
        setMutasi(m)
        setSaldoAwal(s)
        setDikoreksi(k)
      })
      .catch((e) => setPesan('Gagal memuat: ' + e.message))
  }, [rek, tahun])

  async function unduh() {
    if (!rek || !mutasi || !pengguna) return
    setMengunduh(true)
    try {
      await unduhStatement({
        nama: pengguna.nama,
        noRekening: rek.no_rekening,
        tahun,
        berjalan: tahun === tahunSekarang(),
        saldoAwal,
        mutasi,
        dikoreksi,
      })
    } catch (e) {
      setPesan('Gagal membuat PDF: ' + (e as Error).message)
    } finally {
      setMengunduh(false)
    }
  }

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>
  if (rek === undefined && !pesan) return <Memuat />

  // ringkasan & kelompok per bulan (terbaru di atas)
  let masuk = 0
  let keluar = 0
  for (const m of mutasi ?? []) {
    if (JENIS_MASUK.has(m.jenis)) masuk += m.nominal
    else keluar += m.nominal
  }
  const kelompok: { bulan: string; isi: Mutasi[] }[] = []
  for (const m of [...(mutasi ?? [])].reverse()) {
    const b = judulBulan(m.dibuat)
    const akhir = kelompok[kelompok.length - 1]
    if (akhir && akhir.bulan === b) akhir.isi.push(m)
    else kelompok.push({ bulan: b, isi: [m] })
  }

  return (
    <main className="layar nasabah">
      <div className="atas">
        <h1 style={{ paddingLeft: 8, flexGrow: 1 }}>Mutasi rekening</h1>
        <button onClick={unduh} disabled={!mutasi || mengunduh} aria-label="Unduh e-Statement" style={{ color: 'var(--utama)' }}>
          <Ikon nama="unduh" ukuran={22} />
        </button>
      </div>

      {rek === null && <p className="redup" style={{ padding: 20 }}>Belum punya rekening.</p>}

      {rek && (
        <>
          <div className="chips-bulan">
            {daftarTahun.map((t) => (
              <button key={t} className={t === tahun ? 'chip pilih' : 'chip'} onClick={() => setTahun(t)}>
                {t}
              </button>
            ))}
          </div>

          <div className="dua-kolom" style={{ margin: '16px 20px 0', gap: 12 }}>
            <div className="kartu" style={{ margin: 0 }}>
              <span className="redup kecil">Masuk {tahun}</span>
              <p className="teks-hijau tebal" style={{ fontSize: 17, marginTop: 4 }}>{rupiah(masuk)}</p>
            </div>
            <div className="kartu" style={{ margin: 0 }}>
              <span className="redup kecil">Keluar {tahun}</span>
              <p className="teks-merah tebal" style={{ fontSize: 17, marginTop: 4 }}>{rupiah(keluar)}</p>
            </div>
          </div>

          {pesan && <p className="galat" style={{ margin: '12px 20px' }}>{pesan}</p>}
          {mutasi === null && <p className="redup" style={{ padding: 20 }}>Memuat…</p>}
          {mutasi?.length === 0 && (
            <p className="redup" style={{ padding: 20, textAlign: 'center' }}>
              Tidak ada transaksi di tahun {tahun}.
            </p>
          )}

          {kelompok.map((k) => (
            <div key={k.bulan}>
              <p className="tanggal-kelompok">{k.bulan}</p>
              <div className="daftar">
                {k.isi.map((m) => {
                  const masukKah = JENIS_MASUK.has(m.jenis)
                  const coret = dikoreksi.has(m.id)
                  return (
                    <div key={m.id} className="baris" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span className={coret ? 'nama coret' : 'nama'}>{LABEL_JENIS[m.jenis] ?? m.jenis}</span>
                        <span className={`tebal ${coret ? 'coret' : masukKah ? 'teks-hijau' : 'teks-merah'}`} style={{ fontSize: 14 }}>
                          {masukKah ? '+' : '−'}{rupiah(m.nominal)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span className="redup kecil">
                          {tanggalPendek(m.dibuat)} · {jamSaja(m.dibuat)}
                          {coret && ' · dikoreksi'}
                          {m.catatan && ` · ${m.catatan}`}
                        </span>
                        <span className="redup kecil" style={{ whiteSpace: 'nowrap' }}>Saldo {rupiah(m.saldo_setelah)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div style={{ padding: '20px 20px 24px' }}>
            <button className="tombol garis" onClick={unduh} disabled={!mutasi || mengunduh}>
              <Ikon nama="unduh" ukuran={20} />
              {mengunduh ? 'Membuat PDF…' : `Unduh e-Statement ${tahun}`}
            </button>
          </div>
        </>
      )}

      <NavNasabah />
    </main>
  )
}