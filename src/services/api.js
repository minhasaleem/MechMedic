import {
  validateReading,
  validatePrediction,
  validateRecords,
  validateSeries,
} from "./validation";
import { request } from "./http";
import { POLL_MS } from "../data/config";
export async function loadSnapshot(signal) {
  const paths = [
    "/api/latest",
    "/api/history",
    "/api/health",
    "/api/alerts",
    "/api/maintenance",
    "/api/health-history",
    "/api/classification-history",
  ];
  const results = await Promise.allSettled(
    paths.map((path) => request(path, { signal })),
  );
  const issues = [];
  function read(index, validate, fallback) {
    try {
      if (results[index].status === "rejected") throw results[index].reason;
      return validate(results[index].value);
    } catch (error) {
      issues.push(`${paths[index]} unavailable: ${error.message}`);
      return fallback;
    }
  }
  const latest = read(0, validateReading, null);
  return {
    latest,
    history: read(1, (v) => validateSeries(v, "sensor"), []),
    prediction: read(2, validatePrediction, null),
    alerts: read(3, (v) => validateRecords(v, "alerts"), []),
    maintenance: read(4, (v) => validateRecords(v, "maintenance"), []),
    healthHistory: read(5, (v) => validateSeries(v, "health"), []),
    classificationHistory: read(
      6,
      (v) => validateSeries(v, "classification"),
      [],
    ),
    issues,
  };
}
export function subscribe(onEvent, onError) {
  if (!import.meta.env.VITE_WS_URL) return () => {};
  let socket,
    timer,
    stopped = false;
  function connect() {
    try {
      socket = new WebSocket(import.meta.env.VITE_WS_URL);
    } catch {
      onError("Invalid WebSocket URL; using REST polling.");
      return;
    }
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "reading")
          onEvent({ type: "reading", data: validateReading(message.data) });
        else if (message.type === "prediction")
          onEvent({
            type: "prediction",
            data: validatePrediction(message.data),
          });
        else if (message.type === "alert")
          onEvent({
            type: "alert",
            data: validateRecords([message.data], "alerts")[0],
          });
      } catch (error) {
        onError(error.message);
      }
    };
    socket.onerror = () =>
      onError("WebSocket unavailable; using REST polling.");
    socket.onclose = () => {
      if (!stopped) timer = setTimeout(connect, POLL_MS);
    };
  }
  connect();
  return () => {
    stopped = true;
    clearTimeout(timer);
    if (socket) {
      socket.onclose = null;
      socket.close();
    }
  };
}
export async function acknowledgeAlert(id) {
  return validateRecords(
    [
      await request(`/api/alerts/${encodeURIComponent(id)}/acknowledge`, {
        method: "POST",
      }),
    ],
    "alerts",
  )[0];
}
export async function addMaintenance(record) {
  return validateRecords(
    [await request("/api/maintenance", { method: "POST", body: record })],
    "maintenance",
  )[0];
}
export async function loadAnalytics(from, to, signal) {
  const result = await request(
    `/api/analytics?from=${encodeURIComponent(new Date(from).toISOString())}&to=${encodeURIComponent(new Date(to).toISOString())}`,
    { signal },
  );
  return {
    history: validateSeries(result.history, "sensor"),
    healthHistory: validateSeries(result.healthHistory, "health"),
    classificationHistory: validateSeries(
      result.classificationHistory,
      "classification",
    ),
    alerts: validateRecords(result.alerts, "alerts"),
    maintenance: validateRecords(result.maintenance, "maintenance"),
  };
}
