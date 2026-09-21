import { api } from './client'
import type { ImpactoDistrito, ResumenImpacto, RiesgoMerma, TiempoLogistico, TopDonante } from '../types'

export const resumenImpacto = () => api.get<ResumenImpacto>('/analytics/summary')
export const impactoPorDistrito = () => api.get<ImpactoDistrito[]>('/analytics/waste-by-district')
export const riesgoVencimiento = () => api.get<RiesgoMerma[]>('/analytics/expiry-risk')
export const tiemposLogisticos = () => api.get<TiempoLogistico[]>('/analytics/logistics-times')
export const topDonantes = () => api.get<TopDonante[]>('/analytics/top-donors')
