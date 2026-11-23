'use client'

import { Ikon } from './ikon'

export function Lembar({
  judul,
  tutup,
  children,
}: {
  judul: string
  tutup: () => void
  children: React.ReactNode
}) {
  return (
    <div className="lembar-latar" onClick={tutup}>
      <div
        className="lembar"
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lembar-kepala">
          <h2>{judul}</h2>
          <button onClick={tutup} aria-label="Tutup">
            <Ikon nama="silang" ukuran={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}