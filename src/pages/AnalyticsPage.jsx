import { useEffect, useMemo, useState } from "react";
import { HistoryChart } from "../components/HistoryChart";
import { Badge, Icon } from "../components/ui";
import { sensors } from "../data/config";
import { createDemoAnalytics } from "../data/demo";
import { loadAnalytics } from "../services/api";
function bounds(range, start, end) {
  const now = Date.now(),
    today = new Date();
  today.setHours(0, 0, 0, 0);
  if (range === "recent") return [now - 3600000, now];
  if (range === "today") return [+today, now];
  if (range === "custom")
    return [
      new Date(`${start}T00:00:00`).getTime(),
      new Date(`${end}T23:59:59.999`).getTime(),
    ];
  return [+today - (range === "7" ? 6 : 29) * 86400000, now];
}
function frequencies(records, from, to) {
  const counts = new Map();
  records
    .filter(
      (r) => Date.parse(r.timestamp) >= from && Date.parse(r.timestamp) <= to,
    )
    .forEach((r) => {
      const date = new Date(r.timestamp);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  return [...counts]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, count]) => ({ timestamp, count }));
}
const empty = {
  history: [],
  healthHistory: [],
  classificationHistory: [],
  alerts: [],
  maintenance: [],
};
export default function AnalyticsPage({ mode, scenario, records }) {
  const [range, setRange] = useState("recent"),
    [start, setStart] = useState(
      new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    ),
    [end, setEnd] = useState(new Date().toISOString().slice(0, 10)),
    [refresh, setRefresh] = useState(0),
    [result, setResult] = useState(empty),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const [from, to] = useMemo(
    () => bounds(range, start, end),
    [range, start, end, refresh],
  );
  useEffect(() => {
    setError("");
    setResult(empty);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) {
      setError(
        "Choose a valid date range; the end must not precede the start.",
      );
      return;
    }
    if (mode === "demo") {
      setResult(createDemoAnalytics(from, to, scenario));
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    loadAnalytics(from, to, controller.signal)
      .then(setResult)
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(`Analytics unavailable: ${err.message}`);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [mode, scenario, from, to]);
  const alertCounts = frequencies(
      mode === "demo" ? records.alerts : result.alerts,
      from,
      to,
    ),
    maintenanceCounts = frequencies(
      mode === "demo" ? records.maintenance : result.maintenance,
      from,
      to,
    );
  return (
    <>
      <div className="analytics-toolbar">
        <div className="filter-pills" aria-label="Analytics time range">
          {[
            ["recent", "Recent"],
            ["today", "Today"],
            ["7", "7 days"],
            ["30", "30 days"],
            ["custom", "Custom range"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={range === key ? "selected" : ""}
              aria-pressed={range === key}
              onClick={() => setRange(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="secondary-button"
          onClick={() => setRefresh((v) => v + 1)}
        >
          <Icon name="refresh" size={15} /> Refresh
        </button>
      </div>
      {range === "custom" && (
        <div className="custom-range">
          <label>
            From
            <input
              aria-label="Analytics from date"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              aria-label="Analytics to date"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="analytics-summary">
        <Badge tone={mode === "demo" ? "amber" : ""}>
          {mode === "demo"
            ? "Synthetic historical data"
            : "Historical backend data"}
        </Badge>
        <span>
          {loading
            ? "Loading…"
            : `${result.history.length} sensor samples in this selection`}
        </span>
      </div>
      {error && (
        <p className="form-error inset" role="alert">
          {error}
        </p>
      )}
      <div className="analytics-grid">
        {sensors.map((s) => (
          <HistoryChart
            key={s.id}
            title={`${s.name} history`}
            data={result.history}
            series={s.channels}
            unit={s.unit}
          />
        ))}
        <HistoryChart
          title="Health-score history"
          data={result.healthHistory}
          series={[
            { key: "health_score", label: "Health score", color: "#49dab7" },
          ]}
          domain={[0, 100]}
          unit="%"
        />
        <div>
          <HistoryChart
            title="Fault classification history"
            data={result.classificationHistory}
            series={[
              { key: "fault_class", label: "Fault class", color: "#c397fa" },
            ]}
            domain={[0, 3]}
            step
          />
          <p className="classification-key">
            0 Normal · 1 Minor Fault · 2 Moderate Fault · 3 Severe Fault
          </p>
        </div>
        <HistoryChart
          title="Alert frequency"
          data={alertCounts}
          series={[{ key: "count", label: "Alerts per day", color: "#edb16a" }]}
          kind="bar"
          domain={[0, "auto"]}
          step
        />
        <HistoryChart
          title="Maintenance activity"
          data={maintenanceCounts}
          series={[
            { key: "count", label: "Records per day", color: "#76a7ff" },
          ]}
          kind="bar"
          domain={[0, "auto"]}
          step
        />
      </div>
    </>
  );
}
