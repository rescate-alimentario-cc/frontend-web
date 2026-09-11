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

/**
 * Las EC2 del Learner Lab pueden estar apagadas. Sin timeout, una petición a un
 * backend caído deja la pantalla girando para siempre. 8 segundos es suficiente
 * para el arranque frío de Spring Boot detrás del ALB.
 */
const TIMEOUT_MS = 8000

async function request<T>(ruta: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(
      'Falta configurar VITE_API_BASE_URL',
      0,
      'Crea un archivo .env.local en la raíz del proyecto con la URL del API Gateway.',
    )
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
      throw new ApiError(
        mensajePorEstado(respuesta.status),
        respuesta.status,
        texto.slice(0, 300),
      )
    }

    return texto ? (JSON.parse(texto) as T) : ({} as T)
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(
        'El servidor no respondió a tiempo',
        0,
        'Revisa que el laboratorio de AWS esté encendido y las instancias en ejecución.',
      )
    }
    throw new ApiError(
      'No se pudo conectar con el API Gateway',
      0,
      'Puede ser el laboratorio apagado o un bloqueo de CORS. Abre la consola del navegador para ver el detalle.',
    )
  } finally {
    clearTimeout(temporizador)
  }
}

function mensajePorEstado(status: number): string {
  if (status === 400) return 'Los datos enviados no son válidos'
  if (status === 404) return 'No se encontró el recurso'
  if (status === 409) return 'Ya existe una organización con ese RUC'
  if (status === 502 || status === 503) return 'El microservicio no está respondiendo'
  if (status === 504) return 'El microservicio tardó demasiado'
  return `Error ${status} del servidor`
}

export const api = {
  get: <T>(ruta: string) => request<T>(ruta),
  post: <T>(ruta: string, cuerpo: unknown) =>
    request<T>(ruta, { method: 'POST', body: JSON.stringify(cuerpo) }),
}

export const apiBaseUrl = BASE_URL
