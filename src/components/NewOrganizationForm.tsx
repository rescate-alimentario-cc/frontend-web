import { useState } from 'react'
import { crearOrganizacion } from '../api/organizations'
import { ApiError } from '../api/client'
import {
  CATEGORIAS_DONANTE,
  CATEGORIAS_ONG,
  type NuevaOrganizacion,
  type Organizacion,
  type TipoOrganizacion,
} from '../types'

const VACIO: NuevaOrganizacion = {
  nombre: '',
  tipo: 'DONANTE',
  ruc: '',
  categoria: 'SUPERMERCADO',
  email: '',
  telefono: '',
}

interface Props {
  onCreada: (organizacion: Organizacion) => void
  onCancelar: () => void
}

export function NewOrganizationForm({ onCreada, onCancelar }: Props) {
  const [datos, setDatos] = useState<NuevaOrganizacion>(VACIO)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const categorias =
    datos.tipo === 'ONG' ? CATEGORIAS_ONG : CATEGORIAS_DONANTE

  function actualizar<K extends keyof NuevaOrganizacion>(
    clave: K,
    valor: NuevaOrganizacion[K],
  ) {
    setDatos((previo) => ({ ...previo, [clave]: valor }))
  }

  function cambiarTipo(tipo: TipoOrganizacion) {
    const lista = tipo === 'ONG' ? CATEGORIAS_ONG : CATEGORIAS_DONANTE
    setDatos((previo) => ({ ...previo, tipo, categoria: lista[0] }))
  }

  async function guardar() {
    setEnviando(true)
    setError(null)
    try {
      const creada = await crearOrganizacion(datos)
      setDatos(VACIO)
      onCreada(creada)
    } catch (excepcion) {
      setError(
        excepcion instanceof ApiError
          ? excepcion
          : new ApiError('Error inesperado', 0),
      )
    } finally {
      setEnviando(false)
    }
  }

  const rucValido = /^\d{11}$/.test(datos.ruc)
  const puedeGuardar = datos.nombre.trim().length > 2 && rucValido && !enviando

  return (
    <div className="formulario">
      <h2>Registrar organización</h2>
      <p>
        Los donantes publican excedentes; las ONG los solicitan. El RUC no puede
        repetirse.
      </p>

      <div className="formulario__rejilla">
        <label className="campo">
          <span>Nombre</span>
          <input
            value={datos.nombre}
            onChange={(e) => actualizar('nombre', e.target.value)}
            placeholder="Panadería San Antonio"
          />
        </label>

        <label className="campo">
          <span>Tipo</span>
          <select
            value={datos.tipo}
            onChange={(e) => cambiarTipo(e.target.value as TipoOrganizacion)}
          >
            <option value="DONANTE">Donante</option>
            <option value="ONG">ONG</option>
          </select>
        </label>

        <label className="campo">
          <span>Categoría</span>
          <select
            value={datos.categoria}
            onChange={(e) => actualizar('categoria', e.target.value)}
          >
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria.replace(/_/g, ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>RUC (11 dígitos)</span>
          <input
            value={datos.ruc}
            inputMode="numeric"
            maxLength={11}
            onChange={(e) =>
              actualizar('ruc', e.target.value.replace(/\D/g, ''))
            }
            placeholder="20100070970"
          />
        </label>

        <label className="campo">
          <span>Correo</span>
          <input
            type="email"
            value={datos.email}
            onChange={(e) => actualizar('email', e.target.value)}
            placeholder="contacto@ejemplo.pe"
          />
        </label>

        <label className="campo">
          <span>Teléfono</span>
          <input
            value={datos.telefono}
            onChange={(e) => actualizar('telefono', e.target.value)}
            placeholder="987654321"
          />
        </label>
      </div>

      {error && (
        <div className="aviso">
          <strong>{error.message}</strong>
          {error.detalle && <p>{error.detalle}</p>}
        </div>
      )}

      <div className="formulario__acciones">
        <button className="boton" onClick={guardar} disabled={!puedeGuardar}>
          {enviando ? 'Guardando…' : 'Guardar organización'}
        </button>
        <button className="boton boton--secundario" onClick={onCancelar}>
          Cancelar
        </button>
        {!rucValido && datos.ruc.length > 0 && (
          <span className="conteo">El RUC debe tener 11 dígitos</span>
        )}
      </div>
    </div>
  )
}
