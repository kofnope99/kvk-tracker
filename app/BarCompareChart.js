"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from "recharts";

// data: [{ name: 'T4 Kills', A: 123, B: 456 }, ...]
// Horizontal grouped bars -- reads more clearly than a radar chart when
// there are only 3-4 categories to compare.
export default function BarCompareChart({ data, labelA, labelB }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-steelDim font-data">No data to compare yet.</p>;
  }
  return (
    <div className="bg-panel2 rounded-sm border border-hairline p-3" style={{ height: Math.max(220, data.length * 70) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#454B52" horizontal={false} />
          <XAxis type="number" stroke="#9A9488" fontSize={11} fontFamily="var(--font-data)" />
          <YAxis type="category" dataKey="name" stroke="#9A9488" fontSize={12} fontFamily="var(--font-data)" width={90} />
          <Tooltip contentStyle={{ background: "#16191C", border: "1px solid #454B52", fontFamily: "var(--font-data)" }} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-data)" }} />
          <Bar dataKey="A" name={labelA} fill="#B8862E" radius={[0, 4, 4, 0]} barSize={16}>
            <LabelList dataKey="A" position="right" fill="#E8DCC0" fontSize={11} formatter={(v) => v.toLocaleString()} />
          </Bar>
          <Bar dataKey="B" name={labelB} fill="#8C2F2A" radius={[0, 4, 4, 0]} barSize={16}>
            <LabelList dataKey="B" position="right" fill="#E8DCC0" fontSize={11} formatter={(v) => v.toLocaleString()} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
