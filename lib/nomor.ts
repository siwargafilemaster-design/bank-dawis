// HARUS identik dengan fungsi SQL public.normal_wa()
export const AKHIRAN_EMAIL = '@bankdawis.invalid'

export function normalWa(input: string): string {
  const d = input.replace(/\D/g, '')
  if (d.startsWith('62')) return d
  if (d.startsWith('0')) return '62' + d.slice(1)
  if (d.startsWith('8')) return '62' + d
  return d
}

export function emailDariHp(hp: string): string {
  return normalWa(hp) + AKHIRAN_EMAIL
}