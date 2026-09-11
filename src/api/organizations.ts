import { api } from './client'
import {
  normalizarOrganizacion,
  normalizarSede,
  type NuevaOrganizacion,
  type Organizacion,
  type Sede,
} from '../types'

type Crudo = Record<string, unknown>

/**
 * MS1 todavia no pagina. Si devuelve un objeto { items, total } lo respetamos,
 * y si devuelve un arreglo plano lo tomamos tal cual. Asi el dia que P2 agregue
 * paginacion no hay que reescribir nada aqui.
 */
function extraerLista(respuesta: unknown): Crudo[] {
  if (Array.isArray(respuesta)) return respuesta as Crudo[]
  if (respuesta && typeof respuesta === 'object') {
    const objeto = respuesta as Crudo
    for (const clave of ['items', 'content', 'data', 'results']) {
      if (Array.isArray(objeto[clave])) return objeto[clave] as Crudo[]
    }
  }
  return []
}

export interface FiltroOrganizaciones {
  tipo?: string
  activo?: string
}

export async function listarOrganizaciones(
  filtro: FiltroOrganizaciones = {},
): Promise<Organizacion[]> {
  const parametros = new URLSearchParams()
  if (filtro.tipo) parametros.set('tipo', filtro.tipo)
  if (filtro.activo) parametros.set('activo', filtro.activo)

  const cadena = parametros.toString()
  const respuesta = await api.get<unknown>(
    `/organizations${cadena ? `?${cadena}` : ''}`,
  )
  return extraerLista(respuesta).map(normalizarOrganizacion)
}

export async function crearOrganizacion(
  datos: NuevaOrganizacion,
): Promise<Organizacion> {
  const respuesta = await api.post<Crudo>('/organizations', datos)
  return normalizarOrganizacion(respuesta)
}

export async function listarSedes(organizacionId: number): Promise<Sede[]> {
  const respuesta = await api.get<unknown>(
    `/organizations/${organizacionId}/sites`,
  )
  return extraerLista(respuesta).map(normalizarSede)
}

export async function consultarSalud(): Promise<boolean> {
  try {
    await api.get<unknown>('/health')
    return true
  } catch {
    return false
  }
}
