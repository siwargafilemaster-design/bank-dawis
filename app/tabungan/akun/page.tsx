'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePengguna, keluar } from '@/lib/sesi'
import { supabase } from '@/lib/supabase'
import { rekeningSaya } from '@/lib/bank'
import { hpTampil } from '@/lib/format'
import { Ikon } from '@/components/ikon'
import { NavNasabah } from '@/components/nav-nasabah'

export default function Akun() {
  const { pengguna, galat } = usePengguna()
  const [hp, setHp] = useState('')
  const [noRek, setNoRek] = useState('')

  useEffect(() => {
    if (!pengguna) return
    const wargaId = pengguna.warga_id
    supabase.auth.getUser().then(({ data }) => {
      // email login = 62xxxx@bankdawis.invalid → ambil nomornya
      const email = data.user?.email ?? ''
      setHp(hpTampil(email.split('@')[0]))
    })
    if (wargaId) {
      rekeningSaya(wargaId).then((r) => setNoRek(r?.no_rekening ?? 'Belum ada'))
    }
  }, [pengguna])

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>

  const teller = pengguna?.peran.includes('teller')
  const modeKerja = teller ? '/teller' : pengguna?.peran.includes('pengawas') ? '/pengawas' : null

  return (
    <main className="layar nasabah">
      <div className="atas">
        <h1 style={{ paddingLeft: 8 }}>Akun</h1>
      </div>

      <div className="kartu" style={{ marginTop: 16 }}>
        <p className="redup kecil">Nama</p>
        <p className="tebal" style={{ marginBottom: 12 }}>{pengguna?.nama ?? '…'}</p>
        <p className="redup kecil">Nomor HP untuk login</p>
        <p className="tebal" style={{ marginBottom: 12 }}>{hp || '…'}</p>
        <p className="redup kecil">No. rekening</p>
        <p className="tebal">{noRek || '…'}</p>
      </div>

      <div className="daftar" style={{ marginTop: 16 }}>
        <Link href="/ganti-pin" className="baris">
          <span className="ikon-mutasi" style={{ background: '#E3F4F9', color: 'var(--utama)' }}><Ikon nama="gembok" ukuran={20} /></span>
          <span className="isi"><span className="nama">Ganti PIN</span></span>
        </Link>
       {modeKerja && (
          <Link href={modeKerja} className="baris">
            <span className="ikon-mutasi" style={{ background: '#E3F4F9', color: 'var(--utama)' }}><Ikon nama="tukar" ukuran={20} /></span>
            <span className="isi"><span className="nama">Kembali ke mode {teller ? 'teller' : 'pengawas'}</span></span>
          </Link>
        )}
        <button className="baris" onClick={keluar}>
          <span className="ikon-mutasi keluar"><Ikon nama="logout" ukuran={20} /></span>
          <span className="isi"><span className="nama teks-merah">Keluar</span></span>
        </button>
      </div>

      <p className="redup kecil" style={{ textAlign: 'center', margin: '24px 20px' }}>
        Bank Dawis · Tabungan anggota Dasa Wisma
      </p>

      <NavNasabah />
    </main>
  )
}