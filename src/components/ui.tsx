import { useEffect, useId, type ReactNode } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, RefreshCw, X, type LucideIcon } from 'lucide-react'
import { fmtNum, etiqueta } from '../lib/format'
import type { ApiError } from '../api/client'

/* ── Tarjeta KPI ── */
export function KpiCard({
  icono: Icono,
  titulo,
  valor,
  pie,
  tono,
  cargando,
}: {
  icono: LucideIcon
  titulo: string
  valor: string
  pie?: string
  tono?: 'amber' | 'info' | 'violet' | 'danger'
  cargando?: boolean
}) {
  return (
    <div className={`card kpi ${tono ? `tono-${tono}` : ''}`}>
      <div className="kpi-top">
        <span className="kpi-icon" aria-hidden="true">
          <Icono size={17} />
        </span>
        {titulo}
      </div>
      {cargando ? <div className="skeleton" style={{ height: 36, width: '60%', marginTop: 12 }} /> : <div className="kpi-value">{valor}</div>}
      {pie && <div className="kpi-foot">{pie}</div>}
    </div>
  )
}

/* ── Estados ── */
export function Cargando({ filas = 5 }: { filas?: number }) {
  return (
    <div style={{ display: 'grid', gap: 10, padding: '6px 0' }} aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 38, opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  )
}

export function Vacio({ texto, detalle }: { texto: string; detalle?: string }) {
  return (
    <div className="empty">
      <Inbox size={30} aria-hidden="true" />
      <strong>{texto}</strong>
      {detalle && <span>{detalle}</span>}
    </div>
  )
}

export function ErrorCaja({ error, reintentar }: { error: ApiError; reintentar?: () => void }) {
  return (
    <div className="alert" role="alert">
      <AlertTriangle size={18} aria-hidden="true" />
      <div style={{ flex: 1 }}>
        <strong>{error.message}</strong>
        {error.detalle && error.detalle !== error.message && <div className="muted" style={{ fontSize: 13 }}>{error.detalle}</div>}
      </div>
      {reintentar && (
        <button className="btn ghost sm" onClick={reintentar}>
          <RefreshCw size={14} /> Reintentar
        </button>
      )}
    </div>
  )
}

/* ── Badges ── */
const TONO_ESTADO: Record<string, string> = {
  DISPONIBLE: 'ok',
  RESERVADO: 'warn',
  ENTREGADO: 'info',
  VENCIDO: 'bad',
  SOLICITADA: 'warn',
  APROBADA: 'info',
  EN_RUTA: 'violet',
  ENTREGADA: 'ok',
  RECHAZADA: 'bad',
  CANCELADA: '',
  DONANTE: 'warn',
  ONG: 'info',
}

export function Estado({ valor }: { valor: string }) {
  return <span className={`badge ${TONO_ESTADO[valor] ?? ''}`}>{etiqueta(valor)}</span>
}

/* ── Paginación (soporta total desconocido) ── */
export function Paginacion({
  pagina,
  limite,
  total,
  cantidad,
  onCambiar,
}: {
  pagina: number
  limite: number
  total: number | null
  cantidad: number
  onCambiar: (pagina: number) => void
}) {
  const desde = cantidad === 0 ? 0 : pagina * limite + 1
  const hasta = pagina * limite + cantidad
  const hayMas = total !== null ? hasta < total : cantidad === limite
  return (
    <nav className="pagination" aria-label="Paginación">
      <span>
        {total !== null ? `${fmtNum(desde)}–${fmtNum(hasta)} de ${fmtNum(total)}` : `${fmtNum(desde)}–${fmtNum(hasta)}`}
      </span>
      <div className="actions">
        <button className="btn ghost sm" disabled={pagina === 0} onClick={() => onCambiar(pagina - 1)}>
          <ChevronLeft size={15} /> Anterior
        </button>
        <button className="btn ghost sm" disabled={!hayMas} onClick={() => onCambiar(pagina + 1)}>
          Siguiente <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  )
}

/* ── Panel lateral ── */
export function Drawer({ titulo, subtitulo, onCerrar, children }: { titulo: string; subtitulo?: string; onCerrar: () => void; children: ReactNode }) {
  const idTitulo = useId()
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alTeclear)
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = previo
    }
  }, [onCerrar])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <div className="drawer-head">
          <div>
            <h2 id={idTitulo}>{titulo}</h2>
            {subtitulo && <p className="muted" style={{ marginTop: 4 }}>{subtitulo}</p>}
          </div>
          <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  )
}

/* ── Campo de formulario ── */
export function Campo({ etiqueta: texto, ayuda, children, className }: { etiqueta: string; ayuda?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId()
  return (
    <div className={`field ${className ?? ''}`}>
      <label htmlFor={id}>{texto}</label>
      {children(id)}
      {ayuda && <span className="hint">{ayuda}</span>}
    </div>
  )
}

export function Encabezado({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </header>
  )
}
