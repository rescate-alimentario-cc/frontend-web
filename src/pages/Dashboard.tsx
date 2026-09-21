import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { ArrowRight, HeartHandshake, PackageCheck, RefreshCw, Scale, Store, UtensilsCrossed } from 'lucide-react'
import { impactoPorDistrito, resumenImpacto, riesgoVencimiento } from '../api/analytics'
import { listarEntregas } from '../api/traceability'
import { useAsync } from '../hooks/useAsync'
import { COLORES, TarjetaGrafico, TooltipTema, ejeTexto } from '../components/charts'
import { Cargando, Encabezado, ErrorCaja, KpiCard, Vacio } from '../components/ui'
import { etiqueta, fmtCompacto, fmtDec, fmtFechaHora, fmtNum } from '../lib/format'

export default function Dashboard() {
  const resumen = useAsync(resumenImpacto, [])
  const distritos = useAsync(impactoPorDistrito, [])
  const riesgo = useAsync(riesgoVencimiento, [])
  const entregas = useAsync(() => listarEntregas(0, 6), [])

  const recargar = () => {
    resumen.recargar()
    distritos.recargar()
    riesgo.recargar()
    entregas.recargar()
  }
  const r = resumen.data
  const top = (distritos.data ?? []).slice(0, 8).map((d) => ({ ...d, kg: d.kg_rescatados }))
  const porVencer = (riesgo.data ?? []).filter((x) => x.lotes_por_vencer_5d > 0)
  const totalPorVencer = porVencer.reduce((s, x) => s + x.lotes_por_vencer_5d, 0)

  return (
    <>
      <Encabezado
        titulo="Panel de impacto"
        descripcion="Cada kilo rescatado es una ración que no se pierde. Indicadores calculados en tiempo real sobre el Data Lake con Amazon Athena."
      >
        <button className="btn ghost" onClick={recargar}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </Encabezado>

      {resumen.error ? (
        <div style={{ marginBottom: 18 }}>
          <ErrorCaja error={resumen.error} reintentar={resumen.recargar} />
        </div>
      ) : (
        <div className="grid kpis">
          <KpiCard icono={Scale} titulo="Kg rescatados" valor={r ? fmtCompacto(r.kg_rescatados) : ''} pie={r ? `${fmtNum(r.kg_rescatados)} kg entregados` : undefined} cargando={resumen.cargando} />
          <KpiCard icono={UtensilsCrossed} titulo="Raciones equivalentes" valor={r ? fmtCompacto(r.raciones_equivalentes) : ''} pie="a 0,4 kg por ración" tono="amber" cargando={resumen.cargando} />
          <KpiCard icono={PackageCheck} titulo="Entregas exitosas" valor={r ? fmtNum(r.entregas_exitosas) : ''} pie={r ? `de ${fmtNum(r.solicitudes_totales)} solicitudes` : undefined} tono="info" cargando={resumen.cargando} />
          <KpiCard icono={Store} titulo="Donantes activos" valor={r ? fmtNum(r.donantes_activos) : ''} pie="con lotes publicados" tono="violet" cargando={resumen.cargando} />
          <KpiCard icono={HeartHandshake} titulo="ONG atendidas" valor={r ? fmtNum(r.ong_atendidas) : ''} pie="con al menos una solicitud" cargando={resumen.cargando} />
        </div>
      )}

      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <TarjetaGrafico titulo="Kilos rescatados por distrito" descripcion="Los 8 distritos con más alimento recibido">
          {distritos.error ? (
            <ErrorCaja error={distritos.error} reintentar={distritos.recargar} />
          ) : distritos.cargando ? (
            <Cargando />
          ) : (
            <div className="chart-box" role="img" aria-label="Gráfico de barras de kilos rescatados por distrito">
              <ResponsiveContainer>
                <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="var(--line)" />
                  <XAxis type="number" tick={ejeTexto} tickFormatter={(v) => fmtCompacto(v)} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="distrito" width={130} tick={ejeTexto} axisLine={false} tickLine={false} />
                  <TooltipTema sufijo=" kg" />
                  <Bar dataKey="kg" name="Kg rescatados" fill="var(--c1)" radius={[0, 6, 6, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </TarjetaGrafico>

        <TarjetaGrafico titulo="Lotes por vencer en 5 días" descripcion="Prioridad de recojo por categoría">
          {riesgo.error ? (
            <ErrorCaja error={riesgo.error} reintentar={riesgo.recargar} />
          ) : riesgo.cargando ? (
            <Cargando />
          ) : porVencer.length === 0 ? (
            <Vacio texto="Sin lotes por vencer" detalle="Todo el inventario disponible tiene más de 5 días." />
          ) : (
            <>
              <div style={{ height: 210 }} role="img" aria-label="Gráfico circular de lotes por vencer por categoría">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={porVencer} dataKey="lotes_por_vencer_5d" nameKey="categoria" innerRadius={58} outerRadius={90} paddingAngle={2} stroke="var(--surface)" strokeWidth={2}>
                      {porVencer.map((_, i) => (
                        <Cell key={i} fill={COLORES[i % COLORES.length]} />
                      ))}
                    </Pie>
                    <TooltipTema sufijo=" lotes" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="muted" style={{ textAlign: 'center', fontSize: 13 }}>
                <strong className="display" style={{ fontSize: 22, color: 'var(--ink)' }}>{fmtNum(totalPorVencer)}</strong> lotes en total
              </p>
              <ul className="legend-list">
                {porVencer.map((x, i) => (
                  <li key={x.categoria} style={{ ['--sw' as string]: COLORES[i % COLORES.length] }}>
                    <i /> {etiqueta(x.categoria)} <b>{fmtNum(x.lotes_por_vencer_5d)}</b>
                  </li>
                ))}
              </ul>
            </>
          )}
        </TarjetaGrafico>
      </div>

      <section className="card card-pad">
        <div className="card-head">
          <div>
            <h2>Últimas entregas</h2>
            <p>Con evidencia de recojo, consolidadas por el orquestador de trazabilidad</p>
          </div>
          <Link to="/trazabilidad" className="btn ghost sm">
            Ver trazabilidad <ArrowRight size={14} />
          </Link>
        </div>
        {entregas.error ? (
          <ErrorCaja error={entregas.error} reintentar={entregas.recargar} />
        ) : entregas.cargando ? (
          <Cargando filas={4} />
        ) : !entregas.data?.items.length ? (
          <Vacio texto="Aún no hay entregas" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Donante</th>
                  <th>ONG receptora</th>
                  <th className="num">Kg</th>
                  <th>Entrega</th>
                </tr>
              </thead>
              <tbody>
                {entregas.data.items.map((e) => (
                  <tr key={e.solicitud_id}>
                    <td>
                      <div className="cell-main">{e.producto}</div>
                      <div className="cell-sub">Lote #{e.lote_id}</div>
                    </td>
                    <td>{e.donante}</td>
                    <td>{e.ong}</td>
                    <td className="num">{fmtDec(e.kg_recogidos)}</td>
                    <td className="muted">{fmtFechaHora(e.fecha_entrega)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
