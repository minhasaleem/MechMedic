import { FEATURE_KEYS } from "../data/config.js";
import { featureRow } from "./dataset.js";
export function validateReading(value) {
  if (!value || typeof value !== "object") throw new Error("Invalid reading.");
  return featureRow(
    value,
    Number.isInteger(value.reading_index) ? value.reading_index : 1,
  );
}
export function validatePrediction(value) {
  if (
    !value ||
    value.algorithm !== "IsolationForest" ||
    typeof value.model_version !== "string" ||
    !value.model_version
  )
    throw new Error("Expected a versioned Isolation Forest result.");
  if (
    !Number.isInteger(value.reading_index) ||
    !["normal", "anomaly"].includes(value.status)
  )
    throw new Error("Invalid anomaly result.");
  if (
    !Number.isFinite(value.anomaly_score) ||
    !Number.isFinite(value.decision_threshold)
  )
    throw new Error("Model score and threshold are required.");
  if (
    value.health_indicator != null &&
    (!Number.isFinite(value.health_indicator) ||
      value.health_indicator < 0 ||
      value.health_indicator > 100 ||
      typeof value.health_mapping !== "string" ||
      !value.health_mapping.trim())
  )
    throw new Error(
      "A 0–100 indicator requires a backend-defined score mapping.",
    );
  return {
    reading_index: value.reading_index,
    algorithm: "IsolationForest",
    model_version: value.model_version,
    status: value.status,
    anomaly_score: value.anomaly_score,
    decision_threshold: value.decision_threshold,
    health_indicator: value.health_indicator ?? null,
    health_mapping: value.health_mapping ?? null,
  };
}
export function validateModelBatch(response, datasetId, rows) {
  if (response?.dataset_id !== datasetId || !Array.isArray(response.results))
    throw new Error("Model result does not match the selected dataset.");
  const allowed = new Set(
    rows
      .filter((r) => FEATURE_KEYS.every((k) => Number.isFinite(r[k])))
      .map((r) => r.reading_index),
  );
  const seen = new Set();
  return response.results.map((raw) => {
    const r = validatePrediction(raw);
    if (!allowed.has(r.reading_index) || seen.has(r.reading_index))
      throw new Error("Unexpected or duplicate model reading index.");
    seen.add(r.reading_index);
    return r;
  });
}
export function validateRecords(rows) {
  if (!Array.isArray(rows)) throw new Error("Expected record array.");
  return rows.map((r) => {
    if (typeof r.id !== "string" || typeof r.message !== "string")
      throw new Error("Invalid record.");
    return r;
  });
}
