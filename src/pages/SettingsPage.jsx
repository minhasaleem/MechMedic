import { useEffect, useState } from "react";
import { Panel, Icon } from "../components/ui";
import { measurements } from "../data/config";
import { validateSettings } from "../services/settings";
import { useAuth } from "../context/AuthContext";
const pages = [
  ["home", "Home"],
  ["sensors", "Live Sensor Data"],
  ["health", "Health Score"],
  ["twin", "Digital Twin"],
  ["alerts", "Alert Feed"],
  ["maintenance", "Maintenance Log"],
  ["analytics", "Analytics"],
];
export default function SettingsPage({ settings, onSave, demo, loadError }) {
  const [draft, setDraft] = useState(() => structuredClone(settings)),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const { user, update } = useAuth();
  const [profile, setProfile] = useState({
      name: user.name,
      email: user.email,
    }),
    [profileMessage, setProfileMessage] = useState(""),
    [profileError, setProfileError] = useState("");
  useEffect(() => {
    setDraft(structuredClone(settings));
  }, [settings]);
  async function save(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      validateSettings(draft);
      await onSave(draft);
      setMessage(
        demo
          ? "Monitoring settings saved locally for this demo account."
          : "Monitoring settings saved.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const toggle = (group, key) =>
    setDraft((v) => ({
      ...v,
      [group]: { ...v[group], [key]: !v[group][key] },
    }));
  const threshold = (key, field, value) =>
    setDraft((v) => ({
      ...v,
      thresholds: {
        ...v.thresholds,
        [key]: {
          ...v.thresholds[key],
          [field]: value === "" ? null : Number(value),
        },
      },
    }));
  async function saveProfile(e) {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");
    if (!profile.name.trim()) {
      setProfileError("Full name is required.");
      return;
    }
    setBusy(true);
    try {
      await update(profile);
      setProfileMessage("Profile saved.");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form onSubmit={save}>
        <Panel
          title="Threshold Configuration"
          action={
            <span className="muted">Upper limits · blank means unset</span>
          }
        >
          <p className="settings-note">
            Configure limits for displayed readings. These limits do not replace
            the Random Forest classification or calculate a health score.
          </p>
          <div className="table-wrap">
            <table className="threshold-table">
              <thead>
                <tr>
                  <th>Measurement</th>
                  <th>Unit</th>
                  <th>Warning at or above</th>
                  <th>Critical at or above</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((m) => (
                  <tr key={m.key}>
                    <td>{m.name}</td>
                    <td>{m.unit}</td>
                    <td>
                      <input
                        type="number"
                        step="any"
                        aria-label={`${m.name} warning threshold`}
                        placeholder="Not set"
                        value={draft.thresholds[m.key].warningHigh ?? ""}
                        onChange={(e) =>
                          threshold(m.key, "warningHigh", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="any"
                        aria-label={`${m.name} critical threshold`}
                        placeholder="Not set"
                        value={draft.thresholds[m.key].criticalHigh ?? ""}
                        onChange={(e) =>
                          threshold(m.key, "criticalHigh", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="settings-grid">
          <Panel title="Alert preferences">
            <div className="settings-options">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.alerts.warning}
                  onChange={() => toggle("alerts", "warning")}
                />
                Show warning alerts on Home
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.alerts.critical}
                  onChange={() => toggle("alerts", "critical")}
                />
                Show critical alerts on Home
              </label>
              <p className="muted">
                The Alert Feed always retains all received alerts.
              </p>
            </div>
          </Panel>
          <Panel title="Notification settings">
            <div className="settings-options">
              {[
                ["email", "Email"],
                ["sms", "SMS"],
                ["whatsapp", "WhatsApp"],
              ].map(([key, label]) => (
                <label key={key} className="check-label">
                  <input
                    type="checkbox"
                    checked={draft.notifications[key]}
                    onChange={() => toggle("notifications", key)}
                  />
                  {label} notifications
                </label>
              ))}
              <p className="muted">
                {demo
                  ? "Preferences only in demo mode. No messages are sent."
                  : "The backend manages notification delivery and verified recipients."}
              </p>
            </div>
          </Panel>
          <Panel title="Dashboard preferences">
            <div className="settings-options">
              <label>
                Preferred starting page
                <select
                  value={draft.dashboard.defaultPage}
                  onChange={(e) =>
                    setDraft((v) => ({
                      ...v,
                      dashboard: {
                        ...v.dashboard,
                        defaultPage: e.target.value,
                      },
                    }))
                  }
                >
                  {pages.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.dashboard.compact}
                  onChange={() => toggle("dashboard", "compact")}
                />
                Compact dashboard spacing
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.dashboard.symbolicEffect}
                  onChange={() => toggle("dashboard", "symbolicEffect")}
                />
                Symbolic critical effect in the 3D view
              </label>
            </div>
          </Panel>
        </div>
        {(error || loadError) && (
          <p role="alert" className="form-error inset">
            {error || loadError}
          </p>
        )}
        {message && (
          <p role="status" className="form-success inset">
            {message}
          </p>
        )}
        <div className="settings-save">
          <span>
            {demo
              ? "Saved in this browser · demo account"
              : "Saved to the monitoring backend"}
          </span>
          <button className="primary-button" disabled={busy}>
            <Icon name="check" />{" "}
            {busy ? "Saving…" : "Save monitoring settings"}
          </button>
        </div>
      </form>
      <Panel title="Account / profile">
        <form className="profile-form" onSubmit={saveProfile}>
          <div className="form-grid">
            <label>
              Full name
              <input
                required
                maxLength={80}
                value={profile.name}
                onChange={(e) =>
                  setProfile((v) => ({ ...v, name: e.target.value }))
                }
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                maxLength={150}
                readOnly={user.id === "demo-staff"}
                value={profile.email}
                onChange={(e) =>
                  setProfile((v) => ({ ...v, email: e.target.value }))
                }
              />
            </label>
          </div>
          {profileError && (
            <p className="form-error" role="alert">
              {profileError}
            </p>
          )}
          {profileMessage && (
            <p className="form-success" role="status">
              {profileMessage}
            </p>
          )}
          <button className="secondary-button" disabled={busy}>
            Save profile
          </button>
        </form>
      </Panel>
    </>
  );
}
