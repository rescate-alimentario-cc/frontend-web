import type { ReactNode } from 'react'
import { Tooltip } from 'recharts'
import { fmtNum } from '../lib/format'

export const COLORES = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)']

export const ejeTexto = { fill: 'var(--muted)', fontSize: 12 }

/** Tooltip que respeta el tema claro/oscuro. */
export function TooltipTema({ formato = fmtNum, sufijo = '' }: { formato?: (n: number) => string; sufijo?: string }) {
  return (
    <Tooltip
      cursor={{ fill: 'var(--surface-2)', opacity: 0.6 }}
      contentStyle={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        boxShadow: 'var(--shadow)',
        color: 'var(--ink)',
        fontSize: 13,
      }}
      labelStyle={{ color: 'var(--ink)', fontWeight: 600 }}
      itemStyle={{ color: 'var(--ink)' }}
      formatter={(v) => `${formato(Number(v))}${sufijo}`}
    />
  )
}

export function TarjetaGrafico({ titulo, descripcion, acciones, children }: { titulo: string; descripcion?: string; acciones?: ReactNode; children: ReactNode }) {
  return (
    <section className="card card-pad">
      <div className="card-head">
        <div>
          <h2>{titulo}</h2>
          {descripcion && <p>{descripcion}</p>}
        </div>
        {acciones}
      </div>
      {children}
    </section>
  )
}
