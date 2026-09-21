import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Aviso {
  id: number
  tipo: 'ok' | 'error'
  texto: string
}

interface Contexto {
  exito: (texto: string) => void
  fallo: (texto: string) => void
}

const ToastContext = createContext<Contexto | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const agregar = useCallback((tipo: Aviso['tipo'], texto: string) => {
    const id = Date.now() + Math.random()
    setAvisos((actuales) => [...actuales, { id, tipo, texto }])
    setTimeout(() => setAvisos((actuales) => actuales.filter((a) => a.id !== id)), tipo === 'error' ? 7000 : 4000)
  }, [])

  const valor = useMemo(
    () => ({ exito: (t: string) => agregar('ok', t), fallo: (t: string) => agregar('error', t) }),
    [agregar],
  )

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`toast ${a.tipo === 'error' ? 'error' : ''}`}>
            {a.tipo === 'ok' ? <CheckCircle2 size={18} color="var(--primary)" /> : <XCircle size={18} color="var(--danger)" />}
            <span>{a.texto}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): Contexto {
  const contexto = useContext(ToastContext)
  if (!contexto) throw new Error('useToast debe usarse dentro de ToastProvider')
  return contexto
}
