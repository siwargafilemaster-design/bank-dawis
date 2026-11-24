// Membuat semua ikon PWA dari public/ikon.jpg ("da digital").
// Jalankan sekali: node scripts/buat-ikon.mjs
import sharp from 'sharp'

const SUMBER = 'public/ikon.jpg'

await sharp(SUMBER).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(SUMBER).resize(512, 512).png().toFile('public/icon-512.png')
await sharp(SUMBER).resize(180, 180).png().toFile('public/apple-touch-icon.png')

// Ikon "maskable": Android memotongnya jadi bulat/kotak/tetes sesuai merek HP.
// Isi diperkecil ke 72% di tengah kanvas putih → aman dari potongan.
const isi = await sharp(SUMBER).resize(368, 368).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#FFFFFF' },
})
  .composite([{ input: isi, gravity: 'center' }])
  .png()
  .toFile('public/icon-maskable-512.png')

console.log('selesai: 4 ikon dibuat')