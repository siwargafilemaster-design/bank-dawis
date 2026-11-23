import Image from 'next/image'

export function Memuat({ teks = 'Memuat…' }: { teks?: string }) {
  return (
    <main className="pemuat" role="status" aria-live="polite">
      <div className="pemuat-bingkai">
        <Image
          src="/ikon.jpg"
          alt=""
          width={84}
          height={84}
          priority
          className="pemuat-logo"
        />
      </div>
      <p>{teks}</p>
    </main>
  )
}