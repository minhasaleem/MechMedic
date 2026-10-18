import { useState } from "react";
import { Panel, Badge, Modal, EmptyState } from "./ui";
import { measurements } from "../data/config";
import { readingLabel } from "../services/dataset";
export function Alerts({
  alerts,
  onAcknowledge,
  source,
  showAcknowledged = true,
}) {
  const [filter, setFilter] = useState(
      showAcknowledged ? "all" : "unacknowledged",
    ),
    [selected, setSelected] = useState(null),
    [error, setError] = useState("");
  const filtered = alerts.filter((a) =>
    filter === "acknowledged"
      ? a.acknowledged
      : filter === "unacknowledged"
        ? !a.acknowledged
        : true,
  );
  return (
    <Panel
      title="Isolation Forest anomaly alerts"
      action={<Badge>{source}</Badge>}
    >
      <div className="page-actions">
        <label>
          Filter
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["all", "anomaly", "acknowledged", "unacknowledged"].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="inset muted">
        An anomaly is not a confirmed mechanical fault. Acknowledgements are
        stored in this browser for the signed-in account.
      </p>
      {error && <p role="alert">{error}</p>}
      {filtered.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reading</th>
                <th>Anomaly score</th>
                <th>Detection status</th>
                <th>Acknowledgement</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>{readingLabel(a.reading)}</td>
                  <td>{a.anomaly_score}</td>
                  <td>
                    <Badge tone="warning">Anomaly Detected</Badge>
                  </td>
                  <td>
                    {a.acknowledged
                      ? `Acknowledged by ${a.acknowledged_by}`
                      : "Unacknowledged"}
                  </td>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => setSelected(a)}
                    >
                      View details
                    </button>
                    {!a.acknowledged && (
                      <button
                        className="secondary-button"
                        onClick={async () => {
                          try {
                            await onAcknowledge(a.id);
                          } catch (e) {
                            setError(e.message);
                          }
                        }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No matching anomaly alerts">
          Alerts appear only when a connected Isolation Forest model returns
          anomalies. An empty feed does not establish equipment health.
        </EmptyState>
      )}
      {selected && (
        <Modal title="Anomaly details" onClose={() => setSelected(null)}>
          <p>
            {readingLabel(selected.reading)} · {selected.source}
          </p>
          <dl className="record-detail">
            {[
              ["Detection status", "Anomaly Detected"],
              ["Anomaly score", selected.anomaly_score],
              ["Decision threshold", selected.decision_threshold],
              ["Model version", selected.model_version],
              ...measurements.map((m) => [
                m.name,
                Number.isFinite(selected.reading?.[m.key])
                  ? `${selected.reading[m.key]} ${m.unit}`
                  : "Not available",
              ]),
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </Panel>
  );
}
