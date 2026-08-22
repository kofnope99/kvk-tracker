"use client";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip, ResponsiveContainer,
} from "recharts";

// data: [{ name: 'T4 Kills', A: 123, B: 456 }, ...]
// Rendered as a compass-style radar chart: two overlapping colored
// shapes (gold vs crimson) fanning out across the stat categories.
export default function BarCompareChart({ data, labelA, labelB }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-steelDim font-data">No data to compare yet.</p>;
  }
  return (
    <div className="h-72 bg-panel2 rounded-sm border border-hairline p-3">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#4A3F33" />
          <PolarAngleAxis dataKey="name" stroke="#A79A87" fontSize={11} fontFamily="var(--font-data)" />
          <PolarRadiusAxis stroke="#4A3F33" fontSize={9} tick={{ fill: "#6B6152" }} />
          <Tooltip contentStyle={{ background: "#1A1613", border: "1px solid #4A3F33", fontFamily: "var(--font-data)" }} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-data)" }} />
          <Radar name={labelA} dataKey="A" stroke="#B8862E" fill="#B8862E" fillOpacity={0.35} strokeWidth={2} />
          <Radar name={labelB} dataKey="B" stroke="#8C2F2A" fill="#8C2F2A" fillOpacity={0.35} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
