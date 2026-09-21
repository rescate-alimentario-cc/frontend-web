const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detalle?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Athena tarda unos segundos en frío; el resto responde en menos de uno. */
const TIMEOUT_MS = 30_000

export interface Respuesta<T> {
  data: T
  /** Total de registros según la cabecera X-Total-Count; null si el servicio no la envía. */
  total: number | null
}

function extraerMensaje(texto: string): string | undefined {
  try {
    const json = JSON.parse(texto) as Record<string, unknown>
    const valor = json.detail ?? json.error ?? json.message
    if (typeof valor === 'string') return valor
    if (Array.isArray(valor)) return valor.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join('; ')
  } catch {
    /* no era JSON */
  }
  return texto.slice(0, 200) || undefined
}

function mensajePorEstado(status: number, detalle?: string): string {
  if (detalle && status >= 400 && status < 500) return detalle
  if (status === 404) return 'No se encontró el recurso'
  if (status === 409) return 'El registro ya existe'
  if (status === 413) return 'La respuesta es demasiado grande: usa filtros o paginación'
  if (status === 502 || status === 503) return 'El microservicio no está respondiendo'
  if (status === 504) return 'El microservicio tardó demasiado'
  return `Error ${status} del servidor`
}

async function request<T>(ruta: string, init?: RequestInit): Promise<Respuesta<T>> {
  if (!BASE_URL) {
    throw new ApiError('Falta configurar VITE_API_BASE_URL', 0, 'Define la URL del API Gateway en .env.local o en Amplify.')
  }

  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)

  try {
    const respuesta = await fetch(`${BASE_URL}${ruta}`, {
      ...init,
      signal: controlador.signal,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
    const texto = await respuesta.text()

    if (!respuesta.ok) {
      const detalle = extraerMensaje(texto)
      throw new ApiError(mensajePorEstado(respuesta.status, detalle), respuesta.status, detalle)
    }

    const total = respuesta.headers.get('x-total-count')
    return { data: (texto ? JSON.parse(texto) : {}) as T, total: total === null ? null : Number(total) }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('El servidor no respondió a tiempo', 0, 'Revisa que el laboratorio de AWS esté encendido.')
    }
    throw new ApiError('No se pudo conectar con el API Gateway', 0, 'Puede ser el laboratorio apagado o un bloqueo de CORS.')
  } finally {
    clearTimeout(temporizador)
  }
}

export function query(parametros: Record<string, string | number | boolean | undefined | null>): string {
  const p = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') p.set(clave, String(valor))
  }
  const cadena = p.toString()
  return cadena ? `?${cadena}` : ''
}

export const api = {
  get: async <T>(ruta: string) => (await request<T>(ruta)).data,
  /** GET de un listado paginado: devuelve los datos y el total. */
  getPage: <T>(ruta: string) => request<T[]>(ruta),
  post: async <T>(ruta: string, cuerpo: unknown) =>
    (await request<T>(ruta, { method: 'POST', body: JSON.stringify(cuerpo) })).data,
  patch: async <T>(ruta: string, cuerpo: unknown) =>
    (await request<T>(ruta, { method: 'PATCH', body: JSON.stringify(cuerpo) })).data,
}

export const apiBaseUrl = BASE_URL
