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
export function HistoryChart({
  title,
  data,
  series,
  unit = "",
  domain = ["auto", "auto"],
  kind = "line",
  height = 230,
  step = false,
}) {
  const chartData = data.map((r) => ({ ...r, time: Date.parse(r.timestamp) }));
  const format = (t) =>
    new Date(t).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const Chart = kind === "bar" ? BarChart : LineChart;
  return (
    <Panel title={title} className="history-panel">
      {data.length ? (
        <div
          className="history-chart"
          style={{ height }}
          role="img"
          aria-label={title}
        >
          <ResponsiveContainer width="100%" height="100%">
            <Chart
              data={chartData}
              margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
            >
              <CartesianGrid
                stroke="#26313d"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tickFormatter={format}
                minTickGap={70}
                tick={{ fill: "#82909f", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                width={44}
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
                  `${Number(v).toFixed(step ? 0 : 2)} ${unit}`,
                  name,
                ]}
              />
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
              {series.map((s) =>
                kind === "bar" ? (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color}
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                  />
                ) : (
                  <Line
                    key={s.key}
                    type={step ? "stepAfter" : "monotone"}
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ),
              )}
            </Chart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState icon="analytics" title="No data in this period">
          Choose another time range or wait for readings.
        </EmptyState>
      )}
    </Panel>
  );
}
