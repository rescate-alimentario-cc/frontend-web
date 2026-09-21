import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Cargando, Vacio } from './components/ui'

// Cada pantalla se descarga al visitarla; así recharts solo llega con el Panel y la Analítica.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Catalogo = lazy(() => import('./pages/Catalogo'))
const Organizaciones = lazy(() => import('./pages/Organizaciones'))
const Solicitudes = lazy(() => import('./pages/Solicitudes'))
const Trazabilidad = lazy(() => import('./pages/Trazabilidad'))
const Analitica = lazy(() => import('./pages/Analitica'))

export default function App() {
  return (
    <Suspense fallback={<Cargando filas={6} />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route path="organizaciones" element={<Organizaciones />} />
          <Route path="solicitudes" element={<Solicitudes />} />
          <Route path="trazabilidad" element={<Trazabilidad />} />
          <Route path="analitica" element={<Analitica />} />
          <Route path="*" element={<Vacio texto="Página no encontrada" detalle="Usa el menú para volver." />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
