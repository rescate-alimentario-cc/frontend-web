import { useCallback, useEffect, useState } from 'react'

type Tema = 'claro' | 'oscuro'

export function useTheme() {
  const [tema, setTema] = useState<Tema>(() =>
    document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro',
  )

  useEffect(() => {
    document.documentElement.dataset.tema = tema
    try {
      localStorage.setItem('tema', tema)
    } catch {
      /* almacenamiento bloqueado: el tema solo dura la sesión */
    }
  }, [tema])

  const alternar = useCallback(() => setTema((t) => (t === 'claro' ? 'oscuro' : 'claro')), [])
  return { tema, alternar }
}
