import { api, query } from './client'
import type { Lote, NuevoLote, Producto } from '../types'

export interface FiltroLotes {
  estado?: string
  categoria?: string
  organizacion_id?: number | string
  vence_antes?: string
  page?: number
  limit?: number
}

export async function listarLotes(filtro: FiltroLotes = {}) {
  const { data, total } = await api.getPage<Lote>(`/inventory/lots${query({ limit: 20, ...filtro })}`)
  return { items: data, total }
}

export const obtenerLote = (id: number) => api.get<Lote>(`/inventory/lots/${id}`)
export const listarProductos = () => api.get<Producto[]>('/inventory/products')
export const publicarLote = (lote: NuevoLote) => api.post<{ lote_id: number }>('/inventory/lots', lote)
export const reservarLote = (id: number, cantidadKg?: number) =>
  api.patch<{ message: string; estado: string }>(`/inventory/lots/${id}/reserve`, cantidadKg ? { cantidad_kg: cantidadKg } : {})
