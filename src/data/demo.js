// SYNTHETIC UI FIXTURES ONLY. No sensor values, fault events or ML results in this
// module represent real equipment. Scenarios exercise UI states, not ML formulas.
import { POLL_MS } from "./config.js";
export const demoScenarios = {
  healthy: { label: "Healthy example", health: 82, fault: 0, hours: 36 },
  warning: { label: "Warning example", health: 55, fault: 2, hours: 18 },
  critical: { label: "Critical example", health: 25, fault: 3, hours: 2 },
};
function reading(time) {
  const t = time / 45000;
  return {
    timestamp: new Date(time).toISOString(),
    vibration_x: 0.12 + Math.sin(t) * 0.025 + Math.sin(t * 3) * 0.009,
    vibration_y: 0.08 + Math.cos(t * 0.8) * 0.018,
    vibration_z: 0.21 + Math.sin(t * 0.7) * 0.028,
    temperature: 67 + Math.sin(t * 0.18) * 2 + Math.sin(t) * 0.3,
    current: 4.1 + Math.sin(t * 0.35) * 0.35 + Math.cos(t * 2) * 0.08,
  };
}
export function createDemoSnapshot(now = Date.now(), scenario = "healthy") {
  const fixture = demoScenarios[scenario] || demoScenarios.healthy;
  const history = Array.from({ length: 721 }, (_, i) =>
    reading(now - (720 - i) * POLL_MS),
  );
  const healthHistory = Array.from({ length: 61 }, (_, i) => ({
    timestamp: new Date(now - (60 - i) * 60000).toISOString(),
    health_score: fixture.health + Math.sin(i / 8) * 2,
  }));
  return {
    latest: history.at(-1),
    history,
    prediction: {
      timestamp: new Date(now).toISOString(),
      fault_class: fixture.fault,
      health_score: fixture.health,
      maintenance_hours: fixture.hours,
    },
    healthHistory,
    classificationHistory: healthHistory.map((r) => ({
      timestamp: r.timestamp,
      fault_class: fixture.fault,
    })),
    issues: [],
  };
}
export function createDemoRecords(now = Date.now()) {
  return {
    alerts: [
      {
        id: "demo-alert-1",
        timestamp: new Date(now - 12 * 60000).toISOString(),
        severity: "critical",
        source: "LSTM · demo",
        message: "Example critical health notification",
        condition: "Severe Fault",
        acknowledged: false,
      },
      {
        id: "demo-alert-2",
        timestamp: new Date(now - 55 * 60000).toISOString(),
        severity: "warning",
        source: "Random Forest · demo",
        message: "Example condition review requested",
        condition: "Moderate Fault",
        acknowledged: false,
      },
      {
        id: "demo-alert-3",
        timestamp: new Date(now - 86400000).toISOString(),
        severity: "warning",
        source: "Surface temperature · demo",
        message: "Example temperature threshold notification",
        condition: "Minor Fault",
        acknowledged: true,
        acknowledged_by: "Demo staff",
      },
    ],
    maintenance: [
      {
        id: "demo-record-1",
        timestamp: new Date(now - 2 * 86400000).toISOString(),
        type: "Inspection",
        message: "Example equipment inspection",
        condition: "Normal",
        technician: "Demo technician",
        notes: "Synthetic service record for interface preview.",
      },
      {
        id: "demo-record-2",
        timestamp: new Date(now - 7 * 86400000).toISOString(),
        type: "Preventive",
        message: "Example scheduled maintenance",
        condition: "Minor Fault",
        technician: "Demo technician",
        notes: "Synthetic record. No work on the actual rig is implied.",
      },
    ],
  };
}
export function createDemoAnalytics(
  from,
  to,
  scenario = "healthy",
  now = Date.now(),
) {
  const fixture = demoScenarios[scenario] || demoScenarios.healthy;
  const start = Math.max(from, now - 30 * 86400000),
    end = Math.min(to, now);
  if (start > end)
    return { history: [], healthHistory: [], classificationHistory: [] };
  const step =
    end - start < 86400000
      ? Math.max(POLL_MS, Math.ceil((end - start) / 360))
      : 3600000;
  const history = [];
  for (let t = start; t <= end; t += step) history.push(reading(t));
  return {
    history,
    healthHistory: history.map((r, i) => ({
      timestamp: r.timestamp,
      health_score: fixture.health + Math.sin(i / 12) * 2,
    })),
    classificationHistory: history.map((r) => ({
      timestamp: r.timestamp,
      fault_class: fixture.fault,
    })),
  };
}
