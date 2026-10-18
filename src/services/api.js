import { request } from "./http";

import { validateReading, validateRecords } from "./validation";

import { numeric } from "./dataset";

const rawKeys = [
  "temp_c",
  "ax_m_s2",
  "ay_m_s2",
  "az_m_s2",
  "current_dc_a",
  "current_rms_a",
];

export function normalizeLive(value) {
  if (!value || !Array.isArray(value.readings))
    throw new Error("Live API must provide a readings array.");

  return {
    rows: value.readings.map((r, i) =>
      validateReading({ ...r, reading_index: r.reading_index ?? i + 1 }),
    ),
    physical: Object.fromEntries(
      rawKeys.map((k) => [
        k,
        k.startsWith("current_") && numeric(value.physical?.adc_clipped) === 1
          ? null
          : numeric(value.physical?.[k]),
      ]),
    ),
    physicalTimestamp:
      typeof value.physical?.timestamp === "string" &&
      Number.isFinite(Date.parse(value.physical.timestamp))
        ? value.physical.timestamp
        : null,
  };
}

export async function loadSnapshot(base, signal) {
  return normalizeLive(await request("/api/monitoring", { base, signal }));
}

export function subscribe(url, interval, onData, onError) {
  if (!url) return () => {};
  let socket,
    timer,
    stopped = false;
  function connect() {
    try {
      socket = new WebSocket(url);
    } catch {
      onError("Invalid WebSocket URL.");
      return;
    }
    socket.onmessage = (e) => {
      try {
        onData(normalizeLive(JSON.parse(e.data)));
      } catch (error) {
        onError(error.message);
      }
    };
    socket.onerror = () =>
      onError("WebSocket unavailable; using REST fallback.");
    socket.onclose = () => {
      if (!stopped) timer = setTimeout(connect, interval);
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

export async function loadMaintenance(base) {
  return validateRecords(await request("/api/maintenance", { base }));
}

export async function addMaintenance(record, base) {
  return validateRecords([
    await request("/api/maintenance", {
      method: "POST",
      body: record,
      base,
    }),
  ])[0];
}

export async function updateMaintenance(id, status, base) {
  return request(`/api/maintenance/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status },
    base,
  });
}
