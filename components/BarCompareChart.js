"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, CartesianGrid } from "recharts";

// data: [{ metric: "Kills", A: 123, B: 456 }, ...]
export default function BarCompareChart({ data, nameA, nameB }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3A3F45" horizontal={false} />
        <XAxis type="number" stroke="#A9AFB6" tick={{ fill: "#A9AFB6", fontFamily: "var(--font-mono)" }} />
        <YAxis dataKey="metric" type="category" stroke="#A9AFB6" width={90} tick={{ fill: "#EDE3CE", fontFamily: "var(--font-garamond)" }} />
        <Tooltip
          contentStyle={{ background: "#20252A", border: "1px solid #3A3F45", borderRadius: 8 }}
          labelStyle={{ color: "#EDE3CE" }}
        />
        <Bar dataKey="A" name={nameA} fill="#C9A24B" radius={[0, 4, 4, 0]}>
          <LabelList dataKey="A" position="right" fill="#E6C36B" fontSize={12} />
        </Bar>
        <Bar dataKey="B" name={nameB} fill="#6B8F5A" radius={[0, 4, 4, 0]}>
          <LabelList dataKey="B" position="right" fill="#8FBB78" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
