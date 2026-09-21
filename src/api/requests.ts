import { api, query } from './client'
import type { Evidencia, EstadoSolicitud, NuevaSolicitud, Solicitud } from '../types'

export interface FiltroSolicitudes {
  estado?: string
  ong_id?: number | string
  lote_id?: number | string
  page?: number
  limit?: number
}

export async function listarSolicitudes(filtro: FiltroSolicitudes = {}) {
  const { data, total } = await api.getPage<Solicitud>(`/requests${query({ limit: 20, ...filtro })}`)
  return { items: data, total }
}

export const obtenerSolicitud = (id: number) => api.get<Solicitud>(`/requests/${id}`)
export const crearSolicitud = (datos: NuevaSolicitud) => api.post<Solicitud>('/requests', datos)
export const cambiarEstado = (id: number, nuevo_estado: EstadoSolicitud, extra?: { kg_recogidos?: number; evidencia?: Evidencia }) =>
  api.patch<Solicitud>(`/requests/${id}/status`, { nuevo_estado, ...extra })
