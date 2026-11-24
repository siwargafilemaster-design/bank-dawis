'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePengguna, keluar } from '@/lib/sesi'
import { rekeningSaya, ambilMutasi, kontakTeller, type RekeningSaya, type Mutasi } from '@/lib/bank'
import { rupiah, tanggalJam, salam, bacaLokal, tulisLokal, LABEL_JENIS, JENIS_MASUK } from '@/lib/format'
import { normalWa } from '@/lib/nomor'
import { Ikon } from '@/components/ikon'
import { NavNasabah } from '@/components/nav-nasabah'
import { Memuat } from '@/components/memuat'
import { IDENTITAS } from '@/lib/identitas'

export default function Tabungan() {
  const { pengguna, galat } = usePengguna()
  const [rek, setRek] = useState<RekeningSaya | null | undefined>(undefined)
  const [mutasi, setMutasi] = useState<Mutasi[]>([])
  const [batasBaru, setBatasBaru] = useState(Number.MAX_SAFE_INTEGER)
  const [sembunyi, setSembunyi] = useState(false)
  const [sapa, setSapa] = useState('Selamat datang')
  const [waTeller, setWaTeller] = useState<string | null>(null)
  const [pesan, setPesan] = useState('')

  // nilai yang tergantung jam/HP dihitung setelah tampil, bukan saat render
  useEffect(() => {
    setSapa(salam())
    setSembunyi(bacaLokal('bd-sembunyi') === '1')
  }, [])

  useEffect(() => {
    if (!pengguna) return
    const p = pengguna

    async function muat() {
      try {
        let r: RekeningSaya | null = null
        if (p.warga_id) r = await rekeningSaya(p.warga_id)
        setRek(r)

        if (r) {
          const m = await ambilMutasi(r.id, 5)
          setMutasi(m)

          // penanda BARU: mutasi yang id-nya lebih besar dari yang terakhir dilihat
          const kunci = `bd-terlihat-${p.user_id}`
          const lama = bacaLokal(kunci)
          setBatasBaru(lama === null ? Number.MAX_SAFE_INTEGER : Number(lama))
          if (m[0]) tulisLokal(kunci, String(m[0].id))
        }

        const t = await kontakTeller()
        if (t) {
          const teks = `Halo Bu ${t.nama}, saya ${p.nama}, nasabah Bank Dawis${r ? ' ' + r.no_rekening : ''}.`
          setWaTeller(`https://wa.me/${normalWa(t.no_wa)}?text=${encodeURIComponent(teks)}`)
        }
      } catch (e) {
        setPesan('Gagal memuat: ' + (e as Error).message)
      }
    }
    muat()
  }, [pengguna])

  function gantiSembunyi() {
    setSembunyi((s) => {
      tulisLokal('bd-sembunyi', s ? '0' : '1')
      return !s
    })
  }

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>
    if (rek === undefined && !pesan) return <Memuat />
    
  const teller = pengguna?.peran.includes('teller')
  const modeKerja = teller ? '/teller' : pengguna?.peran.includes('pengawas') ? '/pengawas' : null

  return (
    <main className="layar nasabah">
      {/* ---------- KEPALA ---------- */}
      <div className="kepala" style={{ paddingBottom: 96 }}>
        <div className="kepala-baris">
          <Image src="/ikon.jpg" alt="" width={40} height={40} />
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12, color: '#CDE9F1' }}>{sapa},</span>
            <span style={{ fontSize: 17, fontWeight: 600 }}>{pengguna?.nama ?? '…'}</span>
          </div>
          {modeKerja && (
            <Link href={modeKerja} className="tombol-ikon" aria-label={teller ? 'Mode teller' : 'Mode pengawas'}>
              <Ikon nama="tukar" ukuran={20} />
            </Link>
          )}
          <button className="tombol-ikon" onClick={keluar} aria-label="Keluar">
            <Ikon nama="logout" ukuran={20} />
          </button>
        </div>
        <div className="pita-dawis">
          <Image src={IDENTITAS.logoDawisKecil} alt="" width={32} height={32} />
          <span><b>{IDENTITAS.namaDawis}</b> · {IDENTITAS.lokasi}</span>
        </div>
      </div>

      {/* ---------- SALDO ---------- */}
      <div className="kartu kartu-apung" style={{ marginTop: -72 }}>
        {rek === undefined && <p className="redup">Memuat…</p>}
        {rek === null && (
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            Ibu belum punya rekening tabungan. Silakan hubungi teller untuk membuka rekening.
          </p>
        )}
        {rek && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="redup">Saldo tabungan</span>
              <span className="tebal kecil" style={{ color: 'var(--utama)', background: '#E3F4F9', padding: '4px 10px', borderRadius: 999 }}>
                {rek.no_rekening}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 30, fontWeight: 700 }}>
                {sembunyi ? 'Rp ••••••' : rupiah(rek.saldo)}
              </span>
              <button
                onClick={gantiSembunyi}
                aria-label={sembunyi ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                style={{ width: 44, height: 44, border: 0, background: 'none', color: 'var(--redup)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ikon nama={sembunyi ? 'mataTutup' : 'mata'} ukuran={22} />
              </button>
            </div>
            {rek.status === 'ditutup' && (
              <p className="teks-merah kecil tebal" style={{ marginTop: 4 }}>
                Rekening sudah ditutup. Riwayat tetap bisa dilihat.
              </p>
            )}
          </>
        )}
      </div>

      {/* ---------- MENU CEPAT ---------- */}
      <div className="menu-cepat" style={{ marginTop: 20 }}>
        <Link href="/tabungan/mutasi" className={rek ? '' : 'tidak-aktif'}>
          <span className="ikon"><Ikon nama="daftar" /></span>Mutasi
        </Link>
        <Link href="/tabungan/mutasi" className={rek ? '' : 'tidak-aktif'}>
          <span className="ikon"><Ikon nama="unduh" /></span>e-Statement
        </Link>
        <Link href="/ganti-pin">
          <span className="ikon"><Ikon nama="gembok" /></span>Ganti PIN
        </Link>
        {waTeller ? (
          <a href={waTeller} target="_blank" rel="noopener noreferrer">
            <span className="ikon"><Ikon nama="chat" /></span>Hubungi Teller
          </a>
        ) : (
          <span className="tidak-aktif" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span className="ikon"><Ikon nama="chat" /></span>Hubungi Teller
          </span>
        )}
      </div>

      {pesan && <p className="galat" style={{ margin: '12px 20px' }}>{pesan}</p>}

      {/* ---------- TRANSAKSI TERAKHIR ---------- */}
      {rek && (
        <>
          <div className="judul-bagian">
            <span>Transaksi terakhir</span>
            <Link href="/tabungan/mutasi" className="kecil tebal" style={{ color: 'var(--utama)' }}>
              Lihat semua
            </Link>
          </div>
          <div className="daftar">
            {mutasi.length === 0 && <p className="redup" style={{ padding: '14px 0' }}>Belum ada transaksi.</p>}
            {mutasi.map((m) => {
              const masuk = JENIS_MASUK.has(m.jenis)
              return (
                <div key={m.id} className="baris">
                  <span className={`ikon-mutasi ${masuk ? 'masuk' : 'keluar'}`}>
                    <Ikon nama={masuk ? 'masuk' : 'keluar'} ukuran={20} />
                  </span>
                  <span className="isi">
                    <span className="nama">
                      {LABEL_JENIS[m.jenis] ?? m.jenis}
                      {m.id > batasBaru && <span className="lencana-baru">BARU</span>}
                    </span>
                    <span className="redup kecil">{tanggalJam(m.dibuat)}</span>
                  </span>
                  <span className={`tebal ${masuk ? 'teks-hijau' : 'teks-merah'}`} style={{ fontSize: 14 }}>
                    {sembunyi ? '••••' : `${masuk ? '+' : '−'}${rupiah(m.nominal)}`}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ height: 24 }} />
      <NavNasabah />
    </main>
  )
}