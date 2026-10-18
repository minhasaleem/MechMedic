import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Panel } from "../components/ui";
import { measurements, sourceNames } from "../data/config";
export default function SettingsPage({ settings, onSave, mode, onMode, user }) {
  const { update } = useAuth();
  const [profileName, setProfileName] = useState(user.name);
  const [draft, setDraft] = useState(() => structuredClone(settings)),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  function set(section, key, value) {
    setDraft((v) => ({ ...v, [section]: { ...v[section], [key]: value } }));
  }
  async function save(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await onSave(draft);
      if (profileName.trim() !== user.name)
        await update({ name: profileName.trim(), email: user.email });
      setMessage("Monitoring preferences saved in this browser.");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <form onSubmit={save} className="settings-stack">
      <Panel title="Data source and live connection">
        <div className="form-grid inset">
          <label>
            Data source
            <select value={mode} onChange={(e) => onMode(e.target.value)}>
              {Object.entries(sourceNames).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Backend URL
            <input
              required
              type="url"
              value={draft.connection.apiBase}
              onChange={(e) => set("connection", "apiBase", e.target.value)}
            />
          </label>
          <label>
            WebSocket URL (optional)
            <input
              value={draft.connection.wsUrl}
              placeholder="ws://localhost:5000/stream"
              onChange={(e) => set("connection", "wsUrl", e.target.value)}
            />
          </label>
          <label>
            Refresh interval (milliseconds)
            <input
              type="number"
              min="1000"
              max="60000"
              step="100"
              value={draft.connection.pollMs}
              onChange={(e) =>
                set("connection", "pollMs", Number(e.target.value))
              }
            />
          </label>
        </div>
      </Panel>
      <Panel title="Model configuration">
        <label className="inset checkbox">
          <input
            type="checkbox"
            checked={draft.model.enabled}
            onChange={(e) => set("model", "enabled", e.target.checked)}
          />{" "}
          Connect Isolation Forest inference endpoint
        </label>
        <p className="inset muted">
          Requires the trained model and its preprocessing pipeline at
          /api/model/predict. No inference or training runs in this frontend.
          Demo mode does not request predictions.
        </p>
      </Panel>
      <Panel title="Visible sensor parameters">
        <div className="parameter-picker inset">
          {measurements.map((m) => (
            <label key={m.key}>
              <input
                type="checkbox"
                checked={draft.parameters.includes(m.key)}
                onChange={(e) =>
                  setDraft((v) => ({
                    ...v,
                    parameters: e.target.checked
                      ? [...v.parameters, m.key]
                      : v.parameters.filter((k) => k !== m.key),
                  }))
                }
              />
              {m.name}
            </label>
          ))}
        </div>
        <p className="inset muted">
          Visibility preferences do not change model inputs.
        </p>
      </Panel>
      <Panel title="Health indicator thresholds">
        <p className="inset muted">
          Optional project-defined colour bands for the backend health
          indicator, not validated mechanical fault thresholds. Leave both blank
          to disable bands.
        </p>
        <div className="form-grid inset">
          {[
            ["healthyMin", "Green minimum"],
            ["warningMin", "Amber minimum"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                value={draft.health[key] ?? ""}
                onChange={(e) =>
                  set(
                    "health",
                    key,
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </label>
          ))}
        </div>
      </Panel>
      <Panel title="Alert and dashboard preferences">
        <div className="inset">
          {[
            [
              "alerts",
              "showAcknowledged",
              "Show acknowledged alerts by default",
            ],
            ["dashboard", "compact", "Compact card spacing"],
          ].map(([s, k, label]) => (
            <label className="checkbox" key={k}>
              <input
                type="checkbox"
                checked={draft[s][k]}
                onChange={(e) => set(s, k, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </Panel>
      <Panel title="Account">
        <div className="form-grid inset">
          <label>
            Full name
            <input
              value={profileName}
              required
              maxLength={80}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </label>
          <label>
            Email
            <input value={user.email} readOnly />
          </label>
        </div>
      </Panel>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="form-success">
          {message}
        </p>
      )}
      <button className="primary-button">Save settings</button>
    </form>
  );
}
