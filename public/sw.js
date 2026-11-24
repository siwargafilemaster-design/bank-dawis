// Service worker Bank Dawis
// Naikkan angka versi setiap kali file ini diubah.
const CACHE = 'bankdawis-v1'

const STATIS = [
  '/logo.jpg',
  '/ikon.jpg',
  '/logo-gamersi.png',
  '/logo-gamersi-putih.png',
  '/icon-192.png',
  '/icon-512.png',
]

const HALAMAN_OFFLINE = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bank Dawis</title>
<style>
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;
font-family:system-ui,sans-serif;background:#fff;color:#1F2A33;text-align:center;padding:24px;box-sizing:border-box}
img{width:88px;height:88px;margin-bottom:20px}
button{margin-top:24px;height:48px;padding:0 24px;border:0;border-radius:14px;background:#0A6E8C;color:#fff;font-size:15px;font-weight:600}
p{color:#5E6B76;font-size:14px;line-height:1.6;max-width:280px}
</style></head><body>
<img src="/ikon.jpg" alt="">
<h1 style="font-size:19px;margin:0 0 8px">Tidak ada koneksi internet</h1>
<p>Bank Dawis butuh internet untuk menampilkan saldo dan mencatat transaksi. Periksa sinyal atau kuota, lalu coba lagi.</p>
<button onclick="location.reload()">Coba lagi</button>
</body></html>`

self.addEventListener('install', (e) => {
  // allSettled: satu file gagal tidak menggagalkan pemasangan (pelajaran app Bendahara)
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(STATIS.map((u) => c.add(u))))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // Supabase & domain lain: JANGAN disentuh
  if (url.origin !== self.location.origin) return
  // route server (buat akun, reset PIN): JANGAN disentuh
  if (url.pathname.startsWith('/api/')) return

  // Halaman: selalu ambil dari internet; kalau gagal → pesan offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(
        () =>
          new Response(HALAMAN_OFFLINE, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
      )
    )
    return
  }

  // File tampilan: ambil dari cache dulu, kalau tak ada → internet → simpan
  if (url.pathname.startsWith('/_next/static/') || STATIS.includes(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (ada) =>
          ada ||
          fetch(req)
            .then((res) => {
              if (res.ok) {
                const salinan = res.clone()
                caches.open(CACHE).then((c) => c.put(req, salinan))
              }
              return res
            })
            // .catch WAJIB: tanpa ini aplikasi bisa membeku (bug splash app Bendahara)
            .catch(() => new Response('', { status: 504 }))
      )
    )
  }
})