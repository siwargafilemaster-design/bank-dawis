import type { Mutasi } from './bank'
import { rupiah, namaPeriode, tanggalJam, LABEL_JENIS, JENIS_MASUK } from './format'

export async function unduhStatement(p: {
  nama: string
  noRekening: string
  periode: string
  saldoAwal: number
  mutasi: Mutasi[] // urut lama → baru
  dikoreksi: Set<number>
}) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const kanan = 196

  // ----- kop -----
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(10, 110, 140)
  doc.text('BANK DAWIS', 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(94, 107, 118)
  doc.text('Tabungan Anggota Dasa Wisma', 14, 23)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(31, 42, 51)
  doc.text('e-Statement', kanan, 18, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(namaPeriode(p.periode), kanan, 23, { align: 'right' })

  doc.setDrawColor(207, 217, 224)
  doc.line(14, 27, kanan, 27)

  // ----- identitas -----
  let masuk = 0
  let keluar = 0
  for (const m of p.mutasi) {
    if (JENIS_MASUK.has(m.jenis)) masuk += m.nominal
    else keluar += m.nominal
  }
  const saldoAkhir = p.mutasi.length
    ? p.mutasi[p.mutasi.length - 1].saldo_setelah
    : p.saldoAwal

  doc.setFontSize(10)
  const baris: [string, string][] = [
    ['Nama', p.nama],
    ['No. Rekening', p.noRekening],
    ['Periode', namaPeriode(p.periode)],
  ]
  baris.forEach(([k, v], i) => {
    doc.setTextColor(94, 107, 118)
    doc.text(k, 14, 35 + i * 6)
    doc.setTextColor(31, 42, 51)
    doc.text(': ' + v, 44, 35 + i * 6)
  })

  const ringkas: [string, string][] = [
    ['Saldo awal', rupiah(p.saldoAwal)],
    ['Total masuk', rupiah(masuk)],
    ['Total keluar', rupiah(keluar)],
    ['Saldo akhir', rupiah(saldoAkhir)],
  ]
  ringkas.forEach(([k, v], i) => {
    doc.setTextColor(94, 107, 118)
    doc.text(k, 130, 35 + i * 6)
    doc.setTextColor(31, 42, 51)
    if (i === 3) doc.setFont('helvetica', 'bold')
    doc.text(v, kanan, 35 + i * 6, { align: 'right' })
    doc.setFont('helvetica', 'normal')
  })

  // ----- tabel mutasi -----
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
    startY: 62,
    head: [['Tanggal', 'Keterangan', 'Masuk', 'Keluar', 'Saldo']],
    body: isi.length ? isi : [['', 'Tidak ada transaksi bulan ini', '', '', '']],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [10, 110, 140], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 30 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 30 },
    },
  })

  const akhirY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  doc.setFontSize(8)
  doc.setTextColor(94, 107, 118)
  doc.text(
    'Dokumen ini dibuat otomatis oleh aplikasi Bank Dawis dan sah tanpa tanda tangan.',
    14,
    akhirY + 10
  )

  doc.save(`e-Statement_${p.noRekening}_${p.periode}.pdf`)
}