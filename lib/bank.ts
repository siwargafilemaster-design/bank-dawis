import { supabase } from './supabase'
import { awalHariIniISO, hariIniWIB, JENIS_MASUK } from './format'

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
  warga: Omit<Warga, 'id'> | null
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
  'id, no_rekening, saldo, status, dibuka_pada, warga(no_rumah, nama_kk, tgl_keluar)'

const KOLOM_MUTASI =
  'id, jenis, nominal, saldo_setelah, catatan, teller_nama, koreksi_dari, dibuat'

export function sudahKeluar(w: { tgl_keluar: string | null } | null): boolean {
  return !!w?.tgl_keluar && w.tgl_keluar <= hariIniWIB()
}

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