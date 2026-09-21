import { api, query } from './client'
import type { EntregasPagina, Trazabilidad } from '../types'

export const trazarLote = (id: number) => api.get<Trazabilidad>(`/traceability/lots/${id}`)
export const listarEntregas = (page = 0, limit = 10) =>
  api.get<EntregasPagina>(`/traceability/deliveries${query({ page, limit })}`)
