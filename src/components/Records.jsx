import { useState } from "react";
import { Badge, Panel, EmptyState, Icon, dateLabel } from "./ui";
const filters = [
  ["all", "All"],
  ["warning", "Warning"],
  ["critical", "Critical"],
  ["acknowledged", "Acknowledged"],
  ["unacknowledged", "Unacknowledged"],
];
export function Alerts({
  alerts,
  onAcknowledge,
  compact = false,
  unavailable = false,
}) {
  const [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(null),
    [error, setError] = useState("");
  const rows = alerts
    .filter(
      (a) =>
        filter === "all" ||
        (filter === "acknowledged" && a.acknowledged) ||
        (filter === "unacknowledged" && !a.acknowledged) ||
        a.severity === filter,
    )
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  async function ack(id) {
    setBusy(id);
    setError("");
    try {
      await onAcknowledge(id);
    } catch (e) {
      setError(`Could not acknowledge alert: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }
  return (
    <Panel
      title={compact ? "Recent important alerts" : "Alert Feed"}
      eyebrow={compact ? "REQUIRES ATTENTION" : undefined}
      action={
        compact ? (
          <a className="text-link" href="#alerts">
            View all ↗
          </a>
        ) : (
          <Badge>
            {alerts.filter((a) => !a.acknowledged).length} unacknowledged
          </Badge>
        )
      }
    >
      {!compact && (
        <div className="filter-pills" aria-label="Filter alerts">
          {filters.map(([key, label]) => (
            <button
              key={key}
              aria-pressed={filter === key}
              className={filter === key ? "selected" : ""}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="form-error inset" role="alert">
          {error}
        </p>
      )}
      {unavailable ? (
        <EmptyState icon="alerts" title="Alert feed unavailable">
          The backend alert feed could not be loaded.
        </EmptyState>
      ) : rows.length ? (
        <div className="alert-list">
          {rows.slice(0, compact ? 2 : rows.length).map((a) => (
            <article className={`alert-row severity-${a.severity}`} key={a.id}>
              <div className="alert-row-top">
                <Badge
                  tone={
                    a.severity === "critical"
                      ? "red"
                      : a.severity === "warning"
                        ? "amber"
                        : ""
                  }
                >
                  {a.severity || "Information"}
                </Badge>
                <time>{dateLabel(a.timestamp)}</time>
              </div>
              <h3>{a.message}</h3>
              <div className="alert-metadata">
                <span>
                  Source <strong>{a.source || "Not provided"}</strong>
                </span>
                <span>
                  Condition <strong>{a.condition || "Not provided"}</strong>
                </span>
              </div>
              <div className="alert-row-bottom">
                {a.acknowledged ? (
                  <span className="acknowledged">
                    <Icon name="check" size={14} /> Acknowledged
                    {a.acknowledged_by ? ` · ${a.acknowledged_by}` : ""}
                  </span>
                ) : (
                  <span className="muted">Unacknowledged</span>
                )}
                {!a.acknowledged && (
                  <button
                    className="secondary-button small"
                    disabled={busy === a.id || !onAcknowledge}
                    onClick={() => ack(a.id)}
                  >
                    {busy === a.id ? "Saving…" : "Acknowledge"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="alerts"
          title={filter === "all" ? "No alerts received" : "No matching alerts"}
        >
          No notifications to display for this selection.
        </EmptyState>
      )}
    </Panel>
  );
}
