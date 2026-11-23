'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePengguna, keluar } from '@/lib/sesi'
import { gantiPin } from '@/lib/bank'
import { pinLemah } from '@/lib/format'
import { Ikon } from '@/components/ikon'
import { Memuat } from '@/components/memuat'

export default function GantiPin() {
  const router = useRouter()
  const { pengguna, galat } = usePengguna()
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [pesan, setPesan] = useState('')

  async function simpan(e: FormEvent) {
    e.preventDefault()
    setPesan('')

    if (!/^\d{6}$/.test(pin1)) return setPesan('PIN harus 6 angka')
    if (pinLemah(pin1)) return setPesan('PIN terlalu mudah ditebak. Pilih angka lain.')
    if (pin1 !== pin2) return setPesan('Ulangi PIN tidak sama')

    setSibuk(true)
    try {
      await gantiPin(pin1)
      router.replace('/')
    } catch (err) {
      setPesan((err as Error).message)
      setSibuk(false)
    }
  }

  if (galat) return <main className="layar"><div className="kartu" style={{ marginTop: 40 }}>{galat}</div></main>
    if (!pengguna) return <Memuat />

  const wajib = pengguna.wajib_ganti_pin

  return (
    <main className="layar" style={{ background: '#fff', padding: '48px 28px 32px' }}>
      {!wajib && (
        <Link href="/" aria-label="Kembali" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <Ikon nama="kembali" ukuran={22} />
        </Link>
      )}

      <span style={{ width: 64, height: 64, borderRadius: 20, background: '#E3F4F9', color: 'var(--utama)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Ikon nama="gembok" ukuran={30} />
      </span>

      <h1 style={{ fontSize: 22, fontWeight: 600 }}>
        {wajib ? 'Buat PIN baru' : 'Ganti PIN'}
      </h1>
      <p className="redup" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>
        {wajib
          ? 'PIN dari teller hanya sementara. Ganti dengan PIN rahasia yang hanya Ibu yang tahu.'
          : 'Masukkan PIN baru 6 angka.'}
      </p>

      <form onSubmit={simpan} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <label className="label" htmlFor="pin1">PIN baru</label>
        <input
          id="pin1"
          className="isian pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          value={pin1}
          onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))}
        />

        <label className="label" htmlFor="pin2">Ulangi PIN baru</label>
        <input
          id="pin2"
          className="isian pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          value={pin2}
          onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
        />

        <div className="spanduk" style={{ margin: '20px 0 0' }}>
          <Ikon nama="info" ukuran={18} />
          Hindari tanggal lahir atau angka berurutan seperti 123456.
        </div>

        {pesan && <p className="galat">{pesan}</p>}

        <div className="dorong" />
        <button className="tombol" type="submit" disabled={sibuk} style={{ marginTop: 24 }}>
          {sibuk ? 'Menyimpan…' : 'Simpan PIN baru'}
        </button>
        {wajib && (
          <button type="button" className="tombol garis" onClick={keluar} style={{ marginTop: 12 }}>
            Keluar
          </button>
        )}
      </form>
    </main>
  )
}