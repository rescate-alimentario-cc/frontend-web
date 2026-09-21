const numero = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const fmtNum = (n: number | string | null | undefined) => (n === null || n === undefined ? '—' : numero.format(Number(n)))
export const fmtDec = (n: number | string | null | undefined) => (n === null || n === undefined ? '—' : decimal.format(Number(n)))
export const fmtKg = (n: number | string | null | undefined) => (n === null || n === undefined ? '—' : `${decimal.format(Number(n))} kg`)

/** Compacta cifras grandes para tarjetas: 1 123 968 → 1,12 M. */
export function fmtCompacto(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString('es-PE', { maximumFractionDigits: 2 })} M`
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toLocaleString('es-PE', { maximumFractionDigits: 1 })} mil`
  return numero.format(n)
}

// Los servicios devuelven fechas como '2026-09-21', '2026-09-21T04:12:19' o con 'Z'.
function analizar(valor: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? `${valor}T00:00:00` : valor.replace(' ', 'T'))
}

export function fmtFecha(valor: string | null | undefined): string {
  if (!valor) return '—'
  const fecha = analizar(valor)
  return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtFechaHora(valor: string | null | undefined): string {
  if (!valor) return '—'
  const fecha = analizar(valor)
  return Number.isNaN(fecha.getTime())
    ? valor
    : fecha.toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function diasHasta(valor: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((analizar(valor).getTime() - hoy.getTime()) / 86_400_000)
}

/** COMEDOR_POPULAR → Comedor popular */
export function etiqueta(valor: string | null | undefined): string {
  if (!valor) return '—'
  if (valor === 'ONG') return 'ONG'
  const t = valor.replace(/_/g, ' ').toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function descargarCsv(nombre: string, filas: Record<string, unknown>[]) {
  if (!filas.length) return
  const columnas = Object.keys(filas[0])
  const celda = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [columnas.join(','), ...filas.map((f) => columnas.map((c) => celda(f[c])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const enlace = Object.assign(document.createElement('a'), { href: url, download: `${nombre}.csv` })
  enlace.click()
  URL.revokeObjectURL(url)
}
