import { api, query } from './client'
import type { NuevaOrganizacion, NuevaSede, Organizacion, Sede } from '../types'

export interface FiltroOrganizaciones {
  tipo?: string
  activo?: string
  q?: string
  page?: number
  limit?: number
}

export async function listarOrganizaciones(filtro: FiltroOrganizaciones = {}) {
  const { data, total } = await api.getPage<Organizacion>(
    `/organizations${query({ limit: 20, ...filtro })}`,
  )
  return { items: data, total }
}

export const obtenerOrganizacion = (id: number) => api.get<Organizacion>(`/organizations/${id}`)
export const crearOrganizacion = (datos: NuevaOrganizacion) => api.post<Organizacion>('/organizations', datos)
export const listarSedes = (id: number) => api.get<Sede[]>(`/organizations/${id}/sites`)
export const crearSede = (id: number, datos: NuevaSede) => api.post<Sede>(`/organizations/${id}/sites`, datos)
export const consultarSalud = () => api.get<{ status: string }>('/health')
