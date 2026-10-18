import { useEffect, useMemo, useState } from "react";

import { createDemoSnapshot } from "../data/demo";

import { readDemoRecords, writeDemoRecords } from "../services/demoStore";

import {
  loadSnapshot,
  subscribe,
  loadMaintenance,
  addMaintenance,
  updateMaintenance,
} from "../services/api";

import { predictDataset } from "../services/model";

import { sourceNames } from "../data/config";

const EMPTY_RESULTS = [];
export function useMonitoring(mode, dataset, user, settings) {
  const [snapshot, setSnapshot] = useState({ rows: [], physical: {} }),
    [connection, setConnection] = useState("idle"),
    [error, setError] = useState(""),
    [now, setNow] = useState(Date.now());

  const [results, setResults] = useState([]),
    [modelStatus, setModelStatus] = useState("Model not connected"),
    [records, setRecords] = useState([]),
    [recordError, setRecordError] = useState("");

  const [resultRows, setResultRows] = useState(null);
  const verifiedResults =
    resultRows === snapshot.rows && settings.model.enabled
      ? results
      : EMPTY_RESULTS;
  const [acks, setAcks] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(`mechmedic.ack.v3.${user.id}`)) || {}
      );
    } catch {
      return {};
    }
  });

  const id = mode === "csv" ? dataset?.id : mode;

  useEffect(() => {
    let active = true,
      timer,
      controller,
      lastSocketAt = 0;
    setSnapshot({ rows: [], physical: {} });
    setError("");
    setResults([]);

    if (mode === "csv") {
      setSnapshot({ rows: dataset?.rows || [], physical: {} });
      setConnection(dataset ? "loaded" : "No CSV loaded");
      return;
    }

    if (mode === "demo") {
      const tick = () => {
        setSnapshot({
          ...createDemoSnapshot(Date.now(), settings.connection.pollMs),
          physical: {},
        });
        setNow(Date.now());
      };
      tick();
      timer = setInterval(tick, settings.connection.pollMs);
      setConnection("demonstration");
      return () => clearInterval(timer);
    }

    setConnection("connecting");

    async function refresh() {
      controller = new AbortController();
      try {
        const data = await loadSnapshot(
          settings.connection.apiBase,
          controller.signal,
        );
        if (
          active &&
          Date.now() - lastSocketAt > settings.connection.pollMs * 2
        ) {
          setSnapshot(data);
          setConnection(data.rows.length ? "connected" : "No readings");
          setError("");
          setNow(Date.now());
        }
      } catch (e) {
        if (
          active &&
          Date.now() - lastSocketAt > settings.connection.pollMs * 2
        ) {
          setConnection("disconnected");
          setError(e.message);
        }
      } finally {
        if (active) timer = setTimeout(refresh, settings.connection.pollMs);
      }
    }

    refresh();
    const stop = subscribe(
      settings.connection.wsUrl,
      settings.connection.pollMs,
      (data) => {
        if (active) {
          lastSocketAt = Date.now();
          setSnapshot(data);
          setConnection("connected");
          setError("");
          setNow(Date.now());
        }
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
  }, [
    mode,
    dataset,
    settings.connection.apiBase,
    settings.connection.wsUrl,
    settings.connection.pollMs,
  ]);

  useEffect(() => {
    if (mode !== "live") return;
    const timer = setInterval(
      () => setNow(Date.now()),
      settings.connection.pollMs,
    );
    return () => clearInterval(timer);
  }, [settings.connection.pollMs, mode]);

  useEffect(() => {
    setResults([]);
    if (!settings.model.enabled || mode === "demo") {
      setModelStatus(
        mode === "demo"
          ? "No model inference in demo mode"
          : "Model not connected",
      );
      return;
    }
    if (!snapshot.rows.length) {
      setModelStatus("Awaiting readings");
      return;
    }
    let active = true;
    const controller = new AbortController();
    setModelStatus("Running Isolation Forest…");
    predictDataset(
      snapshot.rows,
      id,
      settings.connection.apiBase,
      controller.signal,
    )
      .then((values) => {
        if (active) {
          setResults(values);
          setResultRows(snapshot.rows);
          setModelStatus("Isolation Forest connected");
        }
      })
      .catch((e) => {
        if (active) setModelStatus(`Model not connected: ${e.message}`);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    snapshot.rows,
    id,
    mode,
    settings.model.enabled,
    settings.connection.apiBase,
  ]);

  useEffect(() => {
    let active = true;
    setRecords([]);
    setRecordError("");
    if (mode === "live") {
      loadMaintenance(settings.connection.apiBase)
        .then((r) => {
          if (active) setRecords(r);
        })
        .catch(() => {
          if (active) setRecordError("Maintenance service unavailable");
        });
    } else setRecords(readDemoRecords(user.id, mode).maintenance);
    return () => {
      active = false;
    };
  }, [mode, user.id, settings.connection.apiBase]);

  const latest = snapshot.rows.at(-1) || null;

  const stale =
    mode === "live" &&
    (connection !== "connected" ||
      !latest?.timestamp ||
      now - Date.parse(latest.timestamp) > settings.connection.pollMs * 4);

  const prediction =
    verifiedResults.find((r) => r.reading_index === latest?.reading_index) ||
    null;

  const alerts = useMemo(
    () =>
      verifiedResults
        .filter((r) => r.status === "anomaly")
        .map((r) => {
          const reading = snapshot.rows.find(
            (v) => v.reading_index === r.reading_index,
          );
          const identity =
            mode === "live" ? JSON.stringify(reading) : r.reading_index;
          const key = `${id}:${r.model_version}:${identity}`;
          return {
            ...r,
            id: key,
            source: sourceNames[mode],
            reading: snapshot.rows.find(
              (v) => v.reading_index === r.reading_index,
            ),
            acknowledged: !!acks[key],
            acknowledged_by: acks[key] || null,
          };
        }),
    [verifiedResults, id, mode, snapshot.rows, acks],
  );

  async function acknowledge(key) {
    const next = { ...acks, [key]: user.name };
    localStorage.setItem(`mechmedic.ack.v3.${user.id}`, JSON.stringify(next));
    setAcks(next);
  }

  async function addRecord(record) {
    if (mode === "live") {
      const saved = await addMaintenance(record, settings.connection.apiBase);
      setRecords((r) => [saved, ...r]);
    } else {
      const next = [{ ...record, id: crypto.randomUUID() }, ...records];
      writeDemoRecords(user.id, { maintenance: next }, mode);
      setRecords(next);
    }
  }

  async function updateRecord(key, status) {
    if (mode === "live") {
      await updateMaintenance(key, status, settings.connection.apiBase);
    }
    const next = records.map((r) => (r.id === key ? { ...r, status } : r));
    if (mode !== "live") writeDemoRecords(user.id, { maintenance: next }, mode);
    setRecords(next);
  }

  return {
    ...snapshot,
    latest,
    results: verifiedResults,
    prediction,
    modelStatus,
    alerts,
    maintenance: records,
    recordError,
    connection,
    error,
    stale,
    acknowledge,
    addRecord,
    updateRecord,
    source: sourceNames[mode],
  };
}
