import { HealthGauge } from "../components/Predictions";
import { HistoryChart } from "../components/HistoryChart";
import { Panel, Badge } from "../components/ui";
export default function HealthPage({ data, settings }) {
  const p = data.prediction;
  const history = data.results.map((r) => ({
    ...r,
    timestamp: data.rows.find((row) => row.reading_index === r.reading_index)
      ?.timestamp,
    statusValue: r.status === "anomaly" ? 1 : 0,
  }));
  return (
    <>
      <Panel
        title="Anomaly Detection – Isolation Forest"
        action={<Badge>{p ? "Model result" : "Model Not Available"}</Badge>}
      >
        <p className="settings-note">
          {data.modelStatus}. Unsupervised anomaly detection does not identify a
          confirmed mechanical fault.
        </p>
        <div className="health-focus">
          <HealthGauge
            score={p?.health_indicator}
            bands={settings.health}
            stale={data.stale}
          />
          <div className="model-metrics">
            <div>
              <span>Detection status</span>
              <strong>
                {!p
                  ? "Model Not Available"
                  : data.stale
                    ? "Unknown · stale data"
                    : p.status === "normal"
                      ? "Normal"
                      : "Anomaly Detected"}
              </strong>
            </div>
            <div>
              <span>Isolation Forest anomaly score</span>
              <strong>{p?.anomaly_score ?? "Not available"}</strong>
            </div>
            <div>
              <span>Model decision threshold</span>
              <strong>{p?.decision_threshold ?? "Not available"}</strong>
            </div>
            <div>
              <span>Model version</span>
              <strong>{p?.model_version ?? "Not connected"}</strong>
            </div>
          </div>
        </div>
        <p className="settings-note">
          The health indicator is a transformation of model scores, not a
          directly measured percentage of mechanical health.{" "}
          {p?.health_mapping
            ? `Backend mapping: ${p.health_mapping}`
            : "No score-to-indicator mapping is connected."}{" "}
          Colour bands, when set, are project-defined in Settings.
        </p>
      </Panel>
      <div className="analytics-grid spaced">
        <HistoryChart
          title="Health indicator trend"
          data={history}
          series={[
            {
              key: "health_indicator",
              label: "Score-derived indicator",
              color: "#49dab7",
            },
          ]}
          domain={[0, 100]}
        />
        <HistoryChart
          title="Historical detection status"
          data={history}
          series={[
            {
              key: "statusValue",
              label: "0 Normal / 1 Anomaly Detected",
              color: "#edb16a",
            },
          ]}
          domain={[0, 1]}
          step
        />
      </div>
      <Panel title="Maintenance prediction">
        <p className="settings-note">
          Maintenance prediction not available. A validated, integrated
          maintenance/LSTM model is required.
        </p>
      </Panel>
    </>
  );
}
