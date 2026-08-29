'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

interface SalaryDonutChartProps {
  liquido: number
  previsionSalud: number
  impuesto: number
}

export function SalaryDonutChart({
  liquido,
  previsionSalud,
  impuesto,
}: SalaryDonutChartProps) {
  const total = liquido + previsionSalud + impuesto

  if (total <= 0) return null

  const data = [
    { name: 'Sueldo Líquido', value: liquido, color: '#059669', pct: Math.round((liquido / total) * 100) },
    { name: 'Previsión & Salud (AFP/Fonasa/AFC)', value: previsionSalud, color: '#0284c7', pct: Math.round((previsionSalud / total) * 100) },
    { name: 'Impuesto Único SII', value: Math.max(impuesto, 0), color: '#8b5cf6', pct: Math.round((Math.max(impuesto, 0) / total) * 100) },
  ].filter(d => d.value > 0)

  return (
    <div className="p-6 rounded-3xl bg-white border border-border/80 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
          Distribución Visual de Haberes
        </span>
        <span className="text-[9px] font-bold text-muted-foreground uppercase">
          Total Bruto: ${total.toLocaleString('es-CL')}
        </span>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`$${Number(value).toLocaleString('es-CL')}`, 'Monto']}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: '#334155',
                borderRadius: '1rem',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda con Porcentajes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <div className="truncate">
              <span className="text-muted-foreground text-[10px] block truncate">{item.name}</span>
              <span className="font-mono font-black text-foreground">{item.pct}% (${item.value.toLocaleString('es-CL')})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
