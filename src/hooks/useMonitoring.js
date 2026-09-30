import { useEffect, useRef, useState } from "react";
import { createDemoSnapshot } from "../data/demo";
import { POLL_MS, STALE_MS } from "../data/config";
import {
  loadSnapshot,
  subscribe,
  acknowledgeAlert,
  addMaintenance,
} from "../services/api";
import { readDemoRecords, writeDemoRecords } from "../services/demoStore";
const empty = {
  latest: null,
  history: [],
  prediction: null,
  alerts: [],
  maintenance: [],
  healthHistory: [],
  classificationHistory: [],
  issues: [],
};
export function useMonitoring(mode, scenario, user) {
  const [data, setData] = useState(empty),
    [status, setStatus] = useState("connecting"),
    [error, setError] = useState(""),
    [now, setNow] = useState(Date.now());
  const modeRef = useRef(mode);
  modeRef.current = mode;
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), POLL_MS);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true,
      timer,
      controller;
    setError("");
    if (mode === "demo") {
      const update = () => {
        const snapshot = createDemoSnapshot(Date.now(), scenario);
        if (active) setData({ ...snapshot, ...readDemoRecords(user.id) });
      };
      update();
      setStatus("demo");
      timer = setInterval(update, POLL_MS);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }
    setData(empty);
    setStatus("connecting");
    async function refresh() {
      const started = Date.now();
      controller = new AbortController();
      try {
        const result = await loadSnapshot(controller.signal);
        if (active) {
          setData((prev) => ({
            ...result,
            latest: result.latest || prev.latest,
          }));
          setStatus(result.latest ? "connected" : "disconnected");
          setError(
            result.latest
              ? ""
              : "Sensor feed unavailable. Last received readings may be shown.",
          );
        }
      } catch (e) {
        if (active) {
          setStatus("disconnected");
          setError(e.message);
        }
      } finally {
        if (active)
          timer = setTimeout(
            refresh,
            Math.max(0, POLL_MS - (Date.now() - started)),
          );
      }
    }
    refresh();
    const stop = subscribe(
      (message) => {
        if (!active) return;
        if (message.type === "reading") {
          setStatus("connected");
          setError("");
        }
        setData((prev) => {
          if (message.type === "reading")
            return {
              ...prev,
              latest: message.data,
              history: [
                ...prev.history.filter(
                  (r) => r.timestamp !== message.data.timestamp,
                ),
                message.data,
              ]
                .sort(
                  (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
                )
                .slice(-721),
            };
          if (message.type === "prediction")
            return {
              ...prev,
              prediction: message.data,
              healthHistory: message.data
                ? [...prev.healthHistory, message.data].slice(-721)
                : prev.healthHistory,
            };
          return {
            ...prev,
            alerts: [
              message.data,
              ...prev.alerts.filter((a) => a.id !== message.data.id),
            ],
          };
        });
      },
      (message) => {
        if (active) setError(message);
      },
    );
    return () => {
      active = false;
      clearTimeout(timer);
      controller?.abort();
      stop();
    };
  }, [mode, scenario, user.id]);
  const acknowledge = async (id) => {
    if (mode === "demo") {
      const records = readDemoRecords(user.id);
      records.alerts = records.alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              acknowledged: true,
              acknowledged_by: user.name,
              acknowledged_at: new Date().toISOString(),
            }
          : a,
      );
      writeDemoRecords(user.id, records);
      setData((prev) => ({ ...prev, ...records }));
    } else {
      const record = await acknowledgeAlert(id);
      if (modeRef.current === mode)
        setData((prev) => ({
          ...prev,
          alerts: prev.alerts.map((a) => (a.id === id ? record : a)),
        }));
    }
  };
  const addRecord = async (record) => {
    if (mode === "demo") {
      const records = readDemoRecords(user.id);
      records.maintenance.unshift({ ...record, id: crypto.randomUUID() });
      writeDemoRecords(user.id, records);
      setData((prev) => ({ ...prev, ...records }));
    } else {
      const result = await addMaintenance(record);
      if (modeRef.current === mode)
        setData((prev) => ({
          ...prev,
          maintenance: [result, ...prev.maintenance],
        }));
    }
  };
  const stale =
    mode === "live" &&
    data.latest &&
    now - Date.parse(data.latest.timestamp) > STALE_MS;
  const predictionStale =
    mode === "live" &&
    data.prediction &&
    now - Date.parse(data.prediction.timestamp) > STALE_MS;
  return {
    ...data,
    status: stale && status === "connected" ? "stale" : status,
    error,
    stale,
    predictionStale,
    now,
    acknowledge,
    addRecord,
  };
}
