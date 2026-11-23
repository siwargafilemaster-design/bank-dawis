import { normalWa } from './nomor'

// Semua tampilan tanggal memakai zona WIB.
const ZONA = 'Asia/Jakarta'

export const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

export function tanggalJam(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function tanggalHariIni(): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA,
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date())
}

// 'YYYY-MM-DD' menurut WIB
export function hariIniWIB(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date())
}

export function awalHariIniISO(): string {
  return `${hariIniWIB()}T00:00:00+07:00`
}

export function inisial(nama: string): string {
  const kata = nama
    .replace(/^(ibu|bu)\.?\s+/i, '')
    .trim()
    .split(/\s+/)
  return ((kata[0]?.[0] ?? '') + (kata[1]?.[0] ?? '')).toUpperCase() || '?'
}

// 6281234567890 → 081234567890 (format yang dikenal ibu-ibu)
export function hpTampil(noWa: string): string {
  const d = normalWa(noWa)
  return d.startsWith('62') ? '0' + d.slice(2) : d
}

export const LABEL_JENIS: Record<string, string> = {
  setor: 'Setoran',
  tarik: 'Penarikan',
  koreksi_masuk: 'Koreksi penarikan',
  koreksi_keluar: 'Koreksi setoran',
  tutup: 'Penutupan rekening',
}

export const JENIS_MASUK = new Set(['setor', 'koreksi_masuk'])

// PIN yang terlalu mudah ditebak
export function pinLemah(pin: string): boolean {
  return /^(\d)\1{5}$/.test(pin) || pin === '123456' || pin === '654321'
}

// ===================== Tahap 4: periode bulan =====================
// Periode = 'YYYY-MM'. Batas bulan selalu "tgl 1 bulan ini" s/d
// "sebelum tgl 1 bulan berikutnya" — JANGAN hardcode tgl 31
// (pelajaran bug 2026-09-31 di app Bendahara).

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function periodeSekarang(): string {
  return hariIniWIB().slice(0, 7)
}

export function periodeDari(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA })
    .format(new Date(iso))
    .slice(0, 7)
}

export function geserPeriode(p: string, n: number): string {
  const [t, b] = p.split('-').map(Number)
  const total = t * 12 + (b - 1) + n
  const th = Math.floor(total / 12)
  const bl = (total % 12) + 1
  return `${th}-${String(bl).padStart(2, '0')}`
}

export function awalPeriodeISO(p: string): string {
  return `${p}-01T00:00:00+07:00`
}

export function namaPeriode(p: string): string {
  const [t, b] = p.split('-').map(Number)
  return `${NAMA_BULAN[b - 1]} ${t}`
}

export function namaPeriodePendek(p: string): string {
  const [, b] = p.split('-').map(Number)
  return NAMA_BULAN[b - 1].slice(0, 3)
}

export function tanggalKelompok(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function jamSaja(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function salam(): string {
  const jam = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, hour: '2-digit', hour12: false })
      .format(new Date())
  )
  if (jam < 11) return 'Selamat pagi'
  if (jam < 15) return 'Selamat siang'
  if (jam < 18) return 'Selamat sore'
  return 'Selamat malam'
}

// localStorage bisa melempar error di beberapa HP/mode privat
export function bacaLokal(kunci: string): string | null {
  try {
    return localStorage.getItem(kunci)
  } catch {
    return null
  }
}

export function tulisLokal(kunci: string, nilai: string): void {
  try {
    localStorage.setItem(kunci, nilai)
  } catch {
    /* abaikan */
  }
}