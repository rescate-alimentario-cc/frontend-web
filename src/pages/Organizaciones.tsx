import { useState, type FormEvent } from 'react'
import { MapPin, Plus, RefreshCw, Search, Store } from 'lucide-react'
import { crearOrganizacion, crearSede, listarOrganizaciones, listarSedes } from '../api/organizations'
import { ApiError } from '../api/client'
import { useAsync, useDebounce } from '../hooks/useAsync'
import { useToast } from '../hooks/toast'
import { Campo, Cargando, Drawer, Encabezado, ErrorCaja, Estado, Paginacion, Vacio } from '../components/ui'
import { etiqueta, fmtFecha, fmtNum } from '../lib/format'
import { CATEGORIAS_DONANTE, CATEGORIAS_ONG, type Organizacion, type TipoOrganizacion } from '../types'

const LIMITE = 15

export default function Organizaciones() {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('')
  const [activo, setActivo] = useState('')
  const [pagina, setPagina] = useState(0)
  const [creando, setCreando] = useState(false)
  const [verSedes, setVerSedes] = useState<Organizacion | null>(null)
  const q = useDebounce(texto.trim())

  const orgs = useAsync(() => listarOrganizaciones({ q, tipo, activo, page: pagina, limit: LIMITE }), [q, tipo, activo, pagina])
  const cambiar = (fn: () => void) => {
    fn()
    setPagina(0)
  }

  return (
    <>
      <Encabezado titulo="Organizaciones" descripcion="Padrón de donantes y ONG receptoras. Busca por nombre o RUC, revisa sus sedes o registra una organización nueva.">
        <button className="btn" onClick={() => setCreando(true)}>
          <Plus size={17} /> Registrar organización
        </button>
      </Encabezado>

      <div className="toolbar">
        <Campo etiqueta="Buscar" className="grow">
          {(id) => (
            <div className="search">
              <Search size={16} aria-hidden="true" />
              <input id={id} className="input" placeholder="Nombre o RUC" value={texto} onChange={(e) => cambiar(() => setTexto(e.target.value))} />
            </div>
          )}
        </Campo>
        <Campo etiqueta="Tipo">
          {(id) => (
            <select id={id} className="select" value={tipo} onChange={(e) => cambiar(() => setTipo(e.target.value))}>
              <option value="">Todos</option>
              <option value="DONANTE">Donantes</option>
              <option value="ONG">ONG</option>
            </select>
          )}
        </Campo>
        <Campo etiqueta="Estado">
          {(id) => (
            <select id={id} className="select" value={activo} onChange={(e) => cambiar(() => setActivo(e.target.value))}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          )}
        </Campo>
        <button className="btn ghost" onClick={orgs.recargar} aria-label="Actualizar">
          <RefreshCw size={16} />
        </button>
      </div>

      <section className="card card-pad">
        {orgs.error ? (
          <ErrorCaja error={orgs.error} reintentar={orgs.recargar} />
        ) : orgs.cargando && !orgs.data ? (
          <Cargando filas={8} />
        ) : !orgs.data?.items.length ? (
          <Vacio texto="Sin resultados" detalle="Ajusta la búsqueda o los filtros." />
        ) : (
          <>
            <div className="table-wrap" style={{ opacity: orgs.cargando ? 0.6 : 1 }}>
              <table>
                <thead>
                  <tr>
                    <th>Organización</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th>RUC</th>
                    <th>Contacto</th>
                    <th>Registro</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {orgs.data.items.map((o) => (
                    <tr key={o.organizacionId}>
                      <td>
                        <div className="cell-main">{o.nombre}</div>
                        <div className="cell-sub">#{o.organizacionId}{!o.activo && ' · inactiva'}</div>
                      </td>
                      <td><Estado valor={o.tipo} /></td>
                      <td>{etiqueta(o.categoria)}</td>
                      <td className="mono">{o.ruc}</td>
                      <td>
                        <div>{o.email ?? '—'}</div>
                        <div className="cell-sub">{o.telefono ?? ''}</div>
                      </td>
                      <td className="muted">{fmtFecha(o.fechaRegistro)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn ghost sm" onClick={() => setVerSedes(o)}>
                          <MapPin size={14} /> Sedes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion pagina={pagina} limite={LIMITE} total={orgs.data.total} cantidad={orgs.data.items.length} onCambiar={setPagina} />
          </>
        )}
      </section>

      {creando && <FormularioOrganizacion onCerrar={() => setCreando(false)} onListo={() => { setCreando(false); orgs.recargar() }} />}
      {verSedes && <PanelSedes org={verSedes} onCerrar={() => setVerSedes(null)} />}
    </>
  )
}

function FormularioOrganizacion({ onCerrar, onListo }: { onCerrar: () => void; onListo: () => void }) {
  const [tipo, setTipo] = useState<TipoOrganizacion>('DONANTE')
  const [nombre, setNombre] = useState('')
  const [ruc, setRuc] = useState('')
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_DONANTE[0])
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [enviando, setEnviando] = useState(false)
  const toast = useToast()
  const categorias = tipo === 'DONANTE' ? CATEGORIAS_DONANTE : CATEGORIAS_ONG

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      const o = await crearOrganizacion({ nombre: nombre.trim(), tipo, ruc, categoria, email: email || undefined, telefono: telefono || undefined })
      toast.exito(`${o.nombre} registrada (#${o.organizacionId})`)
      onListo()
    } catch (error) {
      toast.fallo(error instanceof ApiError ? (error.status === 409 ? 'Ya existe una organización con ese RUC' : error.message) : 'No se pudo registrar')
      setEnviando(false)
    }
  }

  return (
    <Drawer titulo="Registrar organización" subtitulo="Un donante publica excedentes; una ONG los solicita" onCerrar={onCerrar}>
      <form onSubmit={enviar} className="form-grid">
        <Campo etiqueta="Tipo">
          {(id) => (
            <select id={id} className="select" value={tipo} onChange={(e) => { const t = e.target.value as TipoOrganizacion; setTipo(t); setCategoria((t === 'DONANTE' ? CATEGORIAS_DONANTE : CATEGORIAS_ONG)[0]) }}>
              <option value="DONANTE">Donante</option>
              <option value="ONG">ONG receptora</option>
            </select>
          )}
        </Campo>
        <Campo etiqueta="Categoría">
          {(id) => (
            <select id={id} className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {categorias.map((c) => <option key={c} value={c}>{etiqueta(c)}</option>)}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Nombre" className="full">
          {(id) => <input id={id} className="input" required maxLength={150} value={nombre} onChange={(e) => setNombre(e.target.value)} />}
        </Campo>
        <Campo etiqueta="RUC" ayuda="11 dígitos">
          {(id) => <input id={id} className="input mono" required inputMode="numeric" pattern="\d{11}" maxLength={11} value={ruc} onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))} />}
        </Campo>
        <Campo etiqueta="Teléfono">
          {(id) => <input id={id} className="input" maxLength={20} value={telefono} onChange={(e) => setTelefono(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Correo electrónico" className="full">
          {(id) => <input id={id} className="input" type="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Campo>
        <div className="full actions">
          <button className="btn" disabled={enviando}>{enviando ? 'Guardando…' : 'Registrar'}</button>
          <button type="button" className="btn ghost" onClick={onCerrar}>Cancelar</button>
        </div>
      </form>
    </Drawer>
  )
}

function PanelSedes({ org, onCerrar }: { org: Organizacion; onCerrar: () => void }) {
  const sedes = useAsync(() => listarSedes(org.organizacionId), [org.organizacionId])
  const [agregando, setAgregando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [distrito, setDistrito] = useState('')
  const [direccion, setDireccion] = useState('')
  const [horario, setHorario] = useState('')
  const [capacidad, setCapacidad] = useState('')
  const [enviando, setEnviando] = useState(false)
  const toast = useToast()

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      await crearSede(org.organizacionId, {
        nombre: nombre.trim(),
        distrito: distrito.trim(),
        direccion: direccion || undefined,
        horarioAtencion: horario || undefined,
        capacidadKg: capacidad ? Number(capacidad) : undefined,
        esPrincipal: false,
      })
      toast.exito('Sede agregada')
      setAgregando(false)
      setNombre(''); setDistrito(''); setDireccion(''); setHorario(''); setCapacidad('')
      sedes.recargar()
    } catch (error) {
      toast.fallo(error instanceof ApiError ? error.message : 'No se pudo agregar la sede')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Drawer titulo={org.nombre} subtitulo={`${etiqueta(org.tipo)} · ${etiqueta(org.categoria)} · RUC ${org.ruc}`} onCerrar={onCerrar}>
      <div className="card-head">
        <h2><Store size={16} style={{ verticalAlign: '-3px' }} /> Sedes {sedes.data && <span className="muted">({fmtNum(sedes.data.length)})</span>}</h2>
        {!agregando && <button className="btn ghost sm" onClick={() => setAgregando(true)}><Plus size={14} /> Agregar sede</button>}
      </div>

      {agregando && (
        <form onSubmit={enviar} className="form-grid card card-pad" style={{ marginBottom: 16 }}>
          <Campo etiqueta="Nombre de la sede" className="full">{(id) => <input id={id} className="input" required maxLength={150} value={nombre} onChange={(e) => setNombre(e.target.value)} />}</Campo>
          <Campo etiqueta="Distrito">{(id) => <input id={id} className="input" required maxLength={60} value={distrito} onChange={(e) => setDistrito(e.target.value)} />}</Campo>
          <Campo etiqueta="Horario">{(id) => <input id={id} className="input" maxLength={60} placeholder="08:00-18:00" value={horario} onChange={(e) => setHorario(e.target.value)} />}</Campo>
          <Campo etiqueta="Dirección" className="full">{(id) => <input id={id} className="input" maxLength={200} value={direccion} onChange={(e) => setDireccion(e.target.value)} />}</Campo>
          <Campo etiqueta="Capacidad (kg)">{(id) => <input id={id} className="input" type="number" min="0" step="0.1" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} />}</Campo>
          <div className="full actions">
            <button className="btn" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar sede'}</button>
            <button type="button" className="btn ghost" onClick={() => setAgregando(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {sedes.error ? (
        <ErrorCaja error={sedes.error} reintentar={sedes.recargar} />
      ) : sedes.cargando ? (
        <Cargando filas={3} />
      ) : !sedes.data?.length ? (
        <Vacio texto="Esta organización no tiene sedes registradas" />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {sedes.data.map((s) => (
            <article key={s.sedeId} className="card card-pad" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{s.nombre}</strong>
                {s.esPrincipal && <span className="badge ok">Principal</span>}
              </div>
              <dl className="dl" style={{ marginTop: 8 }}>
                <dt>Distrito</dt><dd>{s.distrito}</dd>
                <dt>Dirección</dt><dd>{s.direccion ?? '—'}</dd>
                <dt>Horario</dt><dd>{s.horarioAtencion ?? '—'}</dd>
                <dt>Capacidad</dt><dd>{s.capacidadKg ? `${fmtNum(s.capacidadKg)} kg` : '—'}</dd>
              </dl>
            </article>
          ))}
        </div>
      )}
    </Drawer>
  )
}
