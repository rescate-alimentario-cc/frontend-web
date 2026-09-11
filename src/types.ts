export type TipoOrganizacion = 'DONANTE' | 'ONG'

export const CATEGORIAS_DONANTE = [
  'SUPERMERCADO',
  'RESTAURANTE',
  'PANADERIA',
  'MERCADO',
] as const

export const CATEGORIAS_ONG = [
  'COMEDOR_POPULAR',
  'ALBERGUE',
  'BANCO_ALIMENTOS',
] as const

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
}

export interface Sede {
  sedeId: number
  organizacionId: number
  nombre: string
  distrito: string
  direccion: string | null
  capacidadKg: number | null
  esPrincipal: boolean
}

export interface NuevaOrganizacion {
  nombre: string
  tipo: TipoOrganizacion
  ruc: string
  categoria: string
  email: string
  telefono: string
}

/**
 * MS1 es Spring Boot con JPA. Segun como mapearon las entidades, el JSON puede
 * llegar como organizacion_id o como organizacionId. En vez de apostar por una
 * forma y romper el dia de la demo, leemos las dos.
 */
function leer<T>(fuente: Record<string, unknown>, ...claves: string[]): T | null {
  for (const clave of claves) {
    const valor = fuente[clave]
    if (valor !== undefined && valor !== null) return valor as T
  }
  return null
}

export function normalizarOrganizacion(cruda: Record<string, unknown>): Organizacion {
  return {
    organizacionId: leer<number>(cruda, 'organizacion_id', 'organizacionId', 'id') ?? 0,
    nombre: leer<string>(cruda, 'nombre') ?? '(sin nombre)',
    tipo: (leer<TipoOrganizacion>(cruda, 'tipo') ?? 'DONANTE') as TipoOrganizacion,
    ruc: leer<string>(cruda, 'ruc') ?? '',
    categoria: leer<string>(cruda, 'categoria') ?? '',
    email: leer<string>(cruda, 'email'),
    telefono: leer<string>(cruda, 'telefono'),
    fechaRegistro: leer<string>(cruda, 'fecha_registro', 'fechaRegistro'),
    activo: leer<boolean>(cruda, 'activo') ?? true,
  }
}

export function normalizarSede(cruda: Record<string, unknown>): Sede {
  return {
    sedeId: leer<number>(cruda, 'sede_id', 'sedeId', 'id') ?? 0,
    organizacionId: leer<number>(cruda, 'organizacion_id', 'organizacionId') ?? 0,
    nombre: leer<string>(cruda, 'nombre') ?? '(sin nombre)',
    distrito: leer<string>(cruda, 'distrito') ?? '',
    direccion: leer<string>(cruda, 'direccion'),
    capacidadKg: leer<number>(cruda, 'capacidad_kg', 'capacidadKg'),
    esPrincipal: leer<boolean>(cruda, 'es_principal', 'esPrincipal') ?? false,
  }
}
