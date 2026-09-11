import { Fragment, useState } from 'react'
import { listarSedes } from '../api/organizations'
import type { Organizacion, Sede } from '../types'

interface Props {
  organizaciones: Organizacion[]
}

export function OrganizationTable({ organizaciones }: Props) {
  const [expandida, setExpandida] = useState<number | null>(null)
  const [sedes, setSedes] = useState<Record<number, Sede[] | 'cargando' | 'error'>>(
    {},
  )

  async function alternarSedes(id: number) {
    if (expandida === id) {
      setExpandida(null)
      return
    }
    setExpandida(id)
    if (sedes[id] && sedes[id] !== 'error') return

    setSedes((previo) => ({ ...previo, [id]: 'cargando' }))
    try {
      const resultado = await listarSedes(id)
      setSedes((previo) => ({ ...previo, [id]: resultado }))
    } catch {
      setSedes((previo) => ({ ...previo, [id]: 'error' }))
    }
  }

  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Categoría</th>
          <th>RUC</th>
          <th>Contacto</th>
          <th>Sedes</th>
        </tr>
      </thead>
      <tbody>
        {organizaciones.map((organizacion) => {
          const detalle = sedes[organizacion.organizacionId]
          return (
            <Fragment key={organizacion.organizacionId}>
              <tr>
                <td className="tabla__numero">{organizacion.organizacionId}</td>
                <td className="tabla__nombre">
                  {organizacion.nombre}
                  {!organizacion.activo && (
                    <> <span className="etiqueta etiqueta--inactivo">inactiva</span></>
                  )}
                </td>
                <td>
                  <span
                    className={
                      organizacion.tipo === 'ONG'
                        ? 'etiqueta etiqueta--ong'
                        : 'etiqueta'
                    }
                  >
                    {organizacion.tipo === 'ONG' ? 'ONG' : 'Donante'}
                  </span>
                </td>
                <td>{organizacion.categoria.replace(/_/g, ' ').toLowerCase()}</td>
                <td className="tabla__numero">{organizacion.ruc}</td>
                <td>
                  {organizacion.email ?? '—'}
                  <br />
                  <span className="sedes__distrito">
                    {organizacion.telefono ?? ''}
                  </span>
                </td>
                <td>
                  <button
                    className="boton-sedes"
                    onClick={() => alternarSedes(organizacion.organizacionId)}
                  >
                    {expandida === organizacion.organizacionId
                      ? 'Ocultar'
                      : 'Ver sedes'}
                  </button>
                </td>
              </tr>

              {expandida === organizacion.organizacionId && (
                <tr className="sedes">
                  <td colSpan={7}>
                    {detalle === 'cargando' && <span>Cargando sedes…</span>}
                    {detalle === 'error' && (
                      <span>No se pudieron cargar las sedes.</span>
                    )}
                    {Array.isArray(detalle) && detalle.length === 0 && (
                      <span>Esta organización aún no tiene sedes registradas.</span>
                    )}
                    {Array.isArray(detalle) && detalle.length > 0 && (
                      <ul>
                        {detalle.map((sede) => (
                          <li key={sede.sedeId}>
                            {sede.nombre}{' '}
                            <span className="sedes__distrito">
                              {sede.distrito}
                              {sede.capacidadKg
                                ? ` · ${sede.capacidadKg} kg`
                                : ''}
                              {sede.esPrincipal ? ' · principal' : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          )
        })}
      </tbody>
    </table>
  )
}
