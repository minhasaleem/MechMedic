import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { sensors } from "../data/config";
import { Panel, EmptyState } from "./ui";
export function Trends({ history, demo }) {
  const [selected, setSelected] = useState("vibration");
  const [minutes, setMinutes] = useState(15);
  const sensor = sensors.find((s) => s.id === selected);
  const end = history.length
    ? Date.parse(history.at(-1).timestamp)
    : Date.now();
  const data = history
    .filter((r) => Date.parse(r.timestamp) >= end - minutes * 60000)
    .map((r) => ({ ...r, time: Date.parse(r.timestamp) }));
  const formatTime = (t) =>
    new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <Panel
      title="Sensor trends"
      eyebrow="SIGNALS OVER TIME"
      action={
        <label className="range-label">
          <span className="sr-only">Chart time range</span>
          <select
            aria-label="Chart time range"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          >
            <option value={5}>Last 5 minutes</option>
            <option value={15}>Last 15 minutes</option>
            <option value={60}>Last 1 hour</option>
          </select>
        </label>
      }
    >
      <div className="chart-toolbar">
        <div className="tabs" role="tablist" aria-label="Sensor signal">
          {sensors.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={selected === s.id}
              onClick={() => setSelected(s.id)}
              className={selected === s.id ? "selected" : ""}
            >
              {s.id === "temperature" ? "Temperature" : s.name}
            </button>
          ))}
        </div>
        <span className="chart-unit">{sensor.unit}</span>
      </div>
      {data.length ? (
        <div
          className="trend-chart"
          role="img"
          aria-label={`${sensor.name} trend over the last ${minutes} minutes. ${demo ? "Synthetic demonstration values." : "Backend sensor history."}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 12, right: 18, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                stroke="#26313d"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatTime}
                tick={{ fill: "#82909f", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={65}
              />
              <YAxis
                width={48}
                tick={{ fill: "#82909f", fontSize: 11 }}
                tickFormatter={(v) =>
                  Number(v).toFixed(sensor.id === "temperature" ? 0 : 2)
                }
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                labelFormatter={formatTime}
                formatter={(v, name) => [
                  `${Number(v).toFixed(3)} ${sensor.unit}`,
                  name,
                ]}
                contentStyle={{
                  background: "#17222d",
                  border: "1px solid #3b4d5e",
                  borderRadius: 10,
                  color: "#edf3f8",
                }}
              />
              <Legend
                iconType="plainline"
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              />
              {sensor.channels.map((c) => (
                <Line
                  key={c.key}
                  type="monotone"
                  dataKey={c.key}
                  name={c.label}
                  stroke={c.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState icon="activity" title="No historical readings">
          Sensor history will appear when the backend provides timestamped
          readings.
        </EmptyState>
      )}
      <div className="chart-footnote">
        <span className="status-dot" />
        {demo
          ? "Synthetic data · for interface demonstration only"
          : "Timestamped sensor history · no inferred fault thresholds"}
      </div>
    </Panel>
  );
}
