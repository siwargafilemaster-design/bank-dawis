'use client'

export function KotakPin({
  id,
  value,
  onChange,
  label,
  tampak = false,
  autoComplete = 'off',
}: {
  id: string
  value: string
  onChange: (v: string) => void
  label: string
  tampak?: boolean // true = angka terlihat (untuk PIN awal di layar teller)
  autoComplete?: string
}) {
  const angka = value.split('')

  return (
    <div className="kotak-pin">
      <input
        id={id}
        className="kotak-pin-isian"
        type={tampak ? 'text' : 'password'}
        inputMode="numeric"
        autoComplete={autoComplete}
        maxLength={6}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={[
            'kotak',
            i < angka.length ? 'terisi' : '',
            i === angka.length ? 'aktif' : '',
          ].join(' ')}
        >
          {i < angka.length ? (tampak ? angka[i] : '•') : ''}
        </span>
      ))}
    </div>
  )
}