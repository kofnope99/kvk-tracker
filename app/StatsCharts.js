"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// data: [{ label, points, t4_kills, t5_kills, deaths }, ...] one entry
// per snapshot uploaded so far in this KvK, in chronological order.
export default function StatsCharts({ data }) {
  if (!data || data.length < 2) {
    return (
      <p className="text-sm text-slate-500">
        Charts show up once there are at least two snapshots to compare.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-400 mb-2">Points over time</p>
        <div className="h-56 bg-slate-800 rounded-lg p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="points" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-sm text-slate-400 mb-2">Kills &amp; deaths over time</p>
        <div className="h-56 bg-slate-800 rounded-lg p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="t4_kills" name="T4 Kills" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="t5_kills" name="T5 Kills" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="deaths" name="Deaths" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
