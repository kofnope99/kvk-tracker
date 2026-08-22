"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// data: [{ label, points, t4_kills, t5_kills, deaths }, ...] one entry
// per snapshot uploaded so far in this KvK, in chronological order.
export default function StatsCharts({ data }) {
  if (!data || data.length < 2) {
    return (
      <p className="text-sm text-steelDim font-data">
        Charts show up once there are at least two snapshots to compare.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-data text-[10px] tracking-widest text-brass uppercase mb-2">Points over time</p>
        <div className="h-56 bg-panel2 rounded-sm border border-hairline p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333F4C" />
              <XAxis dataKey="label" stroke="#93A0AD" fontSize={11} fontFamily="var(--font-data)" />
              <YAxis stroke="#93A0AD" fontSize={11} fontFamily="var(--font-data)" />
              <Tooltip contentStyle={{ background: "#10141A", border: "1px solid #333F4C", fontFamily: "var(--font-data)" }} />
              <Line type="monotone" dataKey="points" stroke="#C79A46" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="font-data text-[10px] tracking-widest text-brass uppercase mb-2">Kills &amp; deaths over time</p>
        <div className="h-56 bg-panel2 rounded-sm border border-hairline p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333F4C" />
              <XAxis dataKey="label" stroke="#93A0AD" fontSize={11} fontFamily="var(--font-data)" />
              <YAxis stroke="#93A0AD" fontSize={11} fontFamily="var(--font-data)" />
              <Tooltip contentStyle={{ background: "#10141A", border: "1px solid #333F4C", fontFamily: "var(--font-data)" }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-data)" }} />
              <Line type="monotone" dataKey="t4_kills" name="T4 Kills" stroke="#7C9B5E" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="t5_kills" name="T5 Kills" stroke="#DFB767" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="deaths" name="Deaths" stroke="#C1473C" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
