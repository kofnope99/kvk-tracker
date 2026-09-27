"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

// data: [{ label: "Snapshot 1", t4_kills, t5_kills, deaths }, ...]
export default function StatsCharts({ data }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ left: 8, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3A3F45" />
        <XAxis dataKey="label" stroke="#A9AFB6" tick={{ fill: "#A9AFB6", fontFamily: "var(--font-mono)", fontSize: 12 }} />
        <YAxis stroke="#A9AFB6" tick={{ fill: "#A9AFB6", fontFamily: "var(--font-mono)", fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: "#20252A", border: "1px solid #3A3F45", borderRadius: 8 }}
          labelStyle={{ color: "#EDE3CE" }}
        />
        <Legend wrapperStyle={{ fontFamily: "var(--font-garamond)" }} />
        <Line type="monotone" dataKey="t4_kills" name="T4 Kills" stroke="#C9A24B" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="t5_kills" name="T5 Kills" stroke="#E6C36B" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="deaths" name="Deaths" stroke="#C24E4E" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
