// Semua tampilan tanggal memakai zona WIB.
// Tanggal dibuat dari string ISO lengkap (ada +07:00 atau Z),
// jadi tidak kena bug geser-tanggal seperti di app Bendahara.
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

export const LABEL_JENIS: Record<string, string> = {
  setor: 'Setoran',
  tarik: 'Penarikan',
  koreksi_masuk: 'Koreksi penarikan',
  koreksi_keluar: 'Koreksi setoran',
  tutup: 'Penutupan rekening',
}

export const JENIS_MASUK = new Set(['setor', 'koreksi_masuk'])