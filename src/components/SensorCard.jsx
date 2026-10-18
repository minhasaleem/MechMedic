import { ResponsiveContainer, LineChart, Line } from "recharts";
import { Badge, Icon } from "./ui";
import { readingLabel } from "../services/dataset";
export function SensorCard({ measurement, latest, history, source, stale }) {
  const value = latest?.[measurement.key];
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
            {Number.isFinite(value)
              ? Number(value.toFixed(4))
              : "Not available"}
          </strong>
          <span>{measurement.unit || "dimensionless"}</span>
        </div>
      </div>
      <Badge tone={stale ? "amber" : ""}>
        {stale
          ? "Stale / unverified freshness"
          : measurement.derived
            ? "Derived feature"
            : "Dataset parameter"}
      </Badge>
      <div className="sparkline" aria-hidden="true">
        <ResponsiveContainer width="100%" height={40}>
          <LineChart data={history.slice(-100)}>
            <Line
              dataKey={measurement.key}
              stroke={measurement.color}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="sensor-footer">
        <span>{readingLabel(latest)}</span>
        <span>{source}</span>
      </div>
    </section>
  );
}
