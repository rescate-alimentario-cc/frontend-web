import { useEffect, useState } from 'react'
import { consultarSalud } from '../api/organizations'
import { apiBaseUrl } from '../api/client'

type Estado = 'consultando' | 'activo' | 'caido'

export function StatusBar() {
  const [estado, setEstado] = useState<Estado>('consultando')

  useEffect(() => {
    let vigente = true
    consultarSalud().then((ok) => {
      if (vigente) setEstado(ok ? 'activo' : 'caido')
    })
    return () => {
      vigente = false
    }
  }, [])

  const texto = {
    consultando: 'Verificando conexión',
    activo: 'Backend en línea',
    caido: 'Backend sin respuesta',
  }[estado]

  return (
    <div className="barra-estado">
      <div className="barra-estado__interior">
        <span
          className={
            estado === 'activo'
              ? 'indicador indicador--activo'
              : estado === 'caido'
                ? 'indicador indicador--caido'
                : 'indicador'
          }
        >
          {texto}
        </span>
        <span className="barra-estado__origen">
          {apiBaseUrl || 'VITE_API_BASE_URL sin configurar'}
        </span>
      </div>
    </div>
  )
}
