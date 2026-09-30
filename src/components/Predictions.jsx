import { healthState, faultClasses } from "../data/config";
import { Badge, Icon, Panel, timeLabel } from "./ui";
export function HealthGauge({ score, stale = false, large = false }) {
  const state = healthState(stale ? null : score);
  return (
    <div className={`gauge-wrap ${large ? "large" : ""}`}>
      <div
        className="health-ring"
        role="img"
        aria-label={`Health score ${score == null ? "unavailable" : score + " percent"}${stale ? ", stale result" : ""}`}
        style={{
          "--progress": score == null ? "0deg" : `${score * 3.6}deg`,
          "--health-color": state.color,
        }}
      >
        <div>
          <strong>{score == null ? "—" : `${Math.round(score)}%`}</strong>
          <span>Health score</span>
        </div>
      </div>
      <Badge tone={stale ? "amber" : state.tone}>
        {stale ? "Stale result" : state.label}
      </Badge>
    </div>
  );
}
export function Predictions({ prediction, stale, demo }) {
  const fault = prediction?.fault_class;
  return (
    <Panel
      title="Equipment condition"
      eyebrow="CURRENT ASSESSMENT"
      action={
        <Badge tone={demo ? "amber" : ""}>
          {demo ? "Demo output" : stale ? "Stale output" : "Model output"}
        </Badge>
      }
      className="prediction-panel"
    >
      <div className="classifier">
        <div className="model-label">
          <Icon name="predictions" />
          <span>
            Random Forest <small>Fault classification</small>
          </span>
        </div>
        <div className="condition-line">
          <strong className={fault > 0 ? "warning-text" : ""}>
            {fault == null ? "Condition unknown" : faultClasses[fault]}
          </strong>
        </div>
        <div className="class-scale">
          {faultClasses.map((label, i) => (
            <div key={label} className={fault === i ? "current-class" : ""}>
              <span
                style={{
                  background: ["#49dab7", "#e2c26f", "#ec9758", "#e87583"][i],
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
      <div className="lstm">
        <div className="health-row">
          <HealthGauge score={prediction?.health_score} stale={stale} />
          <div className="maintenance-prediction">
            <span className="muted">Predicted maintenance window</span>
            <strong>
              {prediction?.maintenance_hours == null
                ? "Not available"
                : `${prediction.maintenance_hours} hours`}
            </strong>
            <p>
              {demo
                ? "Simulated LSTM result"
                : stale
                  ? "Last known LSTM result"
                  : "LSTM prediction"}
            </p>
          </div>
        </div>
      </div>
      <div className="prediction-note">
        <Icon name="clock" size={15} />
        <span>
          {prediction
            ? `Updated ${timeLabel(prediction.timestamp)}${stale ? " · Not a current assessment" : ""}`
            : "Awaiting model output"}
        </span>
      </div>
    </Panel>
  );
}
