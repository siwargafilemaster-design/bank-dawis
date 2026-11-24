'use client'

import { useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { emailDariHp, normalWa } from '@/lib/nomor'
import { IDENTITAS } from '@/lib/identitas'
import { KotakPin } from '@/components/kotak-pin'

type TahapIntro = 'tunggu' | 'aktif' | 'selesai'
const LAMA_INTRO = 3700 // ms, sedikit lebih lama dari animasi terakhir selesai

export default function LoginPage() {
  const router = useRouter()
  const [hp, setHp] = useState('')
  const [pin, setPin] = useState('')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)

  // ---------- INTRO ----------
  const bankRef = useRef<HTMLDivElement>(null)
  const sudahMulai = useRef(false)
  const [intro, setIntro] = useState<TahapIntro>('tunggu')
  const [geser, setGeser] = useState({ dx: 0, dy: 0 })

  // useLayoutEffect: berjalan SEBELUM layar digambar → tidak ada kedipan
  useLayoutEffect(() => {
    // penjaga: mode dev (StrictMode) menjalankan efek 2x
    if (sudahMulai.current) return
    sudahMulai.current = true

    let sudahDiputar = false
    try {
      sudahDiputar = sessionStorage.getItem('bd-intro') === '1'
    } catch {
      /* abaikan */
    }
    const kurangiAnimasi = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = bankRef.current

    if (sudahDiputar || kurangiAnimasi || !el) {
      setIntro('selesai')
      return
    }

    try {
      sessionStorage.setItem('bd-intro', '1')
    } catch {
      /* abaikan */
    }

    // ukur posisi AKHIR logo Bank Dawis, hitung jarak dari tengah layar
    const r = el.getBoundingClientRect()
    setGeser({
      dx: window.innerWidth / 2 - (r.left + r.width / 2),
      dy: window.innerHeight / 2 - (r.top + r.height / 2),
    })
    setIntro('aktif')
    setTimeout(() => setIntro('selesai'), LAMA_INTRO)
  }, [])

  // ---------- LOGIN (sama dengan Tahap 5) ----------
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

  const gaya = {
    '--bd-dx': `${geser.dx}px`,
    '--bd-dy': `${geser.dy}px`,
    background: '#fff',
    padding: '56px 28px 32px',
  } as CSSProperties

  return (
    <main className={`layar intro-${intro}`} style={gaya}>
      {/* elemen khusus intro (tersembunyi setelah selesai) */}
      <span className="intro-riak" aria-hidden="true" />
      <Image className="intro-ikon" src="/ikon.jpg" alt="" width={88} height={88} priority />

      <div className="intro-isi" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* ---------- DUA MITRA ---------- */}
        <div className="co-brand">
          <div ref={bankRef} className="intro-bank">
            <Image
              src="/logo.jpg"
              alt="Bank Dawis"
              width={150}
              height={75}
              priority
              style={{ objectFit: 'cover', display: 'block' }}
            />
            <span className="intro-kilau" aria-hidden="true" />
          </div>
          <span className="co-brand-garis" aria-hidden="true" />
          <Image
            className="intro-gamersi"
            src={IDENTITAS.logoDawis}
            alt={IDENTITAS.lokasi}
            width={88}
            height={88}
            priority
          />
        </div>

        <p
          className="redup kecil intro-naik"
          style={{ textAlign: 'center', lineHeight: 1.6, marginBottom: 32, animationDelay: '2.7s' }}
        >
          Tabungan anggota <b style={{ color: 'var(--utama)' }}>{IDENTITAS.namaDawis}</b>
          <br />
          {IDENTITAS.lokasi}
        </p>

        <div className="intro-naik" style={{ animationDelay: '2.8s' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Selamat datang</h1>
          <p className="redup" style={{ fontSize: 14, marginTop: 4 }}>
            Masuk dengan nomor HP dan PIN Ibu
          </p>
        </div>

        <form onSubmit={masuk} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <div className="intro-naik" style={{ display: 'flex', flexDirection: 'column', animationDelay: '2.9s' }}>
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
          </div>

          <div className="intro-naik" style={{ display: 'flex', flexDirection: 'column', animationDelay: '3s' }}>
            <label className="label" htmlFor="pin">PIN</label>
            <KotakPin id="pin" value={pin} onChange={setPin} label="PIN 6 angka" autoComplete="current-password" />
            <p className="redup kecil" style={{ marginTop: 10 }}>
              Lupa PIN? Minta teller untuk mereset.
            </p>
          </div>

          {galat && <p className="galat">{galat}</p>}

          <div className="dorong" />
          <button
            className="tombol intro-naik"
            type="submit"
            disabled={sibuk}
            style={{ marginTop: 24, animationDelay: '3.1s' }}
          >
            {sibuk ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>
      </div>
    </main>
  )
}