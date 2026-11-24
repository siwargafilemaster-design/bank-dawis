'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePengguna, keluar } from '@/lib/sesi'
import {
  daftarRekening, mutasiSemua, riwayatTutupKas,
  type Rekening, type MutasiLengkap, type TutupKas,
} from '@/lib/bank'
import { rupiah, tanggalJam, inisial, LABEL_JENIS, JENIS_MASUK } from '@/lib/format'
import { Ikon } from '@/components/ikon'
import { Memuat } from '@/components/memuat'

type Tab = 'mutasi' | 'koreksi' | 'kas' | 'rekening'
const TAB: { id: Tab; label: string }[] = [
  { id: 'mutasi', label: 'Mutasi' },
  { id: 'koreksi', label: 'Koreksi' },
  { id: 'kas', label: 'Tutup Kas' },
  { id: 'rekening', label: 'Rekening' },
]

export default function Pengawas() {
  const { pengguna, galat } = usePengguna('pengawas')
  const [rek, setRek] = useState<Rekening[] | null>(null)
  const [mutasi, setMutasi] = useState<MutasiLengkap[]>([])
  const [koreksi, setKoreksi] = useState<MutasiLengkap[]>([])
  const [kas, setKas] = useState<TutupKas[]>([])
  const [tab, setTab] = useState<Tab>('mutasi')
  const [pesan, setPesan] = useState('')

  useEffect(() => {
    if (!pengguna) return
    Promise.all([daftarRekening(), mutasiSemua(false), mutasiSemua(true), riwayatTutupKas(30)])
      .then(([r, m, k, t]) => {
        setRek(r)
        setMutasi(m)
        setKoreksi(k)
        setKas(t)
      })
      .catch((e) => setPesan('Gagal memuat: ' + e.message))
  }, [pengguna])

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>
  if (rek === null && !pesan) return <Memuat />

  const aktif = (rek ?? []).filter((r) => r.status === 'aktif')
  const total = aktif.reduce((s, r) => s + r.saldo, 0)
  const kasTerakhir = kas[0]

  return (
    <main className="layar">
      <div className="kepala">
        <div className="kepala-baris">
          <Image src="/ikon.jpg" alt="" width={40} height={40} />
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
            <span className="lencana">PENGAWAS</span>
            <span style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{pengguna?.nama ?? '…'}</span>
          </div>
          <button className="tombol-ikon" onClick={keluar} aria-label="Keluar">
            <Ikon nama="logout" ukuran={20} />
          </button>
        </div>
      </div>

      <div className="kartu kartu-apung">
        <p className="redup">Total tabungan semua nasabah</p>
        <p className="angka-besar">{rupiah(total)}</p>
        <div className="dua-kolom">
          <div className="kotak-hijau kecil">
            Rekening aktif
            <b>{aktif.length}</b>
          </div>
          <div className={kasTerakhir && kasTerakhir.selisih !== 0 ? 'kotak-merah kecil' : 'kotak-hijau kecil'}>
            Tutup kas terakhir
            <b>
              {!kasTerakhir
                ? 'Belum ada'
                : kasTerakhir.selisih === 0
                  ? 'Cocok'
                  : `Selisih ${rupiah(kasTerakhir.selisih)}`}
            </b>
          </div>
        </div>
      </div>

      {pengguna?.warga_id && (
        <Link href="/tabungan" className="spanduk info" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Ikon nama="orang" ukuran={18} />
            Lihat tabungan saya
          </span>
          <span className="tebal">›</span>
        </Link>
      )}

      {pesan && <p className="galat" style={{ margin: '12px 20px' }}>{pesan}</p>}

      <div className="chips-bulan" role="tablist" style={{ marginTop: 16, background: 'transparent' }}>
        {TAB.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'chip pilih' : 'chip'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'koreksi' && koreksi.length > 0 && ` (${koreksi.length})`}
          </button>
        ))}
      </div>

      {(tab === 'mutasi' || tab === 'koreksi') && (
        <DaftarMutasi
          isi={tab === 'mutasi' ? mutasi : koreksi}
          kosong={tab === 'mutasi' ? 'Belum ada transaksi.' : 'Belum pernah ada koreksi.'}
        />
      )}

      {tab === 'kas' && (
        <div className="daftar">
          {kas.length === 0 && <p className="redup" style={{ padding: '14px 0' }}>Teller belum pernah tutup kas.</p>}
          {kas.map((k) => (
            <div key={k.id} className="baris" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className="nama">{tanggalJam(k.dibuat)}</span>
                <span className={`lencana-status ${k.selisih === 0 ? 'cocok' : 'selisih'}`}>
                  {k.selisih === 0 ? 'Cocok' : k.selisih > 0 ? `Lebih ${rupiah(k.selisih)}` : `Kurang ${rupiah(-k.selisih)}`}
                </span>
              </div>
              <div className="redup kecil" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sistem {rupiah(k.saldo_sistem)}</span>
                <span>Dipegang {rupiah(k.uang_fisik)}</span>
              </div>
              <div className="redup kecil">
                Hari itu: masuk {rupiah(k.masuk_hari_ini)} · keluar {rupiah(k.keluar_hari_ini)}
                {k.teller_nama && ` · ${k.teller_nama}`}
              </div>
              {k.catatan && <div className="kecil">Catatan: {k.catatan}</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'rekening' && (
        <div className="daftar">
          {(rek ?? []).length === 0 && <p className="redup" style={{ padding: '14px 0' }}>Belum ada rekening.</p>}
          {(rek ?? []).map((r) => (
            <div key={r.id} className="baris">
              <span className="avatar" style={r.status === 'ditutup' ? { background: '#EDF1F4', color: 'var(--redup)' } : undefined}>
                {inisial(r.warga?.nama_kk ?? '?')}
              </span>
              <span className="isi">
                <span className="nama">{r.warga?.nama_kk}</span>
                <span className="redup kecil">
                  {r.no_rekening}
                  {r.status === 'ditutup' && ' · ditutup'}
                  {r.dibuka_kembali_pada && ` · dibuka kembali ${tanggalJam(r.dibuka_kembali_pada)}`}
                </span>
              </span>
              <span className="tebal" style={{ fontSize: 14 }}>{rupiah(r.saldo)}</span>
            </div>
          ))}
        </div>
      )}

      <p className="redup kecil" style={{ textAlign: 'center', margin: '16px 20px 0' }}>
        Menampilkan 50 transaksi terbaru. Muat ulang halaman untuk data terkini.
      </p>
    </main>
  )
}

function DaftarMutasi({ isi, kosong }: { isi: MutasiLengkap[]; kosong: string }) {
  return (
    <div className="daftar">
      {isi.length === 0 && <p className="redup" style={{ padding: '14px 0' }}>{kosong}</p>}
      {isi.map((m) => {
        const masuk = JENIS_MASUK.has(m.jenis)
        return (
          <div key={m.id} className="baris" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span className="nama">{m.rekening?.warga?.nama_kk ?? '?'}</span>
              <span className={`tebal ${masuk ? 'teks-hijau' : 'teks-merah'}`} style={{ fontSize: 14 }}>
                {masuk ? '+' : '−'}{rupiah(m.nominal)}
              </span>
            </div>
            <div className="redup kecil">
              {LABEL_JENIS[m.jenis] ?? m.jenis} · {tanggalJam(m.dibuat)}
              {m.teller_nama && ` · ${m.teller_nama}`}
            </div>
            {m.catatan && <div className="kecil">{m.jenis.startsWith('koreksi') ? 'Alasan: ' : ''}{m.catatan}</div>}
          </div>
        )
      })}
    </div>
  )
}