import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { HandHeart, Lock, PackagePlus, RefreshCw } from 'lucide-react'
import { listarLotes, listarProductos, publicarLote, reservarLote } from '../api/inventory'
import { listarSedes } from '../api/organizations'
import { ApiError } from '../api/client'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/toast'
import OrgPicker from '../components/OrgPicker'
import { Campo, Cargando, Drawer, Encabezado, ErrorCaja, Estado, Paginacion, Vacio } from '../components/ui'
import { diasHasta, etiqueta, fmtDec, fmtFecha } from '../lib/format'
import { CATEGORIAS_PRODUCTO, type Lote, type Organizacion } from '../types'

const LIMITE = 15

function Vencimiento({ fecha }: { fecha: string }) {
  const dias = diasHasta(fecha)
  const tono = dias < 0 ? 'bad' : dias <= 5 ? 'warn' : ''
  const texto = dias < 0 ? `venció hace ${-dias} d` : dias === 0 ? 'vence hoy' : `en ${dias} d`
  return (
    <>
      <div>{fmtFecha(fecha)}</div>
      <span className={`badge ${tono}`} style={{ marginTop: 3 }}>{texto}</span>
    </>
  )
}

export default function Catalogo() {
  const [estado, setEstado] = useState('DISPONIBLE')
  const [categoria, setCategoria] = useState('')
  const [venceAntes, setVenceAntes] = useState('')
  const [pagina, setPagina] = useState(0)
  const [publicando, setPublicando] = useState(false)
  const [reservando, setReservando] = useState<Lote | null>(null)
  const navigate = useNavigate()

  const lotes = useAsync(
    () => listarLotes({ estado, categoria, vence_antes: venceAntes, page: pagina, limit: LIMITE }),
    [estado, categoria, venceAntes, pagina],
  )
  const cambiar = (fn: () => void) => {
    fn()
    setPagina(0)
  }

  return (
    <>
      <Encabezado titulo="Catálogo de donaciones" descripcion="Excedentes publicados por los donantes. Filtra por categoría y fecha de caducidad, publica nuevos lotes o reserva alimento para tu ONG.">
        <button className="btn" onClick={() => setPublicando(true)}>
          <PackagePlus size={17} /> Publicar lote
        </button>
      </Encabezado>

      <div className="toolbar">
        <Campo etiqueta="Estado">
          {(id) => (
            <select id={id} className="select" value={estado} onChange={(e) => cambiar(() => setEstado(e.target.value))}>
              <option value="">Todos</option>
              {['DISPONIBLE', 'RESERVADO', 'ENTREGADO', 'VENCIDO'].map((e) => (
                <option key={e} value={e}>{etiqueta(e)}</option>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Categoría">
          {(id) => (
            <select id={id} className="select" value={categoria} onChange={(e) => cambiar(() => setCategoria(e.target.value))}>
              <option value="">Todas</option>
              {CATEGORIAS_PRODUCTO.map((c) => (
                <option key={c} value={c}>{etiqueta(c)}</option>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Vence hasta">
          {(id) => <input id={id} type="date" className="input" value={venceAntes} onChange={(e) => cambiar(() => setVenceAntes(e.target.value))} />}
        </Campo>
        <button className="btn ghost" onClick={lotes.recargar} aria-label="Actualizar">
          <RefreshCw size={16} />
        </button>
      </div>

      <section className="card card-pad">
        {lotes.error ? (
          <ErrorCaja error={lotes.error} reintentar={lotes.recargar} />
        ) : lotes.cargando && !lotes.data ? (
          <Cargando filas={8} />
        ) : !lotes.data?.items.length ? (
          <Vacio texto="No hay lotes con esos filtros" detalle="Prueba con otro estado o categoría." />
        ) : (
          <>
            <div className="table-wrap" style={{ opacity: lotes.cargando ? 0.6 : 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="num">Cantidad</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lotes.data.items.map((l) => (
                    <tr key={l.lote_id}>
                      <td>
                        <div className="cell-main">{l.producto_nombre}</div>
                        <div className="cell-sub">Lote #{l.lote_id} · donante #{l.organizacion_id}</div>
                      </td>
                      <td>{etiqueta(l.producto_categoria)}</td>
                      <td className="num">{fmtDec(l.cantidad_kg)} kg</td>
                      <td><Vencimiento fecha={l.fecha_vencimiento} /></td>
                      <td><Estado valor={l.estado} /></td>
                      <td>
                        {l.estado === 'DISPONIBLE' && (
                          <div className="actions" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                            <button className="btn ghost sm" onClick={() => setReservando(l)}>
                              <Lock size={14} /> Reservar
                            </button>
                            <button className="btn sm" onClick={() => navigate(`/solicitudes?lote=${l.lote_id}`)}>
                              <HandHeart size={14} /> Solicitar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion pagina={pagina} limite={LIMITE} total={lotes.data.total} cantidad={lotes.data.items.length} onCambiar={setPagina} />
          </>
        )}
      </section>

      {publicando && <FormularioLote onCerrar={() => setPublicando(false)} onListo={() => { setPublicando(false); lotes.recargar() }} />}
      {reservando && <ReservaLote lote={reservando} onCerrar={() => setReservando(null)} onListo={() => { setReservando(null); lotes.recargar() }} />}
    </>
  )
}

function ReservaLote({ lote, onCerrar, onListo }: { lote: Lote; onCerrar: () => void; onListo: () => void }) {
  const [kg, setKg] = useState('')
  const [enviando, setEnviando] = useState(false)
  const toast = useToast()

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      const r = await reservarLote(lote.lote_id, kg ? Number(kg) : undefined)
      toast.exito(r.message)
      onListo()
    } catch (error) {
      toast.fallo(error instanceof ApiError ? error.message : 'No se pudo reservar')
      setEnviando(false)
    }
  }

  return (
    <Drawer titulo="Reservar lote" subtitulo={`${lote.producto_nombre} · lote #${lote.lote_id}`} onCerrar={onCerrar}>
      <form onSubmit={enviar} className="form-grid">
        <p className="full muted">Disponible: <strong>{fmtDec(lote.cantidad_kg)} kg</strong>. Si dejas la cantidad vacía se reserva el lote completo; si es menor, se descuenta del stock.</p>
        <Campo etiqueta="Cantidad a reservar (kg)" className="full">
          {(id) => <input id={id} className="input" type="number" min="0.1" max={Number(lote.cantidad_kg)} step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="Lote completo" />}
        </Campo>
        <div className="full actions">
          <button className="btn" disabled={enviando}>{enviando ? 'Reservando…' : 'Confirmar reserva'}</button>
          <button type="button" className="btn ghost" onClick={onCerrar}>Cancelar</button>
        </div>
      </form>
    </Drawer>
  )
}

function FormularioLote({ onCerrar, onListo }: { onCerrar: () => void; onListo: () => void }) {
  const hoy = new Date().toISOString().slice(0, 10)
  const [categoria, setCategoria] = useState('')
  const [productoId, setProductoId] = useState('')
  const [donante, setDonante] = useState<Organizacion | null>(null)
  const [sedeId, setSedeId] = useState('')
  const [kg, setKg] = useState('')
  const [produccion, setProduccion] = useState(hoy)
  const [vencimiento, setVencimiento] = useState('')
  const [enviando, setEnviando] = useState(false)
  const toast = useToast()

  const productos = useAsync(listarProductos, [])
  const sedes = useAsync(() => (donante ? listarSedes(donante.organizacionId) : Promise.resolve([])), [donante?.organizacionId])
  const disponibles = (productos.data ?? []).filter((p) => !categoria || p.categoria === categoria)

  function elegirProducto(id: string) {
    setProductoId(id)
    const p = productos.data?.find((x) => String(x.producto_id) === id)
    if (p) {
      const v = new Date(produccion)
      v.setDate(v.getDate() + p.dias_vida_util)
      setVencimiento(v.toISOString().slice(0, 10))
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!donante) return toast.fallo('Elige el donante')
    setEnviando(true)
    try {
      const r = await publicarLote({
        producto_id: Number(productoId),
        organizacion_id: donante.organizacionId,
        sede_id: Number(sedeId),
        cantidad_kg: Number(kg),
        fecha_produccion: produccion,
        fecha_vencimiento: vencimiento,
      })
      toast.exito(`Lote #${r.lote_id} publicado`)
      onListo()
    } catch (error) {
      toast.fallo(error instanceof ApiError ? error.message : 'No se pudo publicar el lote')
      setEnviando(false)
    }
  }

  return (
    <Drawer titulo="Publicar lote" subtitulo="Registra un excedente para que las ONG puedan solicitarlo" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="form-grid">
        <Campo etiqueta="Categoría">
          {(id) => (
            <select id={id} className="select" value={categoria} onChange={(e) => { setCategoria(e.target.value); setProductoId('') }}>
              <option value="">Todas</option>
              {CATEGORIAS_PRODUCTO.map((c) => <option key={c} value={c}>{etiqueta(c)}</option>)}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Producto">
          {(id) => (
            <select id={id} className="select" required value={productoId} onChange={(e) => elegirProducto(e.target.value)} disabled={productos.cargando}>
              <option value="">{productos.cargando ? 'Cargando…' : 'Selecciona…'}</option>
              {disponibles.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.nombre}</option>)}
            </select>
          )}
        </Campo>
        <div className="full">
          <OrgPicker etiqueta="Donante" tipo="DONANTE" valor={donante} onElegir={(o) => { setDonante(o); setSedeId('') }} />
        </div>
        <Campo etiqueta="Sede de recojo" className="full">
          {(id) => (
            <select id={id} className="select" required value={sedeId} onChange={(e) => setSedeId(e.target.value)} disabled={!donante}>
              <option value="">{donante ? (sedes.cargando ? 'Cargando…' : 'Selecciona…') : 'Primero elige el donante'}</option>
              {(sedes.data ?? []).map((s) => <option key={s.sedeId} value={s.sedeId}>{s.nombre} — {s.distrito}</option>)}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Cantidad (kg)">
          {(id) => <input id={id} className="input" type="number" required min="0.1" step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} />}
        </Campo>
        <span />
        <Campo etiqueta="Fecha de producción">
          {(id) => <input id={id} className="input" type="date" required max={hoy} value={produccion} onChange={(e) => setProduccion(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Fecha de vencimiento" ayuda="Se sugiere según la vida útil del producto">
          {(id) => <input id={id} className="input" type="date" required min={produccion} value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />}
        </Campo>
        <div className="full actions">
          <button className="btn" disabled={enviando}>{enviando ? 'Publicando…' : 'Publicar lote'}</button>
          <button type="button" className="btn ghost" onClick={onCerrar}>Cancelar</button>
        </div>
      </form>
    </Drawer>
  )
}
