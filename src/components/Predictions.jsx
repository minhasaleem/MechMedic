import { healthState } from "../data/config";
import { Badge } from "./ui";
export function HealthGauge({ score, bands, stale }) {
  const state = healthState(stale ? null : score, bands);
  return (
    <div className="gauge-wrap large">
      <div
        className="health-ring"
        role="img"
        aria-label={
          score == null
            ? "Health indicator not available"
            : `Health indicator ${score} out of 100`
        }
        style={{
          "--progress": score == null ? "0deg" : `${score * 3.6}deg`,
          "--health-color": state.color,
        }}
      >
        <div>
          <strong>{score == null ? "—" : score.toFixed(1)}</strong>
          <span>{score == null ? "Not available" : "Score-derived / 100"}</span>
        </div>
      </div>
      <Badge tone={state.tone}>
        {stale ? "Stale assessment" : state.label}
      </Badge>
    </div>
  );
}
