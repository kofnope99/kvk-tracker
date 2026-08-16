"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// data: [{ name: 'T4 Kills', A: 123, B: 456 }, ...]
export default function BarCompareChart({ data, labelA, labelB }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500">No data to compare yet.</p>;
  }
  return (
    <div className="h-64 bg-slate-800 rounded-lg p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="A" name={labelA} fill="#818cf8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="B" name={labelB} fill="#34d399" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
