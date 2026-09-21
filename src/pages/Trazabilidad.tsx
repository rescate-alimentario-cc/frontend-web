import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, ExternalLink, PackageSearch, Search, Store } from 'lucide-react'
import { listarEntregas, trazarLote } from '../api/traceability'
import { ApiError } from '../api/client'
import { useAsync } from '../hooks/useAsync'
import { Cargando, Encabezado, ErrorCaja, Estado, Paginacion, Vacio } from '../components/ui'
import { etiqueta, fmtDec, fmtFecha, fmtFechaHora, fmtNum } from '../lib/format'
import type { Trazabilidad as Traza } from '../types'

const LIMITE = 8

export default function Trazabilidad() {
  const [params, setParams] = useSearchParams()
  const [texto, setTexto] = useState(params.get('lote') ?? '')
  const loteId = params.get('lote')
  const [pagina, setPagina] = useState(0)

  const traza = useAsync(() => (loteId ? trazarLote(Number(loteId)) : Promise.resolve(null)), [loteId])
  const entregas = useAsync(() => listarEntregas(pagina, LIMITE), [pagina])

  function buscar(e: FormEvent) {
    e.preventDefault()
    if (texto) setParams({ lote: texto })
  }

  return (
    <>
      <Encabezado titulo="Trazabilidad de lotes" descripcion="Sigue un lote de punta a punta: quién lo donó, desde qué sede, quién lo solicitó y en qué estado terminó. El orquestador consolida MS1, MS2 y MS3 en cada consulta.">
      </Encabezado>

      <form onSubmit={buscar} className="card card-pad" style={{ marginBottom: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <label htmlFor="lote">N.º de lote</label>
          <div className="search">
            <PackageSearch size={16} aria-hidden="true" />
            <input id="lote" className="input" inputMode="numeric" value={texto} onChange={(e) => setTexto(e.target.value.replace(/\D/g, ''))} placeholder="Ej. 2301" />
          </div>
        </div>
        <button className="btn" disabled={!texto}><Search size={16} /> Trazar</button>
      </form>

      {loteId && (
        <div style={{ marginBottom: 24 }}>
          {traza.error ? (
            <ErrorCaja error={traza.error} reintentar={traza.recargar} />
          ) : traza.cargando || !traza.data ? (
            <Cargando filas={6} />
          ) : (
            <Resultado t={traza.data} />
          )}
        </div>
      )}

      <section className="card card-pad">
        <div className="card-head">
          <div>
            <h2>Entregas con evidencia</h2>
            <p>Solicitudes entregadas, con los nombres del donante y de la ONG</p>
          </div>
        </div>
        {entregas.error ? (
          <ErrorCaja error={entregas.error} reintentar={entregas.recargar} />
        ) : entregas.cargando && !entregas.data ? (
          <Cargando />
        ) : !entregas.data?.items.length ? (
          <Vacio texto="Aún no hay entregas registradas" />
        ) : (
          <>
            <div className="table-wrap" style={{ opacity: entregas.cargando ? 0.6 : 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Donante</th>
                    <th>ONG</th>
                    <th className="num">Kg</th>
                    <th>Entregado</th>
                    <th>Evidencia</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {entregas.data.items.map((e) => (
                    <tr key={e.solicitud_id}>
                      <td>
                        <div className="cell-main">{e.producto}</div>
                        <div className="cell-sub">Solicitud #{e.solicitud_id}</div>
                      </td>
                      <td>{e.donante}</td>
                      <td>{e.ong}</td>
                      <td className="num">{fmtDec(e.kg_recogidos)}</td>
                      <td className="muted">{fmtFechaHora(e.fecha_entrega)}</td>
                      <td>
                        {e.evidencia?.receptor_nombre ? (
                          <>
                            <div>{e.evidencia.receptor_nombre}</div>
                            {e.evidencia.foto_url && (
                              <a className="cell-sub" href={e.evidencia.foto_url} target="_blank" rel="noreferrer noopener">
                                Ver foto <ExternalLink size={11} style={{ verticalAlign: '-1px' }} />
                              </a>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn ghost sm" onClick={() => { setTexto(String(e.lote_id)); setParams({ lote: String(e.lote_id) }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                          Trazar lote
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion pagina={pagina} limite={LIMITE} total={entregas.data.total} cantidad={entregas.data.items.length} onCambiar={setPagina} />
          </>
        )}
      </section>
    </>
  )
}

function Resultado({ t }: { t: Traza }) {
  const { lote, donante, solicitudes, resumen } = t
  return (
    <div className="grid cols-2">
      <section className="card card-pad">
        <div className="card-head">
          <div>
            <h2>{lote.producto_nombre}</h2>
            <p>Lote #{lote.lote_id} · {etiqueta(lote.producto_categoria)}</p>
          </div>
          <Estado valor={lote.estado} />
        </div>
        <div className="stats-row" style={{ marginBottom: 16 }}>
          <div className="stat"><b>{fmtDec(lote.cantidad_kg)}</b><span>kg publicados</span></div>
          <div className="stat"><b>{fmtNum(resumen.total_solicitudes)}</b><span>solicitudes</span></div>
          <div className="stat"><b>{fmtDec(resumen.kg_entregados)}</b><span>kg entregados</span></div>
        </div>
        <dl className="dl">
          <dt>Producción</dt><dd>{fmtFecha(lote.fecha_produccion)}</dd>
          <dt>Vencimiento</dt><dd>{fmtFecha(lote.fecha_vencimiento)}</dd>
          <dt>Publicado</dt><dd>{fmtFecha(lote.fecha_publicacion)}</dd>
        </dl>

        <h3 style={{ margin: '20px 0 10px', fontSize: 14 }}><Store size={15} style={{ verticalAlign: '-2px' }} /> Origen</h3>
        <div className="card" style={{ padding: 14, boxShadow: 'none' }}>
          <strong>{donante.nombre}</strong>
          <div className="muted" style={{ fontSize: 13 }}>{etiqueta(donante.categoria)} · {donante.email ?? 'sin correo'}</div>
          {donante.sede ? (
            <dl className="dl" style={{ marginTop: 10 }}>
              <dt>Sede</dt><dd>{donante.sede.nombre}</dd>
              <dt>Distrito</dt><dd>{donante.sede.distrito}</dd>
              <dt>Dirección</dt><dd>{donante.sede.direccion ?? '—'}</dd>
            </dl>
          ) : (
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>La sede #{lote.sede_id} no figura entre las sedes del donante.</p>
          )}
        </div>
      </section>

      <section className="card card-pad">
        <div className="card-head">
          <div>
            <h2>Recorrido del lote</h2>
            <p>{solicitudes.length ? 'Solicitudes en orden cronológico' : 'Nadie lo ha solicitado todavía'}</p>
          </div>
        </div>
        {solicitudes.length === 0 ? (
          <Vacio texto="Sin solicitudes" detalle="El lote sigue publicado en el catálogo." />
        ) : (
          <ol className="timeline">
            {solicitudes.map((s) => (
              <li key={s.solicitud_id}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <strong>Solicitud #{s.solicitud_id}</strong> <Estado valor={s.estado_actual} />
                </div>
                <div style={{ fontSize: 14 }}><Building2 size={13} style={{ verticalAlign: '-2px' }} /> {s.ong.nombre}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {fmtDec(s.kg_solicitados)} kg solicitados{s.kg_recogidos != null && ` · ${fmtDec(s.kg_recogidos)} kg recogidos`} · {fmtFechaHora(s.fecha_solicitud)}
                </div>
                {s.evidencia?.receptor_nombre && <div className="muted" style={{ fontSize: 13 }}>Recibió {s.evidencia.receptor_nombre}</div>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

export function mensajeError(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Error inesperado'
}
