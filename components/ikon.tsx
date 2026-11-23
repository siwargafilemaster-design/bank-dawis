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
  silang: <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>,
  gembok: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  rumah: <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  daftar: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
  orang: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  unduh: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
  chat: <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5z" />,
  mata: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  mataTutup: <><path d="M17.9 17.9A10 10 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5.1-5.9" /><path d="M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2" /><path d="M1 1l22 22" /></>,
  tukar: <><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
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