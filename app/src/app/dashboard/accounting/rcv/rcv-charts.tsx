"use client";

import { memo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = [
  "#2563EB", "#059669", "#D97706", "#7C3AED",
  "#0891B2", "#DC2626", "#65A30D", "#EA580C", "#DB2777", "#4B5563",
];

const truncateName = (name: string, max = 22) =>
  name.length > max ? name.slice(0, max) + "…" : name;

const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const formatCLP = (amount: number) => clpFormatter.format(amount);

// Tooltip interno para evitar dependencias circulares
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white border border-border rounded-[1rem] p-4 shadow-xl text-sm max-w-[280px] ring-1 ring-black/5">
      <p className="font-black text-foreground mb-2 uppercase text-[11px] tracking-tight truncate border-b border-border pb-2">{data?.nombre || label}</p>
      <div className="space-y-1">
        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex justify-between">Monto: <span className="text-primary">{formatCLP(data?.monto_calculado ?? 0)}</span></p>
        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex justify-between">Docs: <span className="text-foreground">{data?.count_suma ?? 0} F / {data?.count_resta ?? 0} NC</span></p>
        {data?.porcentaje !== undefined && (
          <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600 flex justify-between">Peso: <span>{data.porcentaje.toFixed(1)}%</span></p>
        )}
      </div>
    </div>
  );
}

export const AnalysisBarChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={320} minWidth={0}>
    <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 60 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis
        dataKey="nombre"
        tickFormatter={(v) => truncateName(v, 14)}
        angle={-40}
        textAnchor="end"
        height={70}
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#64748b", fontSize: 10, fontWeight: 900 }}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} 
        tick={{ fill: "#64748b", fontSize: 10, fontWeight: 900 }} 
      />
      <Tooltip content={<ChartTooltip />} cursor={{fill: '#f8fafc'}} />
      <Bar dataKey="monto_calculado" radius={[6, 6, 0, 0]} barSize={28} isAnimationActive={false}>
        {data.map((_, i) => (
          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
));
AnalysisBarChart.displayName = 'AnalysisBarChart';

export const AnalysisPieChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={320} minWidth={0}>
    <PieChart>
      <Pie
        data={data}
        cx="50%" cy="45%"
        outerRadius={100}
        innerRadius={60}
        paddingAngle={2}
        dataKey="monto_calculado"
        nameKey="nombre"
        label={({ payload }) => payload?.porcentaje > 5 ? `${payload.porcentaje.toFixed(1)}%` : ""}
        labelLine={false}
        isAnimationActive={false}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(v: any) => formatCLP(Number(v || 0))} 
         contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px' }} 
         itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }} />
      <Legend
        formatter={(value) => truncateName(String(value), 20)}
        wrapperStyle={{ fontSize: "10px", color: "#64748b", fontWeight: 900, textTransform: 'uppercase' }}
      />
    </PieChart>
  </ResponsiveContainer>
));
AnalysisPieChart.displayName = 'AnalysisPieChart';
