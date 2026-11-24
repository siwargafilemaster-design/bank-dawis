'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { usePengguna } from '@/lib/sesi'
import {
  ambilRekening, ambilMutasi, sudahKeluar, statusAkun,
  kelolaAkun, koreksiMutasi, tutupRekening, bukaKembali,
  type Rekening, type Mutasi,
} from '@/lib/bank'
import { rupiah, tanggalJam, hpTampil, pinLemah, LABEL_JENIS, JENIS_MASUK } from '@/lib/format'
import { Ikon } from '@/components/ikon'
import { Lembar } from '@/components/lembar'
import { Memuat } from '@/components/memuat'
import { KotakPin } from '@/components/kotak-pin'

type Akun = { ada: boolean; wajibGantiPin: boolean }
type LembarAktif =
  | null
  | { jenis: 'akun'; aksi: 'buat' | 'reset' }
  | { jenis: 'koreksi'; m: Mutasi }
  | { jenis: 'tutup' }
  | { jenis: 'bukaKembali' }

export default function DetailRekening() {
  const { id } = useParams<{ id: string }>()
  const { pengguna, galat } = usePengguna('teller')
  const [rek, setRek] = useState<Rekening | null>(null)
  const [mutasi, setMutasi] = useState<Mutasi[]>([])
  const [akun, setAkun] = useState<Akun | null>(null)
  const [pesan, setPesan] = useState('Memuat…')
  const [lembar, setLembar] = useState<LembarAktif>(null)
  const [info, setInfo] = useState('')

  const muat = useCallback(async () => {
    try {
      const r = await ambilRekening(id)
      if (!r) {
        setPesan('Rekening tidak ditemukan.')
        return
      }
      const [m, a] = await Promise.all([ambilMutasi(id), statusAkun(r.warga_id)])
      setRek(r)
      setMutasi(m)
      setAkun(a)
      setPesan('')
    } catch (e) {
      setPesan('Gagal memuat: ' + (e as Error).message)
    }
  }, [id])

  useEffect(() => {
    if (pengguna) muat()
  }, [pengguna, muat])

  function selesai(teks: string) {
    setLembar(null)
    setInfo(teks)
    muat()
  }

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>

    if (!rek) {
    if (pesan === 'Memuat…') return <Memuat />
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
  const keluarDawis = sudahKeluar(rek.warga)
  const milikSendiri = rek.warga_id === pengguna?.warga_id

  return (
    <main className="layar">
      {/* ---------- KEPALA ---------- */}
      <div style={{ background: aktif ? 'var(--utama)' : '#5E6B76', color: '#fff', padding: '16px 12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/teller" aria-label="Kembali" className="tombol-ikon" style={{ background: 'none' }}>
            <Ikon nama="kembali" ukuran={22} />
          </Link>
          <h1 style={{ fontSize: 17, fontWeight: 600 }}>{rek.warga?.nama_kk}</h1>
        </div>
        <div style={{ padding: '8px 12px 0' }}>
          <span style={{ fontSize: 12, color: '#E3EAF0' }}>
            {rek.warga?.no_rumah} · {rek.no_rekening} · {aktif ? 'aktif' : 'DITUTUP'}
          </span>
          <p style={{ fontSize: 30, fontWeight: 700, marginTop: 6 }}>{rupiah(rek.saldo)}</p>
        </div>
      </div>

      {info && (
        <div className="spanduk info">
          <Ikon nama="cek" ukuran={18} />
          {info}
        </div>
      )}

      {aktif && keluarDawis && (
        <div className="spanduk bahaya">
          <Ikon nama="info" ukuran={18} />
          Anggota ini sudah keluar dari Dawis. Segera lakukan penutupan rekening.
        </div>
      )}

      {/* ---------- SETOR / TARIK ---------- */}
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

      {/* ---------- BUKA KEMBALI ---------- */}
      {!aktif && (
        <div style={{ margin: '16px 20px 0' }}>
          {keluarDawis ? (
            <p className="redup kecil" style={{ textAlign: 'center' }}>
              Anggota ini sudah keluar dari Dawis, jadi rekening tidak bisa dibuka kembali.
            </p>
          ) : (
            <button className="tombol garis" onClick={() => setLembar({ jenis: 'bukaKembali' })}>
              Buka kembali rekening
            </button>
          )}
        </div>
      )}

      {/* ---------- AKSES APLIKASI ---------- */}
      {akun && (
        <div className="kotak-akses">
          <span className="titik" style={{ background: akun.ada ? 'var(--hijau)' : '#C9D2D9' }} />
          <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {akun.ada ? 'Akses aplikasi aktif' : 'Belum punya akses aplikasi'}
            </span>
            <span className="redup kecil">
              {!akun.ada
                ? 'Tabungan tetap jalan lewat teller'
                : akun.wajibGantiPin
                  ? 'Menunggu nasabah mengganti PIN'
                  : `Login dengan ${hpTampil(rek.warga?.no_wa ?? '')}`}
            </span>
          </span>
          {!milikSendiri && (
            akun.ada ? (
              <button className="tombol-kecil" onClick={() => setLembar({ jenis: 'akun', aksi: 'reset' })}>
                Reset PIN
              </button>
            ) : (
              <button className="tombol-kecil" onClick={() => setLembar({ jenis: 'akun', aksi: 'buat' })}>
                Aktifkan
              </button>
            )
          )}
        </div>
      )}

      {/* ---------- MUTASI ---------- */}
      <div className="judul-bagian">
        <span>Mutasi</span>
        <span className="redup kecil">
          {aktif ? 'Ketuk setoran/penarikan untuk koreksi' : `${mutasi.length} terakhir`}
        </span>
      </div>

      <div className="daftar">
        {mutasi.length === 0 && <p className="redup" style={{ padding: '14px 0' }}>Belum ada transaksi.</p>}
        {mutasi.map((m) => {
          const masuk = JENIS_MASUK.has(m.jenis)
          const coret = dikoreksi.has(m.id)
          const terkunci =
            !!rek.dibuka_kembali_pada &&
            new Date(m.dibuat).getTime() < new Date(rek.dibuka_kembali_pada).getTime()
          const bisaKoreksi =
            aktif && !coret && !terkunci && (m.jenis === 'setor' || m.jenis === 'tarik')
          return (
            <button
              key={m.id}
              className="baris"
              disabled={!bisaKoreksi}
              onClick={() => setLembar({ jenis: 'koreksi', m })}
            >
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
            </button>
          )
        })}
      </div>

      {/* ---------- TUTUP REKENING ---------- */}
      {aktif && (
        <div style={{ padding: '24px 20px 0' }}>
          <button className="tombol garis-bahaya" onClick={() => setLembar({ jenis: 'tutup' })}>
            Tutup rekening
          </button>
        </div>
      )}

      {/* ---------- LEMBAR-LEMBAR ---------- */}
      {lembar?.jenis === 'akun' && (
        <LembarAkun aksi={lembar.aksi} rek={rek} tutup={() => setLembar(null)} selesai={selesai} />
      )}
      {lembar?.jenis === 'koreksi' && (
        <LembarKoreksi m={lembar.m} saldo={rek.saldo} tutup={() => setLembar(null)} selesai={selesai} />
      )}
      {lembar?.jenis === 'tutup' && (
        <LembarTutup rek={rek} tutup={() => setLembar(null)} selesai={selesai} />
      )}
      {lembar?.jenis === 'bukaKembali' && (
        <LembarBukaKembali rek={rek} tutup={() => setLembar(null)} selesai={selesai} />
      )}
    </main>
  )
}

// =====================================================================
// LEMBAR: AKTIFKAN AKSES / RESET PIN
// =====================================================================
function LembarAkun({
  aksi, rek, tutup, selesai,
}: {
  aksi: 'buat' | 'reset'
  rek: Rekening
  tutup: () => void
  selesai: (teks: string) => void
}) {
  const [pin, setPin] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')
  const buat = aksi === 'buat'

  async function kirim() {
    if (!/^\d{6}$/.test(pin)) return setGalat('PIN harus 6 angka')
    if (pinLemah(pin)) return setGalat('PIN terlalu mudah ditebak. Pilih angka lain.')

    setSibuk(true)
    setGalat('')
    try {
      await kelolaAkun(aksi, rek.warga_id, pin)
      selesai(
        buat
          ? `Akses aplikasi aktif. Sampaikan PIN awal ${pin} ke nasabah.`
          : `PIN direset. Sampaikan PIN sementara ${pin} ke nasabah.`
      )
    } catch (e) {
      setGalat((e as Error).message)
      setSibuk(false)
    }
  }

  return (
    <Lembar judul={buat ? 'Aktifkan akses aplikasi' : 'Reset PIN'} tutup={tutup}>
      <p style={{ fontSize: 14, lineHeight: 1.6 }}>
        <b>{rek.warga?.nama_kk}</b> akan login dengan nomor{' '}
        <b>{hpTampil(rek.warga?.no_wa ?? '')}</b>.
      </p>

      <label className="label" htmlFor="pin-awal">
        {buat ? 'PIN awal' : 'PIN sementara'} (6 angka)
      </label>
       <KotakPin id="pin-awal" value={pin} onChange={setPin} label="PIN 6 angka" tampak />
      <p className="redup kecil" style={{ marginTop: 8, lineHeight: 1.5 }}>
        PIN ini terlihat oleh teller, jadi nasabah <b>wajib</b> menggantinya saat login berikutnya.
      </p>

      {galat && <p className="galat">{galat}</p>}

      <button className="tombol" style={{ marginTop: 20 }} onClick={kirim} disabled={sibuk}>
        {sibuk ? 'Memproses…' : buat ? 'Aktifkan' : 'Reset PIN'}
      </button>
    </Lembar>
  )
}

// =====================================================================
// LEMBAR: KOREKSI
// =====================================================================
function LembarKoreksi({
  m, saldo, tutup, selesai,
}: {
  m: Mutasi
  saldo: number
  tutup: () => void
  selesai: (teks: string) => void
}) {
  const [alasan, setAlasan] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')

  const batalSetor = m.jenis === 'setor'
  const saldoBaru = batalSetor ? saldo - m.nominal : saldo + m.nominal

  async function kirim() {
    if (!alasan.trim()) return setGalat('Alasan koreksi wajib diisi')
    setSibuk(true)
    setGalat('')
    try {
      await koreksiMutasi(m.id, alasan)
      selesai(`${LABEL_JENIS[m.jenis]} ${rupiah(m.nominal)} sudah dikoreksi.`)
    } catch (e) {
      setGalat((e as Error).message)
      setSibuk(false)
    }
  }

  return (
    <Lembar judul={`Koreksi ${LABEL_JENIS[m.jenis].toLowerCase()}`} tutup={tutup}>
      <div className="ringkas">
        <div><span className="redup">Transaksi</span><span>{LABEL_JENIS[m.jenis]} · {tanggalJam(m.dibuat)}</span></div>
        <div><span className="redup">Nominal</span><span className="tebal">{rupiah(m.nominal)}</span></div>
        <div><span className="redup">Saldo sekarang</span><span>{rupiah(saldo)}</span></div>
        <div><span className="tebal">Saldo setelah koreksi</span><span className="tebal">{rupiah(saldoBaru)}</span></div>
      </div>

      <p className="redup kecil" style={{ marginTop: 12, lineHeight: 1.5 }}>
        Transaksi asli tidak dihapus. Sistem mencatat transaksi pembalik, dan nasabah serta pengawas bisa melihat koreksi ini beserta alasannya.
      </p>

      <label className="label" htmlFor="alasan">Alasan koreksi</label>
      <input
        id="alasan"
        className="isian"
        style={{ fontSize: 15 }}
        placeholder="mis. salah ketik nominal"
        maxLength={100}
        value={alasan}
        onChange={(e) => setAlasan(e.target.value)}
      />

      {galat && <p className="galat">{galat}</p>}

      <button className="tombol bahaya" style={{ marginTop: 20 }} onClick={kirim} disabled={sibuk || !alasan.trim()}>
        {sibuk ? 'Memproses…' : 'Koreksi transaksi ini'}
      </button>
    </Lembar>
  )
}

// =====================================================================
// LEMBAR: TUTUP REKENING
// =====================================================================
function LembarTutup({
  rek, tutup, selesai,
}: {
  rek: Rekening
  tutup: () => void
  selesai: (teks: string) => void
}) {
  const [catatan, setCatatan] = useState('')
  const [sudahSerah, setSudahSerah] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')
  const adaSaldo = rek.saldo > 0

  async function kirim() {
    setSibuk(true)
    setGalat('')
    try {
      await tutupRekening(rek.id, catatan)
      selesai(`Rekening ${rek.no_rekening} sudah ditutup.`)
    } catch (e) {
      setGalat((e as Error).message)
      setSibuk(false)
    }
  }

  return (
    <Lembar judul="Tutup rekening" tutup={tutup}>
      <div className="ringkas">
        <div><span className="redup">Nasabah</span><span>{rek.warga?.nama_kk}</span></div>
        <div><span className="redup">Rekening</span><span>{rek.no_rekening}</span></div>
        <div><span className="tebal">Uang dikembalikan</span><span className="tebal">{rupiah(rek.saldo)}</span></div>
      </div>

      <p className="redup kecil" style={{ marginTop: 12, lineHeight: 1.5 }}>
        Sisa saldo dicatat sebagai <b>penarikan penutupan</b>. Rekening bisa dibuka kembali nanti (mulai dari Rp 0) selama anggota belum keluar dari Dawis.
      </p>

      <label className="label" htmlFor="cat-tutup">Catatan (opsional)</label>
      <input
        id="cat-tutup"
        className="isian"
        style={{ fontSize: 15 }}
        placeholder="mis. pindah rumah"
        maxLength={100}
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
      />

      {adaSaldo && (
        <label className="centang">
          <input type="checkbox" checked={sudahSerah} onChange={(e) => setSudahSerah(e.target.checked)} />
          Uang tunai {rupiah(rek.saldo)} sudah saya serahkan dan diterima oleh nasabah.
        </label>
      )}

      {galat && <p className="galat">{galat}</p>}

      <button
        className="tombol bahaya"
        style={{ marginTop: 20 }}
        onClick={kirim}
        disabled={sibuk || (adaSaldo && !sudahSerah)}
      >
        {sibuk ? 'Memproses…' : 'Tutup rekening'}
      </button>
    </Lembar>
  )
}

// =====================================================================
// LEMBAR: BUKA KEMBALI (baru di Tahap 4)
// =====================================================================
function LembarBukaKembali({
  rek, tutup, selesai,
}: {
  rek: Rekening
  tutup: () => void
  selesai: (teks: string) => void
}) {
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')

  async function kirim() {
    setSibuk(true)
    setGalat('')
    try {
      await bukaKembali(rek.id)
      selesai(`Rekening ${rek.no_rekening} aktif kembali.`)
    } catch (e) {
      setGalat((e as Error).message)
      setSibuk(false)
    }
  }

  return (
    <Lembar judul="Buka kembali rekening" tutup={tutup}>
      <div className="ringkas">
        <div><span className="redup">Nasabah</span><span>{rek.warga?.nama_kk}</span></div>
        <div><span className="redup">Rekening</span><span>{rek.no_rekening}</span></div>
        <div><span className="tebal">Saldo awal</span><span className="tebal">Rp 0</span></div>
      </div>

      <p className="redup kecil" style={{ marginTop: 12, lineHeight: 1.5 }}>
        Rekening diaktifkan lagi dengan nomor dan riwayat yang sama. Kalau rekening ini tertutup karena salah tekan, minta nasabah menyerahkan kembali uangnya lalu catat lewat <b>Setor</b>.
      </p>

      {galat && <p className="galat">{galat}</p>}

      <button className="tombol" style={{ marginTop: 20 }} onClick={kirim} disabled={sibuk}>
        {sibuk ? 'Memproses…' : 'Ya, buka kembali'}
      </button>
    </Lembar>
  )
}