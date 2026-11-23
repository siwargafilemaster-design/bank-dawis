'use client'

import { useEffect, useState } from 'react'
import { usePengguna } from '@/lib/sesi'
import {
  rekeningSaya, mutasiBulan, saldoSebelum, idDikoreksi,
  type RekeningSaya, type Mutasi,
} from '@/lib/bank'
import {
  rupiah, jamSaja, tanggalKelompok, periodeSekarang, periodeDari,
  geserPeriode, awalPeriodeISO, namaPeriode, namaPeriodePendek,
  LABEL_JENIS, JENIS_MASUK,
} from '@/lib/format'
import { unduhStatement } from '@/lib/statement'
import { Ikon } from '@/components/ikon'
import { NavNasabah } from '@/components/nav-nasabah'

export default function MutasiNasabah() {
  const { pengguna, galat } = usePengguna()
  const [rek, setRek] = useState<RekeningSaya | null | undefined>(undefined)
  const [daftarPeriode, setDaftarPeriode] = useState<string[]>([])
  const [periode, setPeriode] = useState('')
  const [mutasi, setMutasi] = useState<Mutasi[] | null>(null)
  const [saldoAwal, setSaldoAwal] = useState(0)
  const [dikoreksi, setDikoreksi] = useState<Set<number>>(new Set())
  const [mengunduh, setMengunduh] = useState(false)
  const [pesan, setPesan] = useState('')

  // 1. ambil rekening + susun daftar bulan (sejak rekening dibuka, maks 12)
  useEffect(() => {
    if (!pengguna) return
    const wargaId = pengguna.warga_id
    async function muat() {
      try {
        const r = wargaId ? await rekeningSaya(wargaId) : null
        setRek(r)
        if (!r) return
        const awal = periodeDari(r.dibuka_pada)
        const daftar: string[] = []
        let p = periodeSekarang()
        while (daftar.length < 12) {
          daftar.push(p)
          if (p <= awal) break
          p = geserPeriode(p, -1)
        }
        setDaftarPeriode(daftar) // terbaru di depan
        setPeriode(daftar[0])
      } catch (e) {
        setPesan('Gagal memuat: ' + (e as Error).message)
      }
    }
    muat()
  }, [pengguna])

  // 2. ambil mutasi bulan terpilih
  useEffect(() => {
    if (!rek || !periode) return
    const rekId = rek.id
    setMutasi(null)
    Promise.all([
      mutasiBulan(rekId, periode),
      saldoSebelum(rekId, awalPeriodeISO(periode)),
      idDikoreksi(rekId),
    ])
      .then(([m, s, k]) => {
        setMutasi(m)
        setSaldoAwal(s)
        setDikoreksi(k)
      })
      .catch((e) => setPesan('Gagal memuat: ' + e.message))
  }, [rek, periode])

  async function unduh() {
    if (!rek || !mutasi || !pengguna) return
    setMengunduh(true)
    try {
      await unduhStatement({
        nama: pengguna.nama,
        noRekening: rek.no_rekening,
        periode,
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

  // ringkasan & pengelompokan per tanggal (terbaru di atas)
  let masuk = 0
  let keluar = 0
  for (const m of mutasi ?? []) {
    if (JENIS_MASUK.has(m.jenis)) masuk += m.nominal
    else keluar += m.nominal
  }
  const kelompok: { tanggal: string; isi: Mutasi[] }[] = []
  for (const m of [...(mutasi ?? [])].reverse()) {
    const t = tanggalKelompok(m.dibuat)
    const akhir = kelompok[kelompok.length - 1]
    if (akhir && akhir.tanggal === t) akhir.isi.push(m)
    else kelompok.push({ tanggal: t, isi: [m] })
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
            {daftarPeriode.map((p) => (
              <button key={p} className={p === periode ? 'chip pilih' : 'chip'} onClick={() => setPeriode(p)}>
                {p === periode ? namaPeriode(p) : namaPeriodePendek(p)}
              </button>
            ))}
          </div>

          <div className="dua-kolom" style={{ margin: '16px 20px 0', gap: 12 }}>
            <div className="kartu" style={{ margin: 0 }}>
              <span className="redup kecil">Uang masuk</span>
              <p className="teks-hijau tebal" style={{ fontSize: 17, marginTop: 4 }}>{rupiah(masuk)}</p>
            </div>
            <div className="kartu" style={{ margin: 0 }}>
              <span className="redup kecil">Uang keluar</span>
              <p className="teks-merah tebal" style={{ fontSize: 17, marginTop: 4 }}>{rupiah(keluar)}</p>
            </div>
          </div>

          {pesan && <p className="galat" style={{ margin: '12px 20px' }}>{pesan}</p>}
          {mutasi === null && <p className="redup" style={{ padding: 20 }}>Memuat…</p>}
          {mutasi?.length === 0 && (
            <p className="redup" style={{ padding: 20, textAlign: 'center' }}>
              Tidak ada transaksi di {namaPeriode(periode)}.
            </p>
          )}

          {kelompok.map((k) => (
            <div key={k.tanggal}>
              <p className="tanggal-kelompok">{k.tanggal}</p>
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
                          {jamSaja(m.dibuat)}
                          {coret && ' · dikoreksi'}
                          {m.catatan && ` · ${m.catatan}`}
                          {m.teller_nama && ` · ${m.teller_nama}`}
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
              {mengunduh ? 'Membuat PDF…' : `Unduh e-Statement ${namaPeriodePendek(periode)}`}
            </button>
          </div>
        </>
      )}

      <NavNasabah />
    </main>
  )
}