'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { emailDariHp, normalWa } from '@/lib/nomor'

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
    <main className="wadah">
      <div className="kartu">
        <p className="judul">Bank Dawis</p>
        <p className="redup">Masuk dengan nomor HP dan PIN</p>

        <form onSubmit={masuk}>
          <label htmlFor="hp">Nomor HP</label>
          <input
            id="hp"
            type="tel"
            inputMode="tel"
            autoComplete="username"
            placeholder="08xx xxxx xxxx"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />

          <label htmlFor="pin">PIN</label>
          <input
            id="pin"
            className="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          />

          {galat && <p className="galat">{galat}</p>}

          <button type="submit" disabled={sibuk}>
            {sibuk ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>
      </div>
    </main>
  )
}