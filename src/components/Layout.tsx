import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Boxes, Building2, HandHeart, LayoutDashboard, Leaf, Moon, Route, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { consultarSalud } from '../api/organizations'
import { useTheme } from '../hooks/useTheme'
import { apiBaseUrl } from '../api/client'

const ENLACES = [
  { a: '/', texto: 'Panel', icono: LayoutDashboard, fin: true },
  { a: '/catalogo', texto: 'Catálogo', icono: Boxes },
  { a: '/organizaciones', texto: 'Organizaciones', icono: Building2 },
  { a: '/solicitudes', texto: 'Solicitudes', icono: HandHeart },
  { a: '/trazabilidad', texto: 'Trazabilidad', icono: Route },
  { a: '/analitica', texto: 'Analítica', icono: BarChart3 },
]

export default function Layout() {
  const { tema, alternar } = useTheme()
  const [enLinea, setEnLinea] = useState<boolean | null>(null)

  useEffect(() => {
    let activo = true
    const comprobar = () =>
      consultarSalud()
        .then(() => activo && setEnLinea(true))
        .catch(() => activo && setEnLinea(false))
    comprobar()
    const t = setInterval(comprobar, 60_000)
    return () => {
      activo = false
      clearInterval(t)
    }
  }, [])

  return (
    <div className="app">
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="Rescate Alimentario, inicio">
          <span className="brand-mark">
            <Leaf size={20} />
          </span>
          <span>
            <strong>Rescate</strong>
            <small>Alimentario</small>
          </span>
        </NavLink>

        <nav className="nav" aria-label="Principal">
          {ENLACES.map(({ a, texto, icono: Icono, fin }) => (
            <NavLink key={a} to={a} end={fin} className={({ isActive }) => (isActive ? 'activo' : '')}>
              <Icono size={18} aria-hidden="true" />
              <span>{texto}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="pill" title={apiBaseUrl}>
            <i className={`dot ${enLinea === null ? '' : enLinea ? 'ok' : 'bad'}`} />
            <span>{enLinea === null ? 'Conectando…' : enLinea ? 'Backend en línea' : 'Sin conexión'}</span>
          </span>
          <button className="btn ghost sm" onClick={alternar} aria-label={`Cambiar a modo ${tema === 'claro' ? 'oscuro' : 'claro'}`}>
            {tema === 'claro' ? <Moon size={15} /> : <Sun size={15} />}
            <span className="sr-only-mobile">{tema === 'claro' ? 'Oscuro' : 'Claro'}</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
