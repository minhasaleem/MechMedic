import { ResponsiveContainer, LineChart, Line } from "recharts";
import { readingState } from "../data/config";
import { Badge, Icon, timeLabel } from "./ui";
export function SensorCard({
  measurement,
  latest,
  history,
  demo,
  stale,
  threshold,
}) {
  const value = latest?.[measurement.key],
    previous = history.at(-2)?.[measurement.key];
  const state = stale
    ? { label: "Stale data", tone: "amber" }
    : readingState(value, threshold);
  const delta =
    Number.isFinite(value) && Number.isFinite(previous)
      ? value - previous
      : null;
  return (
    <section
      className="sensor-card"
      style={{ "--sensor-color": measurement.color }}
    >
      <div className="sensor-heading">
        <span className="sensor-icon">
          <Icon name={measurement.icon} />
        </span>
        <span>{measurement.name}</span>
      </div>
      <div className="sensor-value">
        <div>
          <strong>
            {value == null
              ? "—"
              : value.toFixed(measurement.id === "temperature" ? 1 : 3)}
          </strong>
          <span>{measurement.unit}</span>
        </div>
      </div>
      <div className="measurement-meta">
        <Badge tone={state.tone}>{state.label}</Badge>
        <span>
          {delta == null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(3)}`}{" "}
          {measurement.unit}
        </span>
      </div>
      <div className="sparkline" aria-hidden="true">
        <ResponsiveContainer width="100%" height={40}>
          <LineChart data={history.slice(-45)}>
            <Line
              dataKey={measurement.key}
              stroke={measurement.color}
              strokeWidth={1.6}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="sensor-footer">
        <span>{timeLabel(latest?.timestamp)}</span>
        <span>{demo ? "DEMO" : measurement.model}</span>
      </div>
    </section>
  );
}
