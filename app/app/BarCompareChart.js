"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// data: [{ name: 'T4 Kills', A: 123, B: 456 }, ...]
export default function BarCompareChart({ data, labelA, labelB }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-steelDim font-data">No data to compare yet.</p>;
  }
  return (
    <div className="h-64 bg-panel2 rounded-sm border border-hairline p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333F4C" />
          <XAxis dataKey="name" stroke="#93A0AD" fontSize={11} fontFamily="var(--font-data)" />
          <YAxis stroke="#93A0AD" fontSize={11} fontFamily="var(--font-data)" />
          <Tooltip contentStyle={{ background: "#10141A", border: "1px solid #333F4C", fontFamily: "var(--font-data)" }} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-data)" }} />
          <Bar dataKey="A" name={labelA} fill="#C79A46" radius={[2, 2, 0, 0]} />
          <Bar dataKey="B" name={labelB} fill="#7C9B5E" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
