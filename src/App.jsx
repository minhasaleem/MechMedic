import { lazy, Suspense, useEffect, useState } from "react";

import { Sidebar, navigation } from "./components/Sidebar";

import { Icon, Badge, Brand } from "./components/ui";

import { SensorCard } from "./components/SensorCard";

import { Trends } from "./components/Trends";

import { Alerts } from "./components/Records";

import {
  measurements,
  equipment,
  GROUPS,
  CSV_FILES,
  sourceNames,
} from "./data/config";

import { parseCSV, readingLabel } from "./services/dataset";

import { useMonitoring } from "./hooks/useMonitoring";

import { useSettings } from "./hooks/useSettings";

import { AuthProvider, useAuth } from "./context/AuthContext";

import AuthPage from "./pages/AuthPage";

import HealthPage from "./pages/HealthPage";

import MaintenancePage from "./pages/MaintenancePage";

import SettingsPage from "./pages/SettingsPage";

const DigitalTwin = lazy(() => import("./components/DigitalTwin"));

const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));

const pages = Object.fromEntries(navigation);

function readRoute() {
  return location.hash.replace(/^#\/?/, "").split("?")[0] || "home";
}

function Workspace({ page }) {
  const { user, logout } = useAuth(),
    { settings, save, loaded } = useSettings(user.id);

  const [mode, setMode] = useState("demo"),
    [dataset, setDataset] = useState(null),
    [open, setOpen] = useState(false),
    [csvError, setCsvError] = useState(""),
    [loading, setLoading] = useState(false);

  async function importText(text, name) {
    const parsed = parseCSV(text);
    if (parsed.rows.length > 50000)
      throw new Error("Please use a CSV with at most 50,000 readings.");
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text),
    );
    setDataset({
      ...parsed,
      name,
      id: Array.from(new Uint8Array(hash), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join(""),
    });
  }

  async function loadFile(file) {
    setLoading(true);
    setCsvError("");
    setDataset(null);
    try {
      const response = await fetch(file.url);
      if (!response.ok) throw new Error("CSV could not be loaded");
      await importText(await response.text(), file.name);
    } catch (e) {
      setCsvError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFile(CSV_FILES[0]);
  }, []);

  useEffect(() => {
    document.title = `MechMedic | ${pages[page]}`;
    setOpen(false);
  }, [page]);

  return (
    <div
      className={`app-shell ${settings.dashboard.compact ? "compact-density" : ""}`}
    >
      <Sidebar
        page={page}
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        onLogout={logout}
      />
      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <span>Laboratory monitoring / {pages[page]}</span>
          <label className="source-select">
            Data source
            <select
              aria-label="Data source"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              {Object.entries(sourceNames).map(([v, n]) => (
                <option key={v} value={v}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">KEEPING MACHINES ONE STEP AHEAD</span>
              <h1>{page === "home" ? "MechMedic" : pages[page]}</h1>
              <h2 className="equipment-name">{equipment.name}</h2>
              <p>
                {page === "home"
                  ? "Intelligent monitoring and machine learning-assisted anomaly detection for laboratory equipment."
                  : sourceNames[mode]}
              </p>
            </div>
          </div>

          {mode === "csv" && (
            <details className="csv-details panel">
              <summary>
                {loading
                  ? "Loading CSV…"
                  : dataset
                    ? `${dataset.name} · ${dataset.rows.length} readings`
                    : "Choose CSV data"}{" "}
                <span> · Configure dataset</span>
              </summary>
              <section className="csv-toolbar">
                <label>
                  Dataset
                  <select
                    disabled={loading}
                    aria-label="CSV dataset"
                    value={
                      CSV_FILES.find((f) => f.name === dataset?.name)?.url || ""
                    }
                    onChange={(e) =>
                      loadFile(CSV_FILES.find((f) => f.url === e.target.value))
                    }
                  >
                    <option value="" disabled>
                      Uploaded CSV / loading
                    </option>
                    {CSV_FILES.map((f) => (
                      <option key={f.url} value={f.url}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Upload CSV
                  <input
                    aria-label="Upload CSV"
                    type="file"
                    accept=".csv,text/csv"
                    disabled={loading}
                    onChange={async (e) => {
                      const f = e.target.files[0];
                      if (!f) return;
                      setLoading(true);
                      setDataset(null);
                      setCsvError("");
                      try {
                        if (f.size > 10000000)
                          throw new Error("CSV limit is 10 MB.");
                        await importText(await f.text(), f.name);
                      } catch (err) {
                        setCsvError(err.message);
                      } finally {
                        setLoading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                <p>
                  {loading
                    ? "Loading CSV…"
                    : dataset
                      ? `${dataset.name} · ${dataset.rows.length} readings · ${dataset.hasTimestamps ? "Recorded timestamps" : "Reading index (no timestamps)"}`
                      : "No CSV loaded"}
                </p>
                <p>
                  Only the 11 numerical features are used. The condition column
                  is excluded.
                </p>
                {dataset?.missing?.length > 0 && (
                  <p>Unavailable columns: {dataset.missing.join(", ")}</p>
                )}
                {dataset?.warnings?.length > 0 && (
                  <p role="status">
                    {dataset.warnings.length} readings contain invalid numeric
                    values, shown as unavailable.
                  </p>
                )}
                {csvError && <p role="alert">{csvError}</p>}
              </section>
            </details>
          )}

          {loaded && (
            <MonitoringWorkspace
              key={`${mode}:${dataset?.id || ""}`}
              {...{ mode, dataset, user, settings, page, save, setMode }}
            />
          )}
        </div>
        <footer>MechMedic · Keeping Machines One Step Ahead</footer>
      </main>
    </div>
  );
}

function MonitoringWorkspace({
  mode,
  dataset,
  user,
  settings,
  page,
  save,
  setMode,
}) {
  const data = useMonitoring(mode, dataset, user, settings);

  const status =
    data.stale || !data.prediction
      ? "Unknown"
      : data.prediction.status === "normal"
        ? "Normal"
        : "Anomaly Detected";

  return (
    <>
      <div className="source-notice">
        <Badge>{data.source}</Badge>
        <span>
          {mode === "demo"
            ? "Synthetic readings for demonstration. No model predictions."
            : mode === "csv"
              ? data.modelStatus
              : `Live connection: ${data.connection}`}
        </span>
        {data.error && <span role="status">{data.error}</span>}
      </div>

      {page === "home" && (
        <>
          <section className="overview-cards">
            {[
              ["Equipment Status", status, "shield", data.modelStatus],
              [
                "Health Score",
                data.stale || data.prediction?.health_indicator == null
                  ? "Not available"
                  : `${data.prediction.health_indicator.toFixed(1)} / 100`,
                "health",
                "Model-derived indicator",
              ],
              [
                "Latest Reading",
                readingLabel(data.latest),
                "clock",
                data.source,
              ],
              [
                "Active Alerts",
                data.alerts.filter((a) => !a.acknowledged).length,
                "alerts",
                "Unacknowledged anomaly alerts",
              ],
            ].map(([label, value, icon, note]) => (
              <article className="summary-card" key={label}>
                <Icon name={icon} />
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </article>
            ))}
          </section>

        </>
      )}

      {page === "sensors" && (
        <>
          <p className="muted">
            Dataset parameters include derived features; they do not imply
            eleven separate physical sensors. Missing live features remain
            unavailable.
          </p>
          {GROUPS.map((group) => (
            <section key={group} className="sensor-category">
              <h2>{group}</h2>
              <div className="sensor-grid">
                {measurements
                  .filter(
                    (m) =>
                      m.group === group && settings.parameters.includes(m.key),
                  )
                  .map((m) => (
                    <SensorCard
                      key={m.key}
                      measurement={m}
                      latest={data.latest}
                      history={data.rows}
                      source={data.source}
                      stale={data.stale}
                    />
                  ))}
              </div>
            </section>
          ))}
          <Trends history={data.rows} availableKeys={settings.parameters} />
        </>
      )}

      {page === "health" && <HealthPage data={data} settings={settings} />}

      {page === "twin" && (
        <Suspense fallback={<p>Loading equipment view…</p>}>
          <DigitalTwin data={data} mode={mode} settings={settings} />
        </Suspense>
      )}

      {page === "alerts" && (
        <Alerts
          alerts={data.alerts}
          onAcknowledge={data.acknowledge}
          source={data.source}
          showAcknowledged={settings.alerts.showAcknowledged}
        />
      )}

      {page === "maintenance" && (
        <MaintenancePage
          records={data.maintenance}
          onAdd={data.addRecord}
          onUpdate={data.updateRecord}
          user={user}
          demo={mode === "demo"}
          unavailable={!!data.recordError}
        />
      )}

      {page === "analytics" && (
        <Suspense fallback={<p>Loading analytics…</p>}>
          <AnalyticsPage data={data} />
        </Suspense>
      )}

      {page === "settings" && (
        <SettingsPage
          settings={settings}
          onSave={save}
          mode={mode}
          onMode={setMode}
          user={user}
        />
      )}
    </>
  );
}

function Router() {
  const [route, setRoute] = useState(readRoute);

  const { user, loading } = useAuth();

  useEffect(() => {
    const change = () => setRoute(readRoute());

    window.addEventListener("hashchange", change);

    return () => window.removeEventListener("hashchange", change);
  }, []);

  useEffect(() => {
    if (
      !loading &&
      !user &&
      !["login", "register", "forgot-password"].includes(route)
    )
      location.hash = "login";

    if (!loading && user && !pages[route]) location.hash = "home";
  }, [user, loading, route]);

  useEffect(() => {
    if (!user) document.title = "MechMedic | Staff access";
  }, [user]);

  if (loading)
    return (
      <div className="session-loading">
        <div className="brand">
          <Brand />
        </div>

        <p>Checking your session…</p>
      </div>
    );

  if (!user)
    return (
      <AuthPage
        key={route}
        page={["register", "forgot-password"].includes(route) ? route : "login"}
      />
    );

  return <Workspace page={pages[route] ? route : "home"} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
