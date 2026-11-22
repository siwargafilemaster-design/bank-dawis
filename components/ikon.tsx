const JALUR = {
  masuk: <><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>,
  keluar: <><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>,
  tambahOrang: <><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M19 8v6" /><path d="M16 11h6" /></>,
  kas: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><path d="M8 15h3" /></>,
  cari: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  kembali: <path d="M15 18l-6-6 6-6" />,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
  cek: <path d="M20 6L9 17l-5-5" />,
  hapus: <><path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" /><path d="M17 9l-6 6" /><path d="M11 9l6 6" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  hp: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
}

export type NamaIkon = keyof typeof JALUR

export function Ikon({ nama, ukuran = 24 }: { nama: NamaIkon; ukuran?: number }) {
  return (
    <svg
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {JALUR[nama]}
    </svg>
  )
}