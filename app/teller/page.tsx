'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePengguna, keluar } from '@/lib/sesi'
import { daftarRekening, ringkasanHariIni, sudahKeluar, type Rekening } from '@/lib/bank'
import { rupiah, tanggalHariIni, inisial } from '@/lib/format'
import { Ikon } from '@/components/ikon'

type Mode = null | 'setor' | 'tarik'

export default function TellerBeranda() {
  const { pengguna, galat } = usePengguna('teller')
  const [rek, setRek] = useState<Rekening[] | null>(null)
  const [hari, setHari] = useState({ masuk: 0, keluar: 0, nMasuk: 0, nKeluar: 0 })
  const [cari, setCari] = useState('')
  const [mode, setMode] = useState<Mode>(null)
  const [pesan, setPesan] = useState('')
  const [tgl, setTgl] = useState('')
  const [lihatTutup, setLihatTutup] = useState(false)

  useEffect(() => {
    setTgl(tanggalHariIni())
  }, [])

  useEffect(() => {
    if (!pengguna) return
    Promise.all([daftarRekening(), ringkasanHariIni()])
      .then(([r, h]) => {
        setRek(r)
        setHari(h)
      })
      .catch((e) => setPesan('Gagal memuat: ' + e.message))
  }, [pengguna])

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>

  const aktif = (rek ?? []).filter((r) => r.status === 'aktif')
  const ditutup = (rek ?? []).filter((r) => r.status === 'ditutup')
  const total = aktif.reduce((s, r) => s + r.saldo, 0)
  const q = cari.trim().toLowerCase()
  const cocok = (r: Rekening) =>
    !q ||
    r.no_rekening.toLowerCase().includes(q) ||
    !!r.warga?.nama_kk.toLowerCase().includes(q) ||
    !!r.warga?.no_rumah.toLowerCase().includes(q)
  const tampil = aktif.filter(cocok)
  const tampilTutup = ditutup.filter(cocok)

  function gantiMode(m: Mode) {
    setMode((lama) => (lama === m ? null : m))
  }

  return (
    <main className="layar">
      <div className="kepala">
        <div className="kepala-baris">
          <Image src="/ikon.jpg" alt="" width={40} height={40} />
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <span className="lencana">TELLER</span>
            <span style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
              {pengguna?.nama ?? '…'}
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#CDE9F1' }}>{tgl}</span>
          <button className="tombol-ikon" onClick={keluar} aria-label="Keluar">
            <Ikon nama="logout" ukuran={20} />
          </button>
        </div>
      </div>

      <div className="kartu kartu-apung">
        <p className="redup">Total tabungan semua nasabah</p>
        <p className="angka-besar">{rek ? rupiah(total) : '…'}</p>
        <div className="dua-kolom">
          <div className="kotak-hijau kecil">
            Masuk hari ini · {hari.nMasuk}x
            <b>{rupiah(hari.masuk)}</b>
          </div>
          <div className="kotak-merah kecil">
            Keluar hari ini · {hari.nKeluar}x
            <b>{rupiah(hari.keluar)}</b>
          </div>
        </div>
      </div>

      <div className="menu-cepat">
        <button className={mode === 'setor' ? 'aktif' : ''} onClick={() => gantiMode('setor')}>
          <span className="ikon"><Ikon nama="masuk" /></span>Setor
        </button>
        <button className={mode === 'tarik' ? 'aktif' : ''} onClick={() => gantiMode('tarik')}>
          <span className="ikon"><Ikon nama="keluar" /></span>Tarik
        </button>
        <Link href="/teller/buka">
          <span className="ikon"><Ikon nama="tambahOrang" /></span>Buka Rek.
        </Link>
        <button disabled title="Tahap 5">
          <span className="ikon"><Ikon nama="kas" /></span>Tutup Kas
        </button>
      </div>

      {mode && (
        <div className="spanduk info">
          <Ikon nama="info" ukuran={18} />
          Pilih nasabah untuk {mode === 'setor' ? 'setoran' : 'penarikan'}.
        </div>
      )}

      {pengguna?.warga_id && !mode && (
        <Link href="/tabungan" className="spanduk info" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Ikon nama="orang" ukuran={18} />
            Lihat tabungan saya
          </span>
          <span className="tebal">›</span>
        </Link>
      )}

      <div className="cari">
        <Ikon nama="cari" ukuran={18} />
        <input
          type="search"
          aria-label="Cari nasabah"
          placeholder="Cari nama, rumah, atau no. rekening"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
        />
      </div>

      {pesan && <p className="galat" style={{ margin: '12px 20px' }}>{pesan}</p>}

      <div className="judul-bagian">
        <span>Nasabah</span>
        <span className="redup kecil">{aktif.length} rekening aktif</span>
      </div>

      <div className="daftar">
        {rek === null && <p className="redup" style={{ padding: '14px 0' }}>Memuat…</p>}
        {rek !== null && tampil.length === 0 && (
          <p className="redup" style={{ padding: '14px 0' }}>
            {aktif.length === 0 ? 'Belum ada rekening aktif. Tekan "Buka Rek." untuk mulai.' : 'Tidak ditemukan.'}
          </p>
        )}

        {tampil.map((r) => {
          const keluarDawis = sudahKeluar(r.warga)
          const tujuan = mode ? `/teller/rekening/${r.id}/${mode}` : `/teller/rekening/${r.id}`
          return (
            <Link key={r.id} href={tujuan} className="baris">
              <span className={keluarDawis ? 'avatar bahaya' : 'avatar'}>
                {inisial(r.warga?.nama_kk ?? '?')}
              </span>
              <span className="isi">
                <span className="nama">{r.warga?.nama_kk}</span>
                {keluarDawis ? (
                  <span className="kecil teks-merah tebal">Sudah keluar · segera tutup rekening</span>
                ) : (
                  <span className="redup kecil">{r.warga?.no_rumah} · {r.no_rekening}</span>
                )}
              </span>
              <span className="tebal" style={{ fontSize: 14 }}>{rupiah(r.saldo)}</span>
            </Link>
          )
        })}
      </div>

      {/* ---------- REKENING DITUTUP ---------- */}
      {ditutup.length > 0 && (
        <>
          <button
            className="judul-bagian"
            onClick={() => setLihatTutup((v) => !v)}
            aria-expanded={lihatTutup}
            style={{ background: 'none', border: 0, width: 'calc(100% - 40px)', marginTop: 24 }}
          >
            <span>Rekening ditutup ({ditutup.length})</span>
            <span className="redup kecil">{lihatTutup ? 'Sembunyikan' : 'Tampilkan'}</span>
          </button>
          {lihatTutup && (
            <div className="daftar">
              {tampilTutup.length === 0 && <p className="redup" style={{ padding: '14px 0' }}>Tidak ditemukan.</p>}
              {tampilTutup.map((r) => (
                <Link key={r.id} href={`/teller/rekening/${r.id}`} className="baris">
                  <span className="avatar" style={{ background: '#EDF1F4', color: 'var(--redup)' }}>
                    {inisial(r.warga?.nama_kk ?? '?')}
                  </span>
                  <span className="isi">
                    <span className="nama" style={{ color: 'var(--redup)' }}>{r.warga?.nama_kk}</span>
                    <span className="redup kecil">{r.warga?.no_rumah} · {r.no_rekening} · ditutup</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}