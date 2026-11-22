"use client";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/financial/money";
import { formatDayMonth } from "@/components/forecast/format";
import type { ForecastChartPoint } from "@/components/forecast/forecast-chart";

export function CashOutlookChart({ points }: { points: ForecastChartPoint[] }) {
  return <div role="img" aria-label="30-day projected cash balance; dashed red line marks zero" className="h-[260px] w-full min-w-0 sm:h-[290px]">
    <ResponsiveContainer width="100%" height="100%"><AreaChart data={points} margin={{ top: 15, right: 10, left: 0, bottom: 0 }}>
      <defs><linearGradient id="dashboard-cash-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d9488" stopOpacity={0.19} /><stop offset="100%" stopColor="#0d9488" stopOpacity={0.015} /></linearGradient></defs>
      <CartesianGrid vertical={false} stroke="#e8eef1" strokeDasharray="4 5" />
      <XAxis dataKey="date" tickFormatter={formatDayMonth} axisLine={false} tickLine={false} minTickGap={30} tick={{ fill: "#64748b", fontSize: 11 }} tickMargin={14} />
      <YAxis width={66} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value: number) => formatINR(value)} />
      <Tooltip labelFormatter={(date) => formatDayMonth(String(date))} formatter={(value) => [formatINR(Number(value)), "Projected cash"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
      <ReferenceLine y={0} stroke="#e87979" strokeDasharray="4 4" />
      <Area type="linear" dataKey="closingCashPaise" stroke="#0f766e" strokeWidth={2.5} fill="url(#dashboard-cash-fill)" activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }} isAnimationActive={false} />
    </AreaChart></ResponsiveContainer>
  </div>;
}
