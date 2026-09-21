import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'

export interface EstadoAsync<T> {
  data: T | null
  error: ApiError | null
  cargando: boolean
  recargar: () => void
}

/** Ejecuta `funcion` al montar y cada vez que cambian `deps`. Ignora respuestas de llamadas ya obsoletas. */
export function useAsync<T>(funcion: () => Promise<T>, deps: unknown[]): EstadoAsync<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [cargando, setCargando] = useState(true)
  const [version, setVersion] = useState(0)
  const ultima = useRef(0)

  useEffect(() => {
    const id = ++ultima.current
    setCargando(true)
    funcion()
      .then((resultado) => {
        if (id !== ultima.current) return
        setData(resultado)
        setError(null)
      })
      .catch((e: unknown) => {
        if (id !== ultima.current) return
        setError(e instanceof ApiError ? e : new ApiError('Error inesperado', 0, String(e)))
      })
      .finally(() => {
        if (id === ultima.current) setCargando(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  return { data, error, cargando, recargar }
}

/** Devuelve `valor` con retraso: evita una petición por cada tecla en los buscadores. */
export function useDebounce<T>(valor: T, ms = 350): T {
  const [retrasado, setRetrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return retrasado
}
