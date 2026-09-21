export type TipoOrganizacion = 'DONANTE' | 'ONG'

export const CATEGORIAS_DONANTE = ['SUPERMERCADO', 'RESTAURANTE', 'PANADERIA', 'MERCADO'] as const
export const CATEGORIAS_ONG = ['COMEDOR_POPULAR', 'ALBERGUE', 'BANCO_ALIMENTOS'] as const
export const CATEGORIAS_PRODUCTO = [
  'LACTEOS',
  'PANADERIA',
  'FRUTAS_VERDURAS',
  'CARNES',
  'ABARROTES',
  'CONGELADOS',
  'BEBIDAS',
] as const

/* ── MS1 · Organizaciones ── */
export interface Sede {
  sedeId: number
  nombre: string
  distrito: string
  direccion: string | null
  latitud: number | null
  longitud: number | null
  horarioAtencion: string | null
  capacidadKg: number | null
  esPrincipal: boolean
}

export interface Organizacion {
  organizacionId: number
  nombre: string
  tipo: TipoOrganizacion
  ruc: string
  categoria: string
  email: string | null
  telefono: string | null
  fechaRegistro: string | null
  activo: boolean
  sedes?: Sede[]
}

export interface NuevaOrganizacion {
  nombre: string
  tipo: TipoOrganizacion
  ruc: string
  categoria: string
  email?: string
  telefono?: string
}

export interface NuevaSede {
  nombre: string
  distrito: string
  direccion?: string
  horarioAtencion?: string
  capacidadKg?: number
  esPrincipal?: boolean
}

/* ── MS2 · Inventario ── */
export type EstadoLote = 'DISPONIBLE' | 'RESERVADO' | 'ENTREGADO' | 'VENCIDO'

export interface Producto {
  producto_id: number
  nombre: string
  categoria: string
  unidad_medida: string
  dias_vida_util: number
  factor_racion_kg: string | number
}

export interface Lote {
  lote_id: number
  producto_id: number
  organizacion_id: number
  sede_id: number
  cantidad_kg: string | number
  fecha_produccion: string
  fecha_vencimiento: string
  estado: EstadoLote
  fecha_publicacion: string
  producto_nombre: string
  producto_categoria: string
  unidad_medida: string
  factor_racion_kg: string | number
}

export interface NuevoLote {
  producto_id: number
  organizacion_id: number
  sede_id: number
  cantidad_kg: number
  fecha_produccion: string
  fecha_vencimiento: string
}

/* ── MS3 · Solicitudes ── */
export type EstadoSolicitud = 'SOLICITADA' | 'APROBADA' | 'RECHAZADA' | 'EN_RUTA' | 'ENTREGADA' | 'CANCELADA'
export const ESTADOS_SOLICITUD: EstadoSolicitud[] = ['SOLICITADA', 'APROBADA', 'RECHAZADA', 'EN_RUTA', 'ENTREGADA', 'CANCELADA']

export interface Evidencia {
  foto_url?: string
  receptor_nombre?: string
  observaciones?: string
}

export interface Solicitud {
  solicitud_id: number
  lote_id: number
  ong_id: number
  sede_donante_id?: number
  sede_destino_id?: number
  kg_solicitados: number
  kg_recogidos: number | null
  estado_actual: EstadoSolicitud
  historial_estados: { estado: string; fecha: string }[]
  evidencia?: Evidencia | null
  beneficiarios_estimados?: number
  fecha_solicitud: string
}

export interface NuevaSolicitud {
  lote_id: number
  ong_id: number
  sede_donante_id?: number
  sede_destino_id?: number
  kg_solicitados: number
  beneficiarios_estimados?: number
}

/* ── MS4 · Trazabilidad ── */
export interface OrgResumen {
  organizacionId: number
  nombre: string
  tipo: TipoOrganizacion
  categoria: string
  email: string | null
  telefono: string | null
}

export interface Trazabilidad {
  lote: Lote
  donante: OrgResumen & { sede: Sede | null }
  solicitudes: (Solicitud & { ong: OrgResumen })[]
  resumen: { total_solicitudes: number; kg_solicitados: number; kg_entregados: number; estado_lote: EstadoLote }
}

export interface Entrega {
  solicitud_id: number
  lote_id: number
  producto: string
  ong: string
  donante: string
  kg_recogidos: number | null
  fecha_solicitud: string
  fecha_entrega: string | null
  evidencia: Evidencia | null
}

export interface EntregasPagina {
  total: number
  limit: number
  page: number
  items: Entrega[]
}

/* ── MS5 · Analítica ── */
export interface ResumenImpacto {
  kg_rescatados: number
  entregas_exitosas: number
  solicitudes_totales: number
  donantes_activos: number
  ong_atendidas: number
  raciones_equivalentes: number
}
export interface ImpactoDistrito {
  distrito: string
  total_entregas: number
  kg_rescatados: number
  raciones_estimadas: number
}
export interface RiesgoMerma {
  categoria: string
  total_lotes: number
  kg_en_riesgo: number
  lotes_vencidos: number
  lotes_por_vencer_5d: number
}
export interface TiempoLogistico {
  categoria: string
  entregas: number
  horas_promedio_atencion: number
}
export interface TopDonante {
  donante: string
  tipo_donante: string
  total_kg_donados: number
}
