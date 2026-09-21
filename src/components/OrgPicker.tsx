import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { listarOrganizaciones } from '../api/organizations'
import { useAsync, useDebounce } from '../hooks/useAsync'
import { etiqueta } from '../lib/format'
import type { Organizacion } from '../types'
import { Campo } from './ui'

/** Buscador de organizaciones por nombre o RUC, con paginación en el servidor (hay más de 20 000). */
export default function OrgPicker({
  etiqueta: texto,
  tipo,
  valor,
  onElegir,
}: {
  etiqueta: string
  tipo: 'DONANTE' | 'ONG'
  valor: Organizacion | null
  onElegir: (org: Organizacion | null) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const q = useDebounce(busqueda.trim())
  const { data, cargando } = useAsync(
    () => (q.length >= 2 ? listarOrganizaciones({ tipo, activo: 'true', q, limit: 6 }) : Promise.resolve(null)),
    [q, tipo],
  )
  useEffect(() => {
    if (valor) setBusqueda('')
  }, [valor])

  if (valor) {
    return (
      <Campo etiqueta={texto}>
        {() => (
          <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <span>
              <strong>{valor.nombre}</strong> <span className="muted">· #{valor.organizacionId}</span>
            </span>
            <button type="button" className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => onElegir(null)} aria-label="Quitar selección">
              <X size={14} />
            </button>
          </div>
        )}
      </Campo>
    )
  }

  return (
    <Campo etiqueta={texto} ayuda="Escribe al menos 2 letras del nombre o RUC">
      {(id) => (
        <div>
          <div className="search">
            <Search size={16} aria-hidden="true" />
            <input id={id} className="input" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={tipo === 'ONG' ? 'Buscar ONG…' : 'Buscar donante…'} autoComplete="off" />
          </div>
          {q.length >= 2 && (
            <ul className="card" style={{ listStyle: 'none', margin: '6px 0 0', padding: 4 }}>
              {cargando && <li className="muted" style={{ padding: 10 }}>Buscando…</li>}
              {!cargando && data?.items.length === 0 && <li className="muted" style={{ padding: 10 }}>Sin resultados</li>}
              {data?.items.map((o) => (
                <li key={o.organizacionId}>
                  <button type="button" className="btn ghost" style={{ width: '100%', justifyContent: 'space-between', border: 0 }} onClick={() => onElegir(o)}>
                    <span>{o.nombre}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{etiqueta(o.categoria)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Campo>
  )
}
