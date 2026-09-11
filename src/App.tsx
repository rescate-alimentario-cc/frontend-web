import { useCallback, useEffect, useState } from 'react'
import { listarOrganizaciones } from './api/organizations'
import { ApiError } from './api/client'
import { StatusBar } from './components/StatusBar'
import { OrganizationTable } from './components/OrganizationTable'
import { NewOrganizationForm } from './components/NewOrganizationForm'
import type { Organizacion } from './types'

/**
 * MS1 todavía no pagina, así que cuando P4 cargue las 20,000 organizaciones
 * este listado llegaría completo. Recortamos en el cliente para no congelar el
 * navegador durante la demo. Cuando el backend acepte ?page= y ?size= hay que
 * mover el recorte allá.
 */
const LIMITE_VISIBLE = 50

export default function App() {
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [tipo, setTipo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setOrganizaciones(await listarOrganizaciones(tipo ? { tipo } : {}))
    } catch (excepcion) {
      setError(
        excepcion instanceof ApiError
          ? excepcion
          : new ApiError('Error inesperado', 0),
      )
      setOrganizaciones([])
    } finally {
      setCargando(false)
    }
  }, [tipo])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const filtradas = organizaciones.filter((organizacion) => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return true
    return (
      organizacion.nombre.toLowerCase().includes(termino) ||
      organizacion.ruc.includes(termino)
    )
  })

  const visibles = filtradas.slice(0, LIMITE_VISIBLE)

  return (
    <>
      <StatusBar />

      <div className="envoltura">
        <header className="encabezado">
          <h1>Red de rescate alimentario</h1>
          <p>
            Padrón de donantes y organizaciones receptoras. Los donantes publican
            excedentes próximos a vencer y las ONG los reservan para su reparto.
          </p>
        </header>

        <div className="controles">
          <label className="campo">
            <span>Buscar por nombre o RUC</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Panadería, 20100…"
            />
          </label>

          <label className="campo">
            <span>Tipo</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="DONANTE">Donantes</option>
              <option value="ONG">ONG</option>
            </select>
          </label>

          <span className="controles__relleno" />

          <button
            className="boton boton--secundario"
            onClick={() => void cargar()}
            disabled={cargando}
          >
            Actualizar
          </button>

          {!formularioAbierto && (
            <button
              className="boton"
              onClick={() => {
                setFormularioAbierto(true)
                setMensaje(null)
              }}
            >
              Registrar organización
            </button>
          )}
        </div>

        {formularioAbierto && (
          <NewOrganizationForm
            onCancelar={() => setFormularioAbierto(false)}
            onCreada={(creada) => {
              setFormularioAbierto(false)
              setMensaje(`${creada.nombre} quedo registrada.`)
              void cargar()
            }}
          />
        )}

        {mensaje && (
          <div className="aviso aviso--exito">
            <strong>{mensaje}</strong>
          </div>
        )}

        {error && (
          <div className="aviso">
            <strong>{error.message}</strong>
            {error.detalle && <p>{error.detalle}</p>}
          </div>
        )}

        {cargando && <p className="cargando">Consultando el padrón…</p>}

        {!cargando && !error && filtradas.length === 0 && (
          <p className="vacio">
            No hay organizaciones que coincidan. Registra la primera para empezar.
          </p>
        )}

        {!cargando && filtradas.length > 0 && (
          <>
            <OrganizationTable organizaciones={visibles} />
            <p className="conteo">
              Mostrando {visibles.length} de {filtradas.length} organizaciones
              {filtradas.length > LIMITE_VISIBLE
                ? '. El listado completo se recorta hasta que el servicio acepte paginación.'
                : '.'}
            </p>
          </>
        )}
      </div>
    </>
  )
}
