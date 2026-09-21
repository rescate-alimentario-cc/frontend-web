import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Download, RefreshCw } from 'lucide-react'
import { impactoPorDistrito, riesgoVencimiento, tiemposLogisticos, topDonantes } from '../api/analytics'
import { useAsync } from '../hooks/useAsync'
import { ANIMAR, COLORES, TarjetaGrafico, TooltipTema, ejeTexto } from '../components/charts'
import { Cargando, Encabezado, ErrorCaja, Vacio } from '../components/ui'
import { descargarCsv, etiqueta, fmtCompacto, fmtDec, fmtNum } from '../lib/format'

export default function Analitica() {
  const distritos = useAsync(impactoPorDistrito, [])
  const riesgo = useAsync(riesgoVencimiento, [])
  const tiempos = useAsync(tiemposLogisticos, [])
  const donantes = useAsync(topDonantes, [])

  const recargar = () => [distritos, riesgo, tiempos, donantes].forEach((x) => x.recargar())
  const csv = (nombre: string, datos: object[] | null) => (
    <button className="btn ghost sm" disabled={!datos?.length} onClick={() => descargarCsv(nombre, (datos ?? []) as Record<string, unknown>[])}>
      <Download size={14} /> CSV
    </button>
  )

  const riesgoDatos = (riesgo.data ?? []).map((r) => ({ ...r, categoria: etiqueta(r.categoria), otros: r.total_lotes - r.lotes_vencidos - r.lotes_por_vencer_5d }))
  const tiemposDatos = (tiempos.data ?? []).map((t) => ({ ...t, categoria: etiqueta(t.categoria) }))

  return (
    <>
      <Encabezado titulo="Analítica de impacto" descripcion="Consultas SQL multi-tabla ejecutadas en Amazon Athena sobre el Data Lake (S3 + Glue). Los resultados se guardan 5 minutos para no repetir consultas.">
        <button className="btn ghost" onClick={recargar}><RefreshCw size={16} /> Actualizar</button>
      </Encabezado>

      <div className="grid" style={{ gap: 18 }}>
        <TarjetaGrafico titulo="Impacto por distrito" descripcion="Kilos rescatados según el distrito de la ONG receptora (vista vw_impacto_distrito)" acciones={csv('impacto-por-distrito', distritos.data)}>
          {distritos.error ? <ErrorCaja error={distritos.error} reintentar={distritos.recargar} /> : distritos.cargando ? <Cargando /> : (
            <div className="chart-box" style={{ height: 340 }} role="img" aria-label="Kilos rescatados por distrito">
              <ResponsiveContainer>
                <BarChart data={distritos.data ?? []} margin={{ bottom: 40 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="distrito" tick={ejeTexto} interval={0} angle={-40} textAnchor="end" height={70} axisLine={false} tickLine={false} />
                  <YAxis tick={ejeTexto} tickFormatter={fmtCompacto} axisLine={false} tickLine={false} width={52} />
                  <TooltipTema sufijo=" kg" />
                  <Bar isAnimationActive={ANIMAR} dataKey="kg_rescatados" name="Kg rescatados" fill="var(--c1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </TarjetaGrafico>

        <div className="grid cols-2">
          <TarjetaGrafico titulo="Riesgo de merma por categoría" descripcion="Lotes disponibles: vencidos, por vencer en 5 días y resto (vista vw_riesgo_merma)" acciones={csv('riesgo-merma', riesgo.data)}>
            {riesgo.error ? <ErrorCaja error={riesgo.error} reintentar={riesgo.recargar} /> : riesgo.cargando ? <Cargando /> : (
              <div className="chart-box" role="img" aria-label="Lotes por categoría según riesgo de vencimiento">
                <ResponsiveContainer>
                  <BarChart data={riesgoDatos} layout="vertical" margin={{ left: 8, right: 12 }}>
                    <CartesianGrid horizontal={false} stroke="var(--line)" />
                    <XAxis type="number" tick={ejeTexto} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="categoria" width={110} tick={ejeTexto} axisLine={false} tickLine={false} />
                    <TooltipTema sufijo=" lotes" />
                    <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
                    <Bar isAnimationActive={ANIMAR} dataKey="lotes_vencidos" name="Vencidos" stackId="a" fill="var(--c4)" />
                    <Bar isAnimationActive={ANIMAR} dataKey="lotes_por_vencer_5d" name="Vencen en 5 días" stackId="a" fill="var(--c2)" />
                    <Bar isAnimationActive={ANIMAR} dataKey="otros" name="Con más de 5 días" stackId="a" fill="var(--c1)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TarjetaGrafico>

          <TarjetaGrafico titulo="Tiempo de atención" descripcion="Horas promedio entre la solicitud y la entrega, por categoría" acciones={csv('tiempos-logisticos', tiempos.data)}>
            {tiempos.error ? <ErrorCaja error={tiempos.error} reintentar={tiempos.recargar} /> : tiempos.cargando ? <Cargando /> : (
              <div className="chart-box" role="img" aria-label="Horas promedio de atención por categoría">
                <ResponsiveContainer>
                  <BarChart data={tiemposDatos} layout="vertical" margin={{ left: 8, right: 12 }}>
                    <CartesianGrid horizontal={false} stroke="var(--line)" />
                    <XAxis type="number" tick={ejeTexto} axisLine={false} tickLine={false} unit=" h" />
                    <YAxis type="category" dataKey="categoria" width={110} tick={ejeTexto} axisLine={false} tickLine={false} />
                    <TooltipTema formato={fmtDec} sufijo=" h" />
                    <Bar isAnimationActive={ANIMAR} dataKey="horas_promedio_atencion" name="Horas promedio" radius={[0, 6, 6, 0]} maxBarSize={24}>
                      {tiemposDatos.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TarjetaGrafico>
        </div>

        <TarjetaGrafico titulo="Ranking de donantes" descripcion="Los 10 donantes con más volumen reservado o entregado" acciones={csv('top-donantes', donantes.data)}>
          {donantes.error ? <ErrorCaja error={donantes.error} reintentar={donantes.recargar} /> : donantes.cargando ? <Cargando /> : !donantes.data?.length ? <Vacio texto="Sin datos" /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Donante</th><th>Tipo</th><th className="num">Kg donados</th></tr>
                </thead>
                <tbody>
                  {donantes.data.map((d, i) => (
                    <tr key={d.donante}>
                      <td className="muted mono">{i + 1}</td>
                      <td className="cell-main">{d.donante}</td>
                      <td>{etiqueta(d.tipo_donante)}</td>
                      <td className="num">{fmtNum(d.total_kg_donados)} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TarjetaGrafico>
      </div>
    </>
  )
}
