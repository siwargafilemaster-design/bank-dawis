import { createClient } from '@supabase/supabase-js'
import { emailDariHp } from '@/lib/nomor'

// Klien admin dibuat DI DALAM fungsi, bukan di luar,
// supaya `npm run build` tidak gagal saat secret key belum ada.
function buatAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

function gagal(pesan: string, status = 400) {
  return Response.json({ galat: pesan }, { status })
}

export async function POST(req: Request) {
  if (!process.env.SUPABASE_SECRET_KEY) {
    return gagal('Server belum disetel (SUPABASE_SECRET_KEY kosong)', 500)
  }
  const admin = buatAdmin()

  // ===== 1. SIAPA YANG MEMANGGIL? =====
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return gagal('Belum login', 401)

  const { data: u, error: eu } = await admin.auth.getUser(token)
  if (eu || !u.user) return gagal('Sesi tidak sah, silakan login ulang', 401)

  const { data: pemanggil } = await admin
    .from('pengguna')
    .select('peran')
    .eq('user_id', u.user.id)
    .maybeSingle()
  if (!pemanggil?.peran?.includes('teller')) {
    return gagal('Hanya teller yang boleh mengelola akun', 403)
  }

  // ===== 2. ISI PERMINTAAN =====
  let body: { aksi?: string; wargaId?: string; pin?: string }
  try {
    body = await req.json()
  } catch {
    return gagal('Permintaan tidak valid')
  }
  const { aksi, wargaId, pin } = body

  if (aksi !== 'buat' && aksi !== 'reset') return gagal('Aksi tidak dikenal')
  if (!wargaId) return gagal('Anggota belum dipilih')
  if (!pin || !/^\d{6}$/.test(pin)) return gagal('PIN harus 6 angka')

  const { data: warga } = await admin
    .from('warga')
    .select('id, nama_kk, no_wa')
    .eq('id', wargaId)
    .maybeSingle()
  if (!warga) return gagal('Anggota tidak ditemukan', 404)

  const { data: akun } = await admin
    .from('pengguna')
    .select('user_id, peran')
    .eq('warga_id', wargaId)
    .maybeSingle()

  // ===== 3a. BUAT AKUN =====
  if (aksi === 'buat') {
    if (akun) return gagal('Anggota ini sudah punya akun')

    const { data: rek } = await admin
      .from('rekening')
      .select('id')
      .eq('warga_id', wargaId)
      .maybeSingle()
    if (!rek) return gagal('Buka rekening dulu sebelum mengaktifkan akses aplikasi')

    const { data: baru, error: eb } = await admin.auth.admin.createUser({
      email: emailDariHp(warga.no_wa),
      password: pin,
      email_confirm: true,
    })
    if (eb || !baru.user) {
      return gagal(
        eb?.message.toLowerCase().includes('already')
          ? 'Nomor HP ini sudah dipakai akun lain'
          : 'Gagal membuat akun: ' + (eb?.message ?? 'tidak diketahui')
      )
    }

    const { error: ep } = await admin.from('pengguna').insert({
      user_id: baru.user.id,
      nama: warga.nama_kk,
      peran: ['nasabah'],
      warga_id: warga.id,
      wajib_ganti_pin: true,
    })
    if (ep) {
      // batalkan akun auth supaya tidak ada akun "yatim" tanpa peran
      await admin.auth.admin.deleteUser(baru.user.id)
      return gagal('Gagal mendaftarkan akun: ' + ep.message, 500)
    }
    return Response.json({ ok: true })
  }

  // ===== 3b. RESET PIN =====
  if (!akun) return gagal('Anggota ini belum punya akun')
  if (akun.peran.includes('teller')) {
    return gagal('PIN teller hanya bisa direset oleh pengelola aplikasi', 403)
  }

  const { error: er } = await admin.auth.admin.updateUserById(akun.user_id, {
    password: pin,
  })
  if (er) return gagal('Gagal mereset PIN: ' + er.message, 500)

  await admin
    .from('pengguna')
    .update({ wajib_ganti_pin: true })
    .eq('user_id', akun.user_id)

  return Response.json({ ok: true })
}