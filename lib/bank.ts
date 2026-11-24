import { supabase } from './supabase'
import { awalHariIniISO, hariIniWIB, JENIS_MASUK, awalPeriodeISO, geserPeriode, awalTahunISO } from './format'

export type Warga = {
  id: string
  no_rumah: string
  nama_kk: string
  tgl_keluar: string | null
}

export type Rekening = {
  id: string
  no_rekening: string
  saldo: number
  status: 'aktif' | 'ditutup'
  dibuka_pada: string
  warga_id: string
  dibuka_kembali_pada: string | null
  warga: {
    no_rumah: string
    nama_kk: string
    tgl_keluar: string | null
    no_wa: string
  } | null
}

export type Mutasi = {
  id: number
  jenis: string
  nominal: number
  saldo_setelah: number
  catatan: string | null
  teller_nama: string | null
  koreksi_dari: number | null
  dibuat: string
}

const KOLOM_REK =
  'id, no_rekening, saldo, status, dibuka_pada, dibuka_kembali_pada, warga_id, warga(no_rumah, nama_kk, tgl_keluar, no_wa)'
const KOLOM_MUTASI =
  'id, jenis, nominal, saldo_setelah, catatan, teller_nama, koreksi_dari, dibuat'

export function sudahKeluar(w: { tgl_keluar: string | null } | null): boolean {
  return !!w?.tgl_keluar && w.tgl_keluar <= hariIniWIB()
}

// ===================== BACA =====================

export async function daftarRekening(): Promise<Rekening[]> {
  const { data, error } = await supabase
    .from('rekening')
    .select(KOLOM_REK)
    .order('no_rekening')
  if (error) throw error
  return (data ?? []) as unknown as Rekening[]
}

export async function ambilRekening(id: string): Promise<Rekening | null> {
  const { data, error } = await supabase
    .from('rekening')
    .select(KOLOM_REK)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as unknown as Rekening | null
}

export async function ambilMutasi(rekeningId: string, batas = 50): Promise<Mutasi[]> {
  const { data, error } = await supabase
    .from('mutasi')
    .select(KOLOM_MUTASI)
    .eq('rekening_id', rekeningId)
    .order('id', { ascending: false })
    .limit(batas)
  if (error) throw error
  return (data ?? []) as Mutasi[]
}

export async function ringkasanHariIni() {
  const { data, error } = await supabase
    .from('mutasi')
    .select('jenis, nominal')
    .gte('dibuat', awalHariIniISO())
  if (error) throw error

  let masuk = 0, keluar = 0, nMasuk = 0, nKeluar = 0
  for (const m of data ?? []) {
    if (JENIS_MASUK.has(m.jenis)) {
      masuk += m.nominal
      nMasuk++
    } else {
      keluar += m.nominal
      nKeluar++
    }
  }
  return { masuk, keluar, nMasuk, nKeluar }
}

export async function wargaTanpaRekening(): Promise<Warga[]> {
  const [w, r] = await Promise.all([
    supabase.from('warga').select('id, no_rumah, nama_kk, tgl_keluar').order('no_rumah'),
    supabase.from('rekening').select('warga_id'),
  ])
  if (w.error) throw w.error
  if (r.error) throw r.error

  const punya = new Set((r.data ?? []).map((x) => x.warga_id))
  return ((w.data ?? []) as Warga[]).filter(
    (x) => !punya.has(x.id) && !sudahKeluar(x)
  )
}

export async function statusAkun(
  wargaId: string
): Promise<{ ada: boolean; wajibGantiPin: boolean }> {
  const { data, error } = await supabase.rpc('bank_akun_warga', {
    p_warga_id: wargaId,
  })
  if (error) throw error
  const baris = (data ?? [])[0]
  return { ada: !!baris, wajibGantiPin: !!baris?.wajib_ganti_pin }
}

// ===================== TULIS (lewat fungsi database) =====================

export async function bukaRekening(wargaId: string): Promise<string> {
  const { data, error } = await supabase.rpc('bank_buka_rekening', {
    p_warga_id: wargaId,
  })
  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}

export async function simpanTransaksi(p: {
  rekeningId: string
  jenis: 'setor' | 'tarik'
  nominal: number
  kunci: string
  catatan: string
}): Promise<Mutasi> {
  const { data, error } = await supabase.rpc('bank_transaksi', {
    p_rekening_id: p.rekeningId,
    p_jenis: p.jenis,
    p_nominal: p.nominal,
    p_kunci: p.kunci,
    p_catatan: p.catatan.trim() || null,
  })
  if (error) throw new Error(error.message)
  return data as Mutasi
}

export async function koreksiMutasi(mutasiId: number, alasan: string): Promise<void> {
  const { error } = await supabase.rpc('bank_koreksi', {
    p_mutasi_id: mutasiId,
    p_alasan: alasan.trim(),
  })
  if (error) throw new Error(error.message)
}

export async function tutupRekening(rekeningId: string, catatan: string): Promise<void> {
  const { error } = await supabase.rpc('bank_tutup_rekening', {
    p_rekening_id: rekeningId,
    p_catatan: catatan.trim() || null,
  })
  if (error) throw new Error(error.message)
}

// ===================== AKUN (lewat server /api/akun) =====================

export async function kelolaAkun(
  aksi: 'buat' | 'reset',
  wargaId: string,
  pin: string
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesi habis, silakan login ulang')

  const res = await fetch('/api/akun', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ aksi, wargaId, pin }),
  })
  const isi = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(isi.galat ?? 'Gagal menghubungi server')
}

export async function gantiPin(pinBaru: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: pinBaru })
  if (error) {
    throw new Error(
      error.message.toLowerCase().includes('different')
        ? 'PIN baru harus berbeda dari PIN lama'
        : 'Gagal mengganti PIN: ' + error.message
    )
  }
  const { error: e2 } = await supabase.rpc('selesai_ganti_pin')
  if (e2) throw new Error(e2.message)
}

// ===================== Tahap 4: nasabah & buka kembali =====================

export type RekeningSaya = {
  id: string
  no_rekening: string
  saldo: number
  status: 'aktif' | 'ditutup'
  dibuka_pada: string
}

// Nasabah tidak boleh membaca tabel warga, jadi rekening diambil tanpa embed warga
export async function rekeningSaya(wargaId: string): Promise<RekeningSaya | null> {
  const { data, error } = await supabase
    .from('rekening')
    .select('id, no_rekening, saldo, status, dibuka_pada')
    .eq('warga_id', wargaId)
    .maybeSingle()
  if (error) throw error
  return data as RekeningSaya | null
}

// Mutasi satu bulan, urut LAMA → BARU
export async function mutasiBulan(rekeningId: string, periode: string): Promise<Mutasi[]> {
  const { data, error } = await supabase
    .from('mutasi')
    .select(KOLOM_MUTASI)
    .eq('rekening_id', rekeningId)
    .gte('dibuat', awalPeriodeISO(periode))
    .lt('dibuat', awalPeriodeISO(geserPeriode(periode, 1)))
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as Mutasi[]
}

// Saldo tepat sebelum waktu tertentu = saldo_setelah mutasi terakhir sebelumnya
export async function saldoSebelum(rekeningId: string, iso: string): Promise<number> {
  const { data, error } = await supabase
    .from('mutasi')
    .select('saldo_setelah')
    .eq('rekening_id', rekeningId)
    .lt('dibuat', iso)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.saldo_setelah ?? 0
}

// Semua id mutasi yang pernah dikoreksi (bisa dikoreksi di bulan lain)
export async function idDikoreksi(rekeningId: string): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('mutasi')
    .select('koreksi_dari')
    .eq('rekening_id', rekeningId)
    .not('koreksi_dari', 'is', null)
  if (error) throw error
  return new Set((data ?? []).map((x) => x.koreksi_dari as number))
}

export async function kontakTeller(): Promise<{ nama: string; no_wa: string } | null> {
  const { data, error } = await supabase.rpc('bank_kontak_teller')
  if (error) throw error
  return (data ?? [])[0] ?? null
}

export async function bukaKembali(rekeningId: string): Promise<void> {
  const { error } = await supabase.rpc('bank_buka_kembali', {
    p_rekening_id: rekeningId,
  })
  if (error) throw new Error(error.message)
}

// ===================== Tahap 5: tahunan, pengawas, tutup kas =====================

// Mutasi satu tahun, urut LAMA → BARU
export async function mutasiTahun(rekeningId: string, tahun: number): Promise<Mutasi[]> {
  const { data, error } = await supabase
    .from('mutasi')
    .select(KOLOM_MUTASI)
    .eq('rekening_id', rekeningId)
    .gte('dibuat', awalTahunISO(tahun))
    .lt('dibuat', awalTahunISO(tahun + 1))
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as Mutasi[]
}

export type MutasiLengkap = Mutasi & {
  rekening: { no_rekening: string; warga: { nama_kk: string } | null } | null
}

export async function mutasiSemua(hanyaKoreksi: boolean, batas = 50): Promise<MutasiLengkap[]> {
  let q = supabase
    .from('mutasi')
    .select(`${KOLOM_MUTASI}, rekening(no_rekening, warga(nama_kk))`)
  if (hanyaKoreksi) q = q.in('jenis', ['koreksi_masuk', 'koreksi_keluar'])
  const { data, error } = await q.order('id', { ascending: false }).limit(batas)
  if (error) throw error
  return (data ?? []) as unknown as MutasiLengkap[]
}

export type TutupKas = {
  id: number
  dibuat: string
  teller_nama: string | null
  saldo_sistem: number
  uang_fisik: number
  selisih: number
  masuk_hari_ini: number
  keluar_hari_ini: number
  catatan: string | null
}

export async function riwayatTutupKas(batas = 10): Promise<TutupKas[]> {
  const { data, error } = await supabase
    .from('tutup_kas')
    .select('id, dibuat, teller_nama, saldo_sistem, uang_fisik, selisih, masuk_hari_ini, keluar_hari_ini, catatan')
    .order('id', { ascending: false })
    .limit(batas)
  if (error) throw error
  return (data ?? []) as TutupKas[]
}

export async function tutupKasHarian(uangFisik: number, catatan: string): Promise<TutupKas> {
  const { data, error } = await supabase.rpc('bank_tutup_kas', {
    p_uang_fisik: uangFisik,
    p_catatan: catatan.trim() || null,
  })
  if (error) throw new Error(error.message)
  return data as TutupKas
}