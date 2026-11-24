'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { emailDariHp, normalWa } from '@/lib/nomor'
import { IDENTITAS } from '@/lib/identitas'
import { KotakPin } from '@/components/kotak-pin'

export default function LoginPage() {
  const router = useRouter()
  const [hp, setHp] = useState('')
  const [pin, setPin] = useState('')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)

  async function masuk(e: FormEvent) {
    e.preventDefault()
    setGalat('')

    if (normalWa(hp).length < 10) {
      setGalat('Nomor HP belum lengkap')
      return
    }
    if (!/^\d{6}$/.test(pin)) {
      setGalat('PIN harus 6 angka')
      return
    }

    setSibuk(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: emailDariHp(hp),
      password: pin,
    })
    setSibuk(false)

    if (error) {
      setPin('')
      setGalat(
        error.status === 429
          ? 'Terlalu banyak percobaan. Tunggu beberapa menit.'
          : 'Nomor HP atau PIN salah'
      )
      return
    }
    router.replace('/')
  }

  return (
    <main className="layar" style={{ background: '#fff', padding: '56px 28px 32px' }}>
      {/* ---------- DUA MITRA ---------- */}
      <div className="co-brand">
        <Image src="/logo.jpg" alt="Bank Dawis" width={150} height={75} priority style={{ objectFit: 'cover' }} />
        <span className="co-brand-garis" aria-hidden="true" />
        <Image src={IDENTITAS.logoDawis} alt={IDENTITAS.lokasi} width={88} height={88} priority />
      </div>
      <p className="redup kecil" style={{ textAlign: 'center', lineHeight: 1.6, marginBottom: 32 }}>
        Tabungan anggota <b style={{ color: 'var(--utama)' }}>{IDENTITAS.namaDawis}</b>
        <br />
        {IDENTITAS.lokasi}
      </p>

      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Selamat datang</h1>
      <p className="redup" style={{ fontSize: 14, marginTop: 4 }}>
        Masuk dengan nomor HP dan PIN Anda
      </p>

      <form onSubmit={masuk} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <label className="label" htmlFor="hp">Nomor HP</label>
        <input
          id="hp"
          className="isian"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          placeholder="08xx xxxx xxxx"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />

        <label className="label" htmlFor="pin">PIN</label>
        <KotakPin id="pin" value={pin} onChange={setPin} label="PIN 6 angka" autoComplete="current-password" />
        <p className="redup kecil" style={{ marginTop: 10 }}>
          Lupa PIN? Minta teller untuk mereset.
        </p>

        {galat && <p className="galat">{galat}</p>}

        <div className="dorong" />
        <button className="tombol" type="submit" disabled={sibuk} style={{ marginTop: 24 }}>
          {sibuk ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>
    </main>
  )
}