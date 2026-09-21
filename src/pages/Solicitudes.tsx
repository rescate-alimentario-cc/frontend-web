import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, Plus, RefreshCw, Search, Truck, XCircle } from 'lucide-react'
import { cambiarEstado, crearSolicitud, listarSolicitudes, obtenerSolicitud } from '../api/requests'
import { obtenerLote } from '../api/inventory'
import { listarSedes, obtenerOrganizacion } from '../api/organizations'
import { ApiError } from '../api/client'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/toast'
import OrgPicker from '../components/OrgPicker'
import { Campo, Cargando, Drawer, Encabezado, ErrorCaja, Estado, Paginacion, Vacio } from '../components/ui'
import { etiqueta, fmtDec, fmtFechaHora } from '../lib/format'
import { ESTADOS_SOLICITUD, type EstadoSolicitud, type Lote, type Organizacion, type Solicitud } from '../types'

const LIMITE = 15

const TRANSICIONES: Record<EstadoSolicitud, EstadoSolicitud[]> = {
  SOLICITADA: ['APROBADA', 'RECHAZADA', 'CANCELADA'],
  APROBADA: ['EN_RUTA', 'CANCELADA'],
  EN_RUTA: ['ENTREGADA', 'CANCELADA'],
  ENTREGADA: [],
  RECHAZADA: [],
  CANCELADA: [],
}

export default function Solicitudes() {
  const [params, setParams] = useSearchParams()
  const [estado, setEstado] = useState('')
  const [ongId, setOngId] = useState('')
  const [loteId, setLoteId] = useState('')
  const [pagina, setPagina] = useState(0)
  const [nueva, setNueva] = useState(false)
  const [detalle, setDetalle] = useState<number | null>(null)
  const loteInicial = params.get('lote')

  // Llegar desde el catálogo con ?lote=ID abre el formulario ya prellenado.
  useEffect(() => {
    if (loteInicial) setNueva(true)
  }, [loteInicial])

  const solicitudes = useAsync(
    () => listarSolicitudes({ estado, ong_id: ongId, lote_id: loteId, page: pagina, limit: LIMITE }),
    [estado, ongId, loteId, pagina],
  )
  const cambiar = (fn: () => void) => {
    fn()
    setPagina(0)
  }

  return (
    <>
      <Encabezado titulo="Solicitudes y despachos" descripcion="Las ONG reservan lotes y el equipo logístico los lleva hasta la entrega. Cada cambio de estado queda registrado en el historial de auditoría.">
        <button className="btn" onClick={() => setNueva(true)}>
          <Plus size={17} /> Nueva solicitud
        </button>
      </Encabezado>

      <div className="toolbar">
        <Campo etiqueta="Estado">
          {(id) => (
            <select id={id} className="select" value={estado} onChange={(e) => cambiar(() => setEstado(e.target.value))}>
              <option value="">Todos</option>
              {ESTADOS_SOLICITUD.map((e) => <option key={e} value={e}>{etiqueta(e)}</option>)}
            </select>
          )}
        </Campo>
        <Campo etiqueta="ID de ONG">
          {(id) => <input id={id} className="input" inputMode="numeric" value={ongId} onChange={(e) => cambiar(() => setOngId(e.target.value.replace(/\D/g, '')))} placeholder="Ej. 174" />}
        </Campo>
        <Campo etiqueta="ID de lote">
          {(id) => <input id={id} className="input" inputMode="numeric" value={loteId} onChange={(e) => cambiar(() => setLoteId(e.target.value.replace(/\D/g, '')))} placeholder="Ej. 2301" />}
        </Campo>
        <button className="btn ghost" onClick={solicitudes.recargar} aria-label="Actualizar"><RefreshCw size={16} /></button>
      </div>

      <section className="card card-pad">
        {solicitudes.error ? (
          <ErrorCaja error={solicitudes.error} reintentar={solicitudes.recargar} />
        ) : solicitudes.cargando && !solicitudes.data ? (
          <Cargando filas={8} />
        ) : !solicitudes.data?.items.length ? (
          <Vacio texto="No hay solicitudes con esos filtros" />
        ) : (
          <>
            <div className="table-wrap" style={{ opacity: solicitudes.cargando ? 0.6 : 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>N.º</th>
                    <th>Lote</th>
                    <th>ONG</th>
                    <th className="num">Solicitado</th>
                    <th className="num">Recogido</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.data.items.map((s) => (
                    <tr key={s.solicitud_id}>
                      <td className="cell-main mono">#{s.solicitud_id}</td>
                      <td className="mono">#{s.lote_id}</td>
                      <td className="mono">#{s.ong_id}</td>
                      <td className="num">{fmtDec(s.kg_solicitados)} kg</td>
                      <td className="num">{s.kg_recogidos != null ? `${fmtDec(s.kg_recogidos)} kg` : '—'}</td>
                      <td><Estado valor={s.estado_actual} /></td>
                      <td className="muted">{fmtFechaHora(s.fecha_solicitud)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn ghost sm" onClick={() => setDetalle(s.solicitud_id)}><Eye size={14} /> Detalle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion pagina={pagina} limite={LIMITE} total={solicitudes.data.total} cantidad={solicitudes.data.items.length} onCambiar={setPagina} />
          </>
        )}
      </section>

      {nueva && (
        <FormularioSolicitud
          loteInicial={loteInicial ? Number(loteInicial) : undefined}
          onCerrar={() => { setNueva(false); if (loteInicial) setParams({}, { replace: true }) }}
          onListo={() => { setNueva(false); if (loteInicial) setParams({}, { replace: true }); solicitudes.recargar() }}
        />
      )}
      {detalle !== null && <DetalleSolicitud id={detalle} onCerrar={() => setDetalle(null)} onCambio={solicitudes.recargar} />}
    </>
  )
}

/* ── Nueva solicitud: reserva el stock en MS2 y guarda en MongoDB ── */
function FormularioSolicitud({ loteInicial, onCerrar, onListo }: { loteInicial?: number; onCerrar: () => void; onListo: () => void }) {
  const [loteTexto, setLoteTexto] = useState(loteInicial ? String(loteInicial) : '')
  const [lote, setLote] = useState<Lote | null>(null)
  const [errorLote, setErrorLote] = useState<string | null>(null)
  const [ong, setOng] = useState<Organizacion | null>(null)
  const [sedeDestino, setSedeDestino] = useState('')
  const [kg, setKg] = useState('')
  const [enviando, setEnviando] = useState(false)
  const toast = useToast()
  const sedes = useAsync(() => (ong ? listarSedes(ong.organizacionId) : Promise.resolve([])), [ong?.organizacionId])

  async function buscarLote(id: string) {
    setErrorLote(null)
    setLote(null)
    if (!id) return
    try {
      const l = await obtenerLote(Number(id))
      if (l.estado !== 'DISPONIBLE') setErrorLote(`El lote #${l.lote_id} está ${etiqueta(l.estado).toLowerCase()} y no admite solicitudes`)
      else {
        setLote(l)
        setKg(String(Number(l.cantidad_kg)))
      }
    } catch (error) {
      setErrorLote(error instanceof ApiError ? error.message : 'No se pudo consultar el lote')
    }
  }
  useEffect(() => {
    if (loteInicial) void buscarLote(String(loteInicial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const beneficiarios = lote && kg ? Math.round(Number(kg) / Number(lote.factor_racion_kg || 0.4)) : 0

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!lote || !ong) return
    setEnviando(true)
    try {
      const s = await crearSolicitud({
        lote_id: lote.lote_id,
        ong_id: ong.organizacionId,
        sede_donante_id: lote.sede_id,
        sede_destino_id: sedeDestino ? Number(sedeDestino) : undefined,
        kg_solicitados: Number(kg),
        beneficiarios_estimados: beneficiarios || undefined,
      })
      toast.exito(`Solicitud #${s.solicitud_id} creada y lote reservado`)
      onListo()
    } catch (error) {
      toast.fallo(error instanceof ApiError ? error.message : 'No se pudo crear la solicitud')
      setEnviando(false)
    }
  }

  return (
    <Drawer titulo="Nueva solicitud" subtitulo="Al crearla, MS3 reserva el stock en Inventario (MS2)" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="form-grid">
        <Campo etiqueta="N.º de lote" className="full">
          {(id) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <input id={id} className="input" inputMode="numeric" required value={loteTexto} onChange={(e) => { setLoteTexto(e.target.value.replace(/\D/g, '')); setLote(null) }} placeholder="Ej. 2301" />
              <button type="button" className="btn ghost" onClick={() => buscarLote(loteTexto)}><Search size={15} /> Buscar</button>
            </div>
          )}
        </Campo>
        {errorLote && <div className="full alert" role="alert"><XCircle size={18} />{errorLote}</div>}
        {lote && (
          <div className="full card card-pad" style={{ padding: 14 }}>
            <strong>{lote.producto_nombre}</strong>
            <div className="muted" style={{ fontSize: 13 }}>{etiqueta(lote.producto_categoria)} · {fmtDec(lote.cantidad_kg)} kg disponibles · vence {lote.fecha_vencimiento.slice(0, 10)}</div>
          </div>
        )}
        <div className="full">
          <OrgPicker etiqueta="ONG solicitante" tipo="ONG" valor={ong} onElegir={(o) => { setOng(o); setSedeDestino('') }} />
        </div>
        <Campo etiqueta="Sede de destino" className="full">
          {(id) => (
            <select id={id} className="select" value={sedeDestino} onChange={(e) => setSedeDestino(e.target.value)} disabled={!ong}>
              <option value="">{ong ? (sedes.cargando ? 'Cargando…' : 'Selecciona…') : 'Primero elige la ONG'}</option>
              {(sedes.data ?? []).map((s) => <option key={s.sedeId} value={s.sedeId}>{s.nombre} — {s.distrito}</option>)}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Kilos a solicitar" ayuda={beneficiarios ? `≈ ${beneficiarios} raciones` : undefined}>
          {(id) => <input id={id} className="input" type="number" required min="0.1" max={lote ? Number(lote.cantidad_kg) : undefined} step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} disabled={!lote} />}
        </Campo>
        <div className="full actions">
          <button className="btn" disabled={enviando || !lote || !ong}>{enviando ? 'Creando…' : 'Crear solicitud'}</button>
          <button type="button" className="btn ghost" onClick={onCerrar}>Cancelar</button>
        </div>
      </form>
    </Drawer>
  )
}

/* ── Detalle: historial, cambio de estado y evidencia de entrega ── */
function DetalleSolicitud({ id, onCerrar, onCambio }: { id: number; onCerrar: () => void; onCambio: () => void }) {
  const solicitud = useAsync(() => obtenerSolicitud(id), [id])
  const ong = useAsync(() => (solicitud.data ? obtenerOrganizacion(solicitud.data.ong_id) : Promise.resolve(null)), [solicitud.data?.ong_id])
  const [entregando, setEntregando] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [kgRecogidos, setKgRecogidos] = useState('')
  const [receptor, setReceptor] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const toast = useToast()
  const s: Solicitud | null = solicitud.data

  async function mover(nuevo: EstadoSolicitud, extra?: Parameters<typeof cambiarEstado>[2]) {
    setTrabajando(true)
    try {
      await cambiarEstado(id, nuevo, extra)
      toast.exito(`Solicitud #${id}: ${etiqueta(nuevo).toLowerCase()}`)
      setEntregando(false)
      solicitud.recargar()
      onCambio()
    } catch (error) {
      toast.fallo(error instanceof ApiError ? error.message : 'No se pudo cambiar el estado')
    } finally {
      setTrabajando(false)
    }
  }

  function confirmarEntrega(e: FormEvent) {
    e.preventDefault()
    void mover('ENTREGADA', {
      kg_recogidos: Number(kgRecogidos),
      evidencia: { receptor_nombre: receptor || undefined, observaciones: observaciones || undefined, foto_url: fotoUrl || undefined },
    })
  }

  return (
    <Drawer titulo={`Solicitud #${id}`} subtitulo={ong.data ? ong.data.nombre : undefined} onCerrar={onCerrar}>
      {solicitud.error ? (
        <ErrorCaja error={solicitud.error} reintentar={solicitud.recargar} />
      ) : !s ? (
        <Cargando filas={5} />
      ) : (
        <>
          <div className="stats-row" style={{ marginBottom: 18 }}>
            <div className="stat"><b><Estado valor={s.estado_actual} /></b><span style={{ display: 'block', marginTop: 6 }}>Estado</span></div>
            <div className="stat"><b>{fmtDec(s.kg_solicitados)}</b><span>kg solicitados</span></div>
            <div className="stat"><b>{s.kg_recogidos != null ? fmtDec(s.kg_recogidos) : '—'}</b><span>kg recogidos</span></div>
          </div>

          <dl className="dl" style={{ marginBottom: 18 }}>
            <dt>Lote</dt><dd>#{s.lote_id}</dd>
            <dt>ONG</dt><dd>{ong.data?.nombre ?? `#${s.ong_id}`}</dd>
            <dt>Sede origen</dt><dd>{s.sede_donante_id ? `#${s.sede_donante_id}` : '—'}</dd>
            <dt>Sede destino</dt><dd>{s.sede_destino_id ? `#${s.sede_destino_id}` : '—'}</dd>
            <dt>Beneficiarios</dt><dd>{s.beneficiarios_estimados ?? '—'}</dd>
          </dl>

          {TRANSICIONES[s.estado_actual].length > 0 && !entregando && (
            <div className="actions" style={{ marginBottom: 18 }}>
              {TRANSICIONES[s.estado_actual].map((nuevo) =>
                nuevo === 'ENTREGADA' ? (
                  <button key={nuevo} className="btn" onClick={() => { setKgRecogidos(String(s.kg_solicitados)); setEntregando(true) }}><CheckCircle2 size={16} /> Confirmar entrega</button>
                ) : (
                  <button key={nuevo} className={`btn ${nuevo === 'RECHAZADA' || nuevo === 'CANCELADA' ? 'ghost' : ''}`} disabled={trabajando} onClick={() => mover(nuevo)}>
                    {nuevo === 'EN_RUTA' && <Truck size={16} />} {etiqueta(nuevo === 'APROBADA' ? 'Aprobar' : nuevo === 'EN_RUTA' ? 'Enviar en ruta' : nuevo === 'RECHAZADA' ? 'Rechazar' : 'Cancelar')}
                  </button>
                ),
              )}
            </div>
          )}

          {entregando && (
            <form onSubmit={confirmarEntrega} className="form-grid card card-pad" style={{ marginBottom: 18 }}>
              <h2 className="full" style={{ fontSize: 15 }}>Evidencia de entrega</h2>
              <Campo etiqueta="Kg efectivamente recogidos">{(i) => <input id={i} className="input" type="number" required min="0" step="0.1" value={kgRecogidos} onChange={(e) => setKgRecogidos(e.target.value)} />}</Campo>
              <Campo etiqueta="Quién recibe">{(i) => <input id={i} className="input" required value={receptor} onChange={(e) => setReceptor(e.target.value)} />}</Campo>
              <Campo etiqueta="Enlace a la foto" className="full" ayuda="URL de la imagen de respaldo (opcional)">{(i) => <input id={i} className="input" type="url" placeholder="https://…" value={fotoUrl} onChange={(e) => setFotoUrl(e.target.value)} />}</Campo>
              <Campo etiqueta="Observaciones" className="full">{(i) => <textarea id={i} className="textarea" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />}</Campo>
              <div className="full actions">
                <button className="btn" disabled={trabajando}>{trabajando ? 'Guardando…' : 'Registrar entrega'}</button>
                <button type="button" className="btn ghost" onClick={() => setEntregando(false)}>Volver</button>
              </div>
            </form>
          )}

          {s.evidencia && (
            <div className="card card-pad" style={{ marginBottom: 18, padding: 14 }}>
              <strong>Evidencia registrada</strong>
              <dl className="dl" style={{ marginTop: 8 }}>
                <dt>Receptor</dt><dd>{s.evidencia.receptor_nombre ?? '—'}</dd>
                <dt>Observaciones</dt><dd>{s.evidencia.observaciones ?? '—'}</dd>
                <dt>Foto</dt><dd>{s.evidencia.foto_url ? <a href={s.evidencia.foto_url} target="_blank" rel="noreferrer noopener">Ver imagen</a> : '—'}</dd>
              </dl>
            </div>
          )}

          <h2 style={{ fontSize: 15, marginBottom: 12 }}>Historial</h2>
          <ol className="timeline">
            {s.historial_estados.map((h, i) => (
              <li key={i}>
                <Estado valor={h.estado} /> <span className="muted" style={{ fontSize: 13, marginLeft: 6 }}>{fmtFechaHora(h.fecha)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </Drawer>
  )
}
