import { HealthGauge } from "../components/Predictions";
import { HistoryChart } from "../components/HistoryChart";
import { Panel, Badge, timeLabel } from "../components/ui";
import { healthState, HEALTH_BANDS } from "../data/config";
export default function HealthPage({ data, demo }) {
  const p = data.prediction,
    state = healthState(p?.health_score);
  return (
    <>
      <div className="health-page-grid">
        <Panel
          title="Current health score"
          action={
            <Badge tone={demo ? "amber" : ""}>
              {demo ? "Demo LSTM output" : "LSTM output"}
            </Badge>
          }
        >
          <div className="health-focus">
            <HealthGauge
              score={p?.health_score}
              stale={data.predictionStale}
              large
            />
            <div>
              <h3>
                {data.predictionStale ? "Assessment is stale" : state.label}
              </h3>
              <p>Updated {timeLabel(p?.timestamp)}</p>
              <div className="health-key">
                <span>
                  <i className="key-green" /> {HEALTH_BANDS.healthy}–100 Healthy
                </span>
                <span>
                  <i className="key-amber" /> {HEALTH_BANDS.warning}–
                  {HEALTH_BANDS.healthy - 1} Degrading
                </span>
                <span>
                  <i className="key-red" /> 0–{HEALTH_BANDS.warning - 1}{" "}
                  Critical
                </span>
              </div>
            </div>
          </div>
        </Panel>
        <Panel title="Predicted maintenance">
          <div className="maintenance-window">
            <span className="eyebrow">ESTIMATED TIME UNTIL MAINTENANCE</span>
            <strong>
              {p?.maintenance_hours == null ? "—" : p.maintenance_hours}
              <small>{p?.maintenance_hours != null ? "hours" : ""}</small>
            </strong>
            <Badge tone={data.predictionStale ? "amber" : ""}>
              {data.predictionStale
                ? "Stale prediction"
                : p?.maintenance_hours == null
                  ? "Awaiting prediction"
                  : demo
                    ? "Simulated estimate"
                    : "Model estimate"}
            </Badge>
            <p>
              {demo
                ? "Demonstration output. Not a recommendation for the actual rig."
                : "Use the latest model assessment alongside laboratory maintenance procedures."}
            </p>
          </div>
        </Panel>
      </div>
      <HistoryChart
        title="Recent health trend"
        data={data.healthHistory}
        series={[
          { key: "health_score", label: "Health score", color: state.color },
        ]}
        unit="%"
        domain={[0, 100]}
      />
    </>
  );
}
