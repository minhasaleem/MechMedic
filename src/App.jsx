import { lazy, Suspense, useEffect, useState } from "react";
import { Sidebar, navigation } from "./components/Sidebar";
import { Icon, Badge, EmptyState, Brand } from "./components/ui";
import { SensorCard } from "./components/SensorCard";
import { Trends } from "./components/Trends";
import { Predictions } from "./components/Predictions";
import { Alerts } from "./components/Records";
import {
  measurements,
  equipment,
  faultClasses,
  healthState,
  POLL_MS,
} from "./data/config";
import { demoScenarios } from "./data/demo";
import { useMonitoring } from "./hooks/useMonitoring";
import { useSettings } from "./hooks/useSettings";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import HealthPage from "./pages/HealthPage";
import MaintenancePage from "./pages/MaintenancePage";
import SettingsPage from "./pages/SettingsPage";
const DigitalTwin = lazy(() => import("./components/DigitalTwin"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const pages = {
  home: [
    "Home",
    "Your equipment, signals and maintenance priorities at a glance.",
  ],
  sensors: [
    "Live Sensor Data",
    "Five measurements. One real-time view of your engine test rig.",
  ],
  health: [
    "Health Score",
    "Track equipment health and the predicted maintenance window.",
  ],
  twin: ["Digital Twin", "Inspect the test rig and its current health state."],
  alerts: [
    "Alert Feed",
    "Review equipment alerts and acknowledge items requiring attention.",
  ],
  maintenance: [
    "Maintenance Log",
    "Record inspections, service actions and maintenance outcomes.",
  ],
  analytics: [
    "Analytics",
    "Explore historical signals, conditions and maintenance activity.",
  ],
  settings: [
    "Settings",
    "Manage monitoring limits, notifications and your workspace.",
  ],
};
function readRoute() {
  return location.hash.slice(1) || "home";
}
function Workspace({ page }) {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState("demo"),
    [scenario, setScenario] = useState("healthy"),
    [menu, setMenu] = useState(false),
    [logoutError, setLogoutError] = useState("");
  const data = useMonitoring(mode, scenario, user),
    preferences = useSettings(user.id, mode),
    demo = mode === "demo";
  const state = healthState(
    data.predictionStale ? null : data.prediction?.health_score,
  );
  useEffect(() => {
    if (preferences.loaded && !location.hash)
      location.hash = preferences.settings.dashboard.defaultPage;
  }, [preferences.loaded, preferences.settings.dashboard.defaultPage]);
  const unavailable = (endpoint) =>
    !demo && data.issues.some((i) => i.startsWith(endpoint + " "));
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    document.title = `${pages[page][0]} | MechMedic`;
    window.scrollTo(0, 0);
  }, [page]);
  async function signOut() {
    setLogoutError("");
    try {
      await logout();
    } catch {
      setLogoutError("Sign out could not be completed. Please try again.");
    }
  }
  const sensorCards = (
    <div className="sensor-grid five-sensors">
      {measurements.map((m) => (
        <SensorCard
          key={m.key}
          measurement={m}
          latest={data.latest}
          history={data.history}
          demo={demo}
          stale={data.stale || data.status === "disconnected"}
          threshold={preferences.settings.thresholds[m.key]}
        />
      ))}
    </div>
  );
  const prediction = (
    <Predictions
      prediction={data.prediction}
      stale={data.predictionStale}
      demo={demo}
    />
  );
  const twin = (
    <DigitalTwin
      score={data.prediction?.health_score}
      stale={data.predictionStale}
      demo={demo}
      symbolicEffect={preferences.settings.dashboard.symbolicEffect}
      compact={page === "home"}
    />
  );
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar
        page={page}
        open={menu}
        onClose={() => setMenu(false)}
        user={user}
        onLogout={signOut}
      />
      <div
        className={`workspace ${preferences.settings.dashboard.compact ? "density-compact" : ""}`}
      >
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(true)}
              aria-label="Open navigation"
              aria-expanded={menu}
            >
              <Icon name="menu" />
            </button>
            <span>Laboratory</span>
            <Icon name="chevron" size={14} />
            <strong>{pages[page][0]}</strong>
          </div>
          <div className="topbar-right">
            <Badge
              tone={demo ? "amber" : data.status === "connected" ? "mint" : ""}
            >
              {demo ? "Demo workspace" : data.status}
            </Badge>
            <a
              href="#settings"
              className="avatar"
              aria-label="Account settings"
            >
              {user.name.slice(0, 2).toUpperCase()}
            </a>
          </div>
        </header>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow heading-eyebrow">
                MECHMEDIC / EQUIPMENT MONITORING
              </div>
              <h1>{pages[page][0]}</h1>
              <p>{pages[page][1]}</p>
            </div>
            <div className="data-controls">
              <label htmlFor="data-mode">Data source</label>
              <select
                id="data-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="demo">Demo data</option>
                <option value="live">Live backend</option>
              </select>
            </div>
          </div>
          <div
            className={`connection-banner ${demo ? "demo" : "live"}`}
            role="status"
          >
            <Icon name={demo ? "info" : "plug"} size={18} />
            <div>
              <strong>
                {demo
                  ? "Demonstration data"
                  : data.status === "connected"
                    ? "Backend connected"
                    : data.status === "stale"
                      ? "Sensor data is stale"
                      : data.status === "connecting"
                        ? "Connecting to backend…"
                        : "Backend disconnected"}
              </strong>
              <span>
                {demo
                  ? " All readings, predictions and example records are synthetic."
                  : data.error
                    ? ` ${data.error}`
                    : ` Updates every ${POLL_MS / 1000} seconds.`}
              </span>
            </div>
            {demo && (
              <label className="scenario-select">
                <span>Example state</span>
                <select
                  aria-label="Demo health scenario"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                >
                  {Object.entries(demoScenarios).map(([key, s]) => (
                    <option key={key} value={key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {logoutError && (
            <p className="form-error" role="alert">
              {logoutError}
            </p>
          )}
          {data.issues.length > 0 && (
            <details className="integration-issues">
              <summary>
                {data.issues.length} monitoring feeds unavailable
              </summary>
              {data.issues.map((i) => (
                <p key={i}>{i}</p>
              ))}
            </details>
          )}
          {page === "home" && (
            <>
              <div className="equipment-context">
                <div>
                  <Icon name="equipment" />
                  <span>
                    <strong>
                      {equipment.manufacturer} {equipment.name}
                    </strong>
                    <small>{equipment.description}</small>
                  </span>
                </div>
                <span>
                  {equipment.power} / {equipment.ratedSpeed} rated
                </span>
              </div>
              <div className="overview-stats">
                <div>
                  <span>Equipment status</span>
                  <strong style={{ color: state.color }}>
                    {data.predictionStale ? "Stale assessment" : state.label}
                  </strong>
                  <small>
                    {demo ? "Demo assessment" : "Latest health assessment"}
                  </small>
                </div>
                <div>
                  <span>Fault classification</span>
                  <strong>
                    {data.prediction?.fault_class == null
                      ? "Not available"
                      : faultClasses[data.prediction.fault_class]}
                  </strong>
                  <small>
                    Random Forest{data.predictionStale ? " · stale" : ""}
                  </small>
                </div>
                <div>
                  <span>Health score</span>
                  <strong>
                    {data.prediction?.health_score == null
                      ? "—"
                      : `${Math.round(data.prediction.health_score)}%`}
                  </strong>
                  <small>LSTM{data.predictionStale ? " · stale" : ""}</small>
                </div>
                <div>
                  <span>Maintenance window</span>
                  <strong>
                    {data.prediction?.maintenance_hours == null
                      ? "Not available"
                      : `${data.prediction.maintenance_hours} hours`}
                  </strong>
                  <small>
                    {demo
                      ? "Simulated estimate"
                      : data.predictionStale
                        ? "Stale estimate"
                        : "Predicted estimate"}
                  </small>
                </div>
              </div>
              <div className="section-label">
                <h2>Latest sensor readings</h2>
                <a href="#sensors" className="text-link">
                  View live data ↗
                </a>
              </div>
              {sensorCards}
              <div className="overview-grid">
                <Suspense
                  fallback={<EmptyState title="Loading equipment view…" />}
                >
                  {twin}
                </Suspense>
                {prediction}
              </div>
              <div className="lower-grid">
                <Trends history={data.history} demo={demo} />
                <Alerts
                  alerts={data.alerts.filter((a) =>
                    a.severity === "critical"
                      ? preferences.settings.alerts.critical
                      : a.severity === "warning"
                        ? preferences.settings.alerts.warning
                        : true,
                  )}
                  onAcknowledge={data.acknowledge}
                  compact
                  unavailable={unavailable("/api/alerts")}
                />
              </div>
            </>
          )}
          {page === "sensors" && (
            <>
              {sensorCards}
              <Trends history={data.history} demo={demo} />
              <p className="monitoring-note">
                Reading badges reflect your configured limits. Fault
                classification is provided separately by Random Forest.
              </p>
            </>
          )}
          {page === "health" && <HealthPage data={data} demo={demo} />}
          {page === "twin" && (
            <Suspense fallback={<EmptyState title="Loading 3D view…" />}>
              {twin}
            </Suspense>
          )}
          {page === "alerts" && (
            <Alerts
              key={mode}
              alerts={data.alerts}
              onAcknowledge={data.acknowledge}
              unavailable={unavailable("/api/alerts")}
            />
          )}
          {page === "maintenance" && (
            <MaintenancePage
              key={mode}
              records={data.maintenance}
              onAdd={data.addRecord}
              user={user}
              demo={demo}
              unavailable={unavailable("/api/maintenance")}
            />
          )}
          {page === "analytics" && (
            <Suspense fallback={<EmptyState title="Loading analytics…" />}>
              <AnalyticsPage mode={mode} scenario={scenario} records={data} />
            </Suspense>
          )}
          {page === "settings" && (
            <SettingsPage
              key={mode}
              settings={preferences.settings}
              onSave={preferences.save}
              demo={demo}
              loadError={preferences.error}
            />
          )}
          <footer>
            <span>
              <span className="footer-mark">M</span>MechMedic{" "}
              <span className="footer-divider">/</span> Keeping Machines One
              Step Ahead
            </span>
            <span>
              {demo ? "Demo data" : "Live backend"} · Laboratory workspace
            </span>
          </footer>
        </main>
      </div>
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
