import type { Mutasi } from './bank'
import { IDENTITAS } from './identitas'
import { rupiah, tanggalJam, tanggalPendek, LABEL_JENIS, JENIS_MASUK } from './format'

type Gambar = { data: string; w: number; h: number; format: 'PNG' | 'JPEG' }

// Ambil gambar dari folder public → data URL + ukuran asli
async function muatGambar(url: string): Promise<Gambar | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const format = blob.type === 'image/png' ? 'PNG' : 'JPEG'

    const data = await new Promise<string>((ok, gagal) => {
      const r = new FileReader()
      r.onload = () => ok(r.result as string)
      r.onerror = gagal
      r.readAsDataURL(blob)
    })

    const ukuran = await new Promise<{ w: number; h: number }>((ok, gagal) => {
      const img = new Image()
      img.onload = () => ok({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = gagal
      img.src = data
    })

    return { data, format, ...ukuran }
  } catch {
    return null // gagal muat logo → PDF tetap jadi, tanpa logo
  }
}

export async function unduhStatement(p: {
  nama: string
  noRekening: string
  tahun: number
  berjalan: boolean // true = tahun ini (belum selesai)
  saldoAwal: number // saldo per 31 Des tahun sebelumnya
  mutasi: Mutasi[] // urut lama → baru
  dikoreksi: Set<number>
}) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const [logoDawis, logoApp] = await Promise.all([
    muatGambar(IDENTITAS.logoDawis),
    muatGambar(IDENTITAS.logoAplikasi),
  ])

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const kanan = 196
  const sekarang = new Date().toISOString()

  // ----- kop -----
  let x = 14
  if (logoDawis) {
    const tinggi = 18
    const lebar = Math.min(40, (tinggi * logoDawis.w) / logoDawis.h)
    doc.addImage(logoDawis.data, logoDawis.format, 14, 8, lebar, tinggi)
    x = 14 + lebar + 4
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(10, 110, 140)
  doc.text(IDENTITAS.namaDawis.toUpperCase(), x, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(94, 107, 118)
  doc.text(`${IDENTITAS.lokasi} · ${IDENTITAS.kota}`, x, 21)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(31, 42, 51)
  doc.text('e-Statement Tahunan', kanan, 15, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(94, 107, 118)
  doc.text(`Tahun ${p.tahun}${p.berjalan ? ' (berjalan)' : ''}`, kanan, 21, { align: 'right' })

  doc.setDrawColor(207, 217, 224)
  doc.line(14, 29, kanan, 29)

  // ----- identitas & ringkasan -----
  let masuk = 0
  let keluar = 0
  for (const m of p.mutasi) {
    if (JENIS_MASUK.has(m.jenis)) masuk += m.nominal
    else keluar += m.nominal
  }
  const saldoAkhir = p.mutasi.length
    ? p.mutasi[p.mutasi.length - 1].saldo_setelah
    : p.saldoAwal
  const periode = p.berjalan
    ? `1 Jan - ${tanggalPendek(sekarang)}`
    : `1 Jan - 31 Des ${p.tahun}`

  doc.setFontSize(9.5)
  const kiri: [string, string][] = [
    ['Nama', p.nama],
    ['No. Rekening', p.noRekening],
    ['Periode', periode],
  ]
  kiri.forEach(([k, v], i) => {
    doc.setTextColor(94, 107, 118)
    doc.text(k, 14, 37 + i * 5.5)
    doc.setTextColor(31, 42, 51)
    doc.text(': ' + v, 42, 37 + i * 5.5)
  })

  const ringkas: [string, string][] = [
    ['Saldo awal tahun', rupiah(p.saldoAwal)],
    ['Total masuk', rupiah(masuk)],
    ['Total keluar', rupiah(keluar)],
    ['Saldo akhir', rupiah(saldoAkhir)],
  ]
  ringkas.forEach(([k, v], i) => {
    doc.setTextColor(94, 107, 118)
    doc.text(k, 125, 37 + i * 5.5)
    doc.setTextColor(31, 42, 51)
    if (i === 3) doc.setFont('helvetica', 'bold')
    doc.text(v, kanan, 37 + i * 5.5, { align: 'right' })
    doc.setFont('helvetica', 'normal')
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(31, 42, 51)
  doc.text('Rincian transaksi', 14, 64)
  doc.setFont('helvetica', 'normal')

  // ----- tabel -----
  const isi = p.mutasi.map((m) => {
    const masukKah = JENIS_MASUK.has(m.jenis)
    let ket = LABEL_JENIS[m.jenis] ?? m.jenis
    if (m.catatan) ket += ` - ${m.catatan}`
    if (p.dikoreksi.has(m.id)) ket += ' (dikoreksi)'
    return [
      tanggalJam(m.dibuat),
      ket,
      masukKah ? rupiah(m.nominal) : '',
      masukKah ? '' : rupiah(m.nominal),
      rupiah(m.saldo_setelah),
    ]
  })

  autoTable(doc, {
    startY: 67,
    margin: { left: 14, right: 14, bottom: 22 }, // sisakan ruang kaki halaman
    head: [['Tanggal', 'Keterangan', 'Masuk', 'Keluar', 'Saldo']],
    body: isi.length ? isi : [['', 'Tidak ada transaksi di tahun ini', '', '', '']],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [10, 110, 140], textColor: 255 },
    alternateRowStyles: { fillColor: [247, 250, 251] },
    columnStyles: {
      0: { cellWidth: 30 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 30 },
    },
  })

  // ----- kaki halaman (di SETIAP halaman) -----
  const jumlahHal = doc.getNumberOfPages()
  for (let i = 1; i <= jumlahHal; i++) {
    doc.setPage(i)
    doc.setDrawColor(237, 241, 244)
    doc.line(14, 279, kanan, 279)
    if (logoApp) doc.addImage(logoApp.data, logoApp.format, 14, 281.5, 6, 6)
    doc.setFontSize(8)
    doc.setTextColor(94, 107, 118)
    doc.text('Dibuat otomatis oleh aplikasi Bank Dawis · sah tanpa tanda tangan', logoApp ? 22 : 14, 285.5)
    doc.text(`Dicetak ${tanggalPendek(sekarang)} · Hal ${i}/${jumlahHal}`, kanan, 285.5, { align: 'right' })
  }

  doc.save(`e-Statement_${p.noRekening}_${p.tahun}.pdf`)
}