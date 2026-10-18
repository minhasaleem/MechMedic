import { memo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Panel, EmptyState } from "./ui";
export const HistoryChart = memo(function HistoryChart({
  title,
  data,
  series,
  unit = "",
  domain = ["auto", "auto"],
  kind = "line",
  height = 240,
  step = false,
  xKey,
}) {
  const timed = !xKey && data.length > 0 && data.every((r) => r.timestamp);
  const key = xKey || "axis";
  const points = data.map((r, i) => ({
    ...r,
    axis: timed ? Date.parse(r.timestamp) : (r.reading_index ?? i + 1),
  }));
  const format = (v) => (timed ? new Date(v).toLocaleTimeString() : String(v));
  const Chart = kind === "bar" ? BarChart : LineChart;
  const usable = points.some((r) =>
    series.some((s) => Number.isFinite(r[s.key])),
  );
  return (
    <Panel title={title} className="history-panel">
      {usable ? (
        <>
          <div className="chart-axis-caption">
            {xKey ? "Distribution" : timed ? "Timestamp" : "Reading index"}
            {unit ? ` · ${unit}` : " · dimensionless"}
          </div>
          <div
            className="history-chart"
            style={{ height }}
            role="img"
            aria-label={title}
          >
            <ResponsiveContainer width="100%" height="100%">
              <Chart
                data={points}
                margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid
                  stroke="#26313d"
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  dataKey={key}
                  tickFormatter={format}
                  minTickGap={45}
                  tick={{ fill: "#82909f", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={55}
                  domain={domain}
                  allowDecimals={!step}
                  tick={{ fill: "#82909f", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  labelFormatter={format}
                  contentStyle={{
                    background: "#17222d",
                    border: "1px solid #3b4d5e",
                    borderRadius: 8,
                    color: "#edf3f8",
                  }}
                  formatter={(v, name) => [
                    `${Number(v).toFixed(step ? 0 : 3)} ${unit}`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {series.map((s) =>
                  kind === "bar" ? (
                    <Bar
                      key={s.key}
                      dataKey={s.key}
                      name={s.label}
                      fill={s.color}
                      isAnimationActive={false}
                    />
                  ) : (
                    <Line
                      key={s.key}
                      type={step ? "stepAfter" : "linear"}
                      dataKey={s.key}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={1.7}
                      dot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ),
                )}
              </Chart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <EmptyState icon="analytics" title="Not available">
          No matching values for this selection.
        </EmptyState>
      )}
    </Panel>
  );
});
