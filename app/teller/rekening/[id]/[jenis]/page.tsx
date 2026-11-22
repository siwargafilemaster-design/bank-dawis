'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { usePengguna } from '@/lib/sesi'
import { ambilRekening, simpanTransaksi, type Rekening, type Mutasi } from '@/lib/bank'
import { rupiah, inisial } from '@/lib/format'
import { Ikon } from '@/components/ikon'

const CEPAT = [10000, 20000, 50000, 100000]
type Tahap = 'isi' | 'konfirmasi' | 'selesai'

export default function FormTransaksi() {
  const router = useRouter()
  const { id, jenis } = useParams<{ id: string; jenis: string }>()
  const { pengguna, galat } = usePengguna('teller')

  const [rek, setRek] = useState<Rekening | null>(null)
  const [angka, setAngka] = useState('')
  const [catatan, setCatatan] = useState('')
  const [tahap, setTahap] = useState<Tahap>('isi')
  const [sibuk, setSibuk] = useState(false)
  const [pesan, setPesan] = useState('')
  const [hasil, setHasil] = useState<Mutasi | null>(null)

  // kunci anti tap-dobel: dibuat sekali saat pertama menyimpan,
  // dipakai ulang kalau simpan diulang (mis. sinyal putus)
  const kunci = useRef<string | null>(null)

  useEffect(() => {
    if (!pengguna) return
    ambilRekening(id)
      .then(setRek)
      .catch((e) => setPesan('Gagal memuat: ' + e.message))
  }, [pengguna, id])

  if (jenis !== 'setor' && jenis !== 'tarik') {
    return <main className="layar"><p style={{ padding: 20 }}>Halaman tidak dikenal.</p></main>
  }
  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>
  if (!rek) return <main className="layar"><p className="redup" style={{ padding: 20 }}>{pesan || 'Memuat…'}</p></main>

  const setor = jenis === 'setor'
  const judul = setor ? 'Setor tunai' : 'Tarik tunai'
  const nominal = Number(angka || 0)
  const saldoBaru = setor ? rek.saldo + nominal : rek.saldo - nominal
  const melebihi = !setor && nominal > rek.saldo
  const bolehLanjut = nominal > 0 && !melebihi && rek.status === 'aktif'

  function tekan(d: string) {
    setAngka((a) => (a + d).replace(/^0+/, '').slice(0, 9))
  }

  async function simpan() {
    if (sibuk || !rek) return
    setSibuk(true)
    setPesan('')
    if (!kunci.current) kunci.current = crypto.randomUUID()
    try {
      const m = await simpanTransaksi({
        rekeningId: rek.id,
        jenis: setor ? 'setor' : 'tarik',
        nominal,
        kunci: kunci.current,
        catatan,
      })
      setHasil(m)
      setTahap('selesai')
    } catch (e) {
      setPesan((e as Error).message)
    } finally {
      setSibuk(false)
    }
  }

  // ---------- TAHAP 3: TERSIMPAN ----------
  if (tahap === 'selesai' && hasil) {
    return (
      <main className="layar-biru">
        <div className="struk">
          <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--hijau-muda)', color: 'var(--hijau)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ikon nama="cek" ukuran={32} />
          </span>
          <p style={{ fontSize: 20, fontWeight: 600, marginTop: 16 }}>Tersimpan</p>
          <p className="redup">{rek.warga?.nama_kk} · {rek.no_rekening}</p>
          <p className={setor ? 'teks-hijau' : 'teks-merah'} style={{ fontSize: 36, fontWeight: 700, marginTop: 16 }}>
            {setor ? '+' : '−'}{rupiah(hasil.nominal)}
          </p>
          <div className="rincian">
            <div><span className="tebal">Saldo sekarang</span><span className="tebal" style={{ fontSize: 18 }}>{rupiah(hasil.saldo_setelah)}</span></div>
          </div>
        </div>
        <div className="dorong" />
        <div style={{ display: 'grid', gap: 12 }}>
          <button className="tombol putih" onClick={() => router.replace(`/teller/rekening/${rek.id}`)}>
            Selesai
          </button>
          <button className="tombol garis-putih" onClick={() => router.replace('/teller')}>
            Ke beranda teller
          </button>
        </div>
      </main>
    )
  }

  // ---------- TAHAP 2: KONFIRMASI (diperlihatkan ke nasabah) ----------
  if (tahap === 'konfirmasi') {
    return (
      <main className="layar-biru">
        <p style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', color: '#CDE9F1', fontSize: 13, marginBottom: 20 }}>
          <Ikon nama="hp" ukuran={18} /> Tunjukkan layar ini ke nasabah
        </p>
        <div className="struk">
          <span className={`label-jenis ${jenis}`}>{setor ? 'SETORAN' : 'PENARIKAN'}</span>
          <p style={{ fontSize: 20, fontWeight: 600, marginTop: 18 }}>{rek.warga?.nama_kk}</p>
          <p className="redup">{rek.warga?.no_rumah} · {rek.no_rekening}</p>
          <p className={setor ? 'teks-hijau' : 'teks-merah'} style={{ fontSize: 44, fontWeight: 700, marginTop: 22 }}>
            {rupiah(nominal)}
          </p>
          <div className="rincian">
            <div><span className="redup" style={{ fontSize: 14 }}>Saldo sebelum</span><span>{rupiah(rek.saldo)}</span></div>
            <div><span className="tebal">Saldo sesudah</span><span className="tebal" style={{ fontSize: 18 }}>{rupiah(saldoBaru)}</span></div>
            {catatan.trim() && <div><span className="redup kecil">Catatan</span><span className="redup kecil">{catatan.trim()}</span></div>}
            <div><span className="redup kecil">Teller</span><span className="redup kecil">{pengguna?.nama}</span></div>
          </div>
        </div>
        <p className="catatan-biru">
          Pastikan nama dan nominal sudah benar. Setelah disimpan, kesalahan hanya bisa diperbaiki dengan koreksi.
        </p>
        {pesan && <p style={{ marginTop: 12, textAlign: 'center', background: '#fff', color: '#C62828', borderRadius: 12, padding: 10, fontSize: 14 }}>{pesan}</p>}
        <div className="dorong" />
        <div className="dua-kolom" style={{ gap: 12, marginTop: 20 }}>
          <button className="tombol garis-putih" onClick={() => setTahap('isi')} disabled={sibuk}>Ubah</button>
          <button className="tombol putih" onClick={simpan} disabled={sibuk}>
            {sibuk ? 'Menyimpan…' : 'Benar, simpan'}
          </button>
        </div>
      </main>
    )
  }

  // ---------- TAHAP 1: ISI NOMINAL ----------
  return (
    <main className="layar" style={{ background: '#fff', paddingBottom: 0 }}>
      <div className="atas">
        <Link href={`/teller/rekening/${rek.id}`} aria-label="Kembali"><Ikon nama="kembali" ukuran={22} /></Link>
        <h1>{judul}</h1>
      </div>

      <div className="kartu" style={{ background: 'var(--latar)', display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <span className="avatar">{inisial(rek.warga?.nama_kk ?? '?')}</span>
        <span style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{rek.warga?.nama_kk}</span>
          <span className="redup kecil">{rek.no_rekening} · saldo {rupiah(rek.saldo)}</span>
        </span>
        <Link href="/teller" className="tebal" style={{ fontSize: 13, color: 'var(--utama)' }}>Ganti</Link>
      </div>

      <p className="redup" style={{ textAlign: 'center', marginTop: 28 }}>
        Nominal {setor ? 'setoran' : 'penarikan'}
      </p>
      <p className="nominal" aria-live="polite">{rupiah(nominal)}</p>
      {melebihi && (
        <p className="teks-merah kecil tebal" style={{ textAlign: 'center' }}>
          Melebihi saldo ({rupiah(rek.saldo)})
        </p>
      )}

      <div className="chips">
        {CEPAT.map((n) => (
          <button
            key={n}
            className={nominal === n ? 'chip pilih' : 'chip'}
            onClick={() => setAngka(String(n))}
          >
            {n / 1000}rb
          </button>
        ))}
      </div>

      <div style={{ margin: '16px 20px 0' }}>
        <input
          className="isian"
          style={{ height: 46, fontSize: 14 }}
          aria-label="Catatan (opsional)"
          placeholder="Catatan (opsional)"
          maxLength={100}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />
      </div>

      <div className="dorong" />

      <div className="keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => tekan(d)}>{d}</button>
        ))}
        <button onClick={() => tekan('000')} style={{ fontSize: 18 }}>000</button>
        <button onClick={() => tekan('0')}>0</button>
        <button onClick={() => setAngka((a) => a.slice(0, -1))} aria-label="Hapus angka">
          <Ikon nama="hapus" />
        </button>
      </div>
      <div className="bawah">
        <button className="tombol" disabled={!bolehLanjut} onClick={() => setTahap('konfirmasi')}>
          Lanjut
        </button>
      </div>
    </main>
  )
}