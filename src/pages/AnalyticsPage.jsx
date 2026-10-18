import { useMemo, useState } from "react";
import { Trends } from "../components/Trends";
import { HistoryChart } from "../components/HistoryChart";
import { Panel, Badge } from "../components/ui";
import { measurements } from "../data/config";
import { histogram, correlation } from "../services/analytics";
export default function AnalyticsPage({ data }) {
  const [parameter, setParameter] = useState("vib_rms_g"),
    [range, setRange] = useState("all"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const timed = data.rows.length > 0 && data.rows.every((r) => r.timestamp);
  const filtered = useMemo(() => {
    if (range === "recent") return data.rows.slice(-100);
    if (range !== "custom") return data.rows;
    return data.rows.filter((r) => {
      const n = timed ? Date.parse(r.timestamp) : r.reading_index;
      const low = from ? (timed ? Date.parse(from) : Number(from)) : -Infinity,
        high = to ? (timed ? Date.parse(to) : Number(to)) : Infinity;
      return n >= low && n <= high;
    });
  }, [data.rows, range, from, to, timed]);
  const ids = new Set(filtered.map((r) => r.reading_index));
  const results = data.results.filter((r) => ids.has(r.reading_index));
  const m = measurements.find((v) => v.key === parameter);
  const matrix = useMemo(
    () =>
      measurements.map((a) =>
        measurements.map((b) => correlation(filtered, a.key, b.key)),
      ),
    [filtered],
  );
  const history = results.map((r) => ({
    ...r,
    timestamp: filtered.find((row) => row.reading_index === r.reading_index)
      ?.timestamp,
    anomalous: r.status === "anomaly" ? 1 : 0,
  }));
  return (
    <>
      <div className="analytics-toolbar">
        <Badge>
          {data.source} · {filtered.length} readings
        </Badge>
        <select
          aria-label="Analytics range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="all">All available readings</option>
          <option value="recent">Recent 100 readings</option>
          <option value="custom">Custom range</option>
        </select>
      </div>
      {range === "custom" && (
        <div className="custom-range">
          <label>
            From {timed ? "timestamp" : "reading index"}
            <input
              aria-label="Range from"
              type={timed ? "datetime-local" : "number"}
              min="1"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            To {timed ? "timestamp" : "reading index"}
            <input
              aria-label="Range to"
              type={timed ? "datetime-local" : "number"}
              min="1"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
      )}
      <Trends history={filtered} />
      <div className="analytics-grid spaced">
        {[
          "Vibration Analysis",
          "Temperature Monitoring",
          "Electrical Monitoring",
        ].map((group) => {
          const ms = measurements.filter(
            (p) => p.group === group && p.unit !== "",
          );
          return (
            <HistoryChart
              key={group}
              title={group}
              data={filtered}
              unit={ms[0].unit}
              series={ms.map((p) => ({
                key: p.key,
                label: p.name,
                color: p.color,
              }))}
            />
          );
        })}
        <Panel
          title="Parameter distribution"
          action={
            <select
              aria-label="Distribution parameter"
              value={parameter}
              onChange={(e) => setParameter(e.target.value)}
            >
              {measurements.map((p) => (
                <option value={p.key} key={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          }
        >
          <HistoryChart
            title={`${m.name} bins (${m.unit || "dimensionless"})`}
            data={histogram(filtered.map((r) => r[parameter]))}
            series={[{ key: "count", label: "Readings", color: m.color }]}
            kind="bar"
            xKey="bucket"
            step
          />
        </Panel>
      </div>
      <Panel title="Parameter correlation">
        <p className="settings-note">
          Pearson correlation on available numeric pairs. Missing/constant pairs
          are unavailable; correlation does not establish causation.
        </p>
        <div className="table-wrap">
          <table className="correlation-table">
            <thead>
              <tr>
                <th>Feature</th>
                {measurements.map((m) => (
                  <th key={m.key} title={m.name}>
                    {m.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {measurements.map((a, i) => (
                <tr key={a.key}>
                  <th>{a.key}</th>
                  {matrix[i].map((n, j) => (
                    <td
                      key={j}
                      style={{
                        background:
                          n == null
                            ? "transparent"
                            : `rgba(${n >= 0 ? "73,218,183" : "239,113,133"},${Math.abs(n) * 0.3})`,
                      }}
                    >
                      {n == null ? "N/A" : n.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="overview-stats spaced">
        <div>
          <span>Normal readings</span>
          <strong>
            {results.length
              ? results.filter((r) => r.status === "normal").length
              : "Not available"}
          </strong>
        </div>
        <div>
          <span>Anomalous readings</span>
          <strong>
            {results.length
              ? results.filter((r) => r.status === "anomaly").length
              : "Not available"}
          </strong>
        </div>
        <div>
          <span>Readings without model results</span>
          <strong>{filtered.length - results.length}</strong>
        </div>
      </div>
      <div className="analytics-grid">
        <HistoryChart
          title="Isolation Forest anomaly score distribution"
          data={histogram(results.map((r) => r.anomaly_score))}
          series={[{ key: "count", label: "Model results", color: "#c397fa" }]}
          kind="bar"
          xKey="bucket"
          step
        />
        <HistoryChart
          title="Anomaly score trend"
          data={history}
          series={[
            { key: "anomaly_score", label: "Anomaly score", color: "#edb16a" },
          ]}
        />
        <HistoryChart
          title="Normal / anomalous trend"
          data={history}
          series={[
            {
              key: "anomalous",
              label: "0 Normal / 1 Anomaly Detected",
              color: "#49dab7",
            },
          ]}
          domain={[0, 1]}
          step
        />
      </div>
    </>
  );
}
