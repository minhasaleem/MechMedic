import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCSV, modelPayload } from "../src/services/dataset.js";
import {
  FEATURE_KEYS,
  healthState,
  defaultSettings,
  markerDefinitions,
} from "../src/data/config.js";
import {
  validateModelBatch,
  validatePrediction,
} from "../src/services/validation.js";
import { validateSettings } from "../src/services/settings.js";
import { histogram, correlation } from "../src/services/analytics.js";
import { createDemoSnapshot } from "../src/data/demo.js";
const csv = readFileSync(
  new URL(
    "../public/datasets/rig_sensor_dataset_15_20min.csv",
    import.meta.url,
  ),
  "utf8",
);
const parsed = parseCSV(csv);
test("actual CSV: eleven inputs; condition does not affect readings or requests", () => {
  assert.equal(FEATURE_KEYS.length, 11);
  assert.ok(parsed.rows.length > 1);
  assert.equal(parsed.rows[0].speed_rpm, 992);
  assert.equal(parsed.rows[0].timestamp, null);
  assert.equal(parsed.rows[0].reading_index, 1);
  assert.ok(!("condition" in parsed.rows[0]));
  const changed = parseCSV(csv.replaceAll("healthy", "totally-different"));
  assert.deepEqual(changed.rows, parsed.rows);
  assert.deepEqual(
    modelPayload(changed.rows, "x"),
    modelPayload(parsed.rows, "x"),
  );
  assert.equal(modelPayload(parsed.rows, "x").rows[0].values.length, 11);
});
test("missing numeric values remain missing, not zero or predicted", () => {
  const d = parseCSV("speed_rpm,current_A,condition\n1000,,fault");
  assert.equal(d.rows[0].current_A, null);
  assert.equal(d.rows[0].temp_block_C, null);
  assert.equal(modelPayload(d.rows, "partial").rows.length, 0);
  assert.throws(() => parseCSV("condition\nhealthy"));
  assert.throws(() => parseCSV("speed_rpm,speed_rpm\n1,2"));
  assert.throws(() => parseCSV("speed_rpm,current_A\n1"));
});
const output = {
  algorithm: "IsolationForest",
  model_version: "test-pipeline",
  reading_index: 1,
  status: "anomaly",
  anomaly_score: -0.12,
  decision_threshold: 0,
};
test("model contract validates provenance, scope, and score mapping", () => {
  assert.equal(
    validateModelBatch({ dataset_id: "x", results: [output] }, "x", parsed.rows)
      .length,
    1,
  );
  assert.throws(() =>
    validateModelBatch(
      { dataset_id: "other", results: [output] },
      "x",
      parsed.rows,
    ),
  );
  assert.throws(() =>
    validateModelBatch(
      { dataset_id: "x", results: [output, output] },
      "x",
      parsed.rows,
    ),
  );
  assert.throws(() =>
    validatePrediction({ ...output, algorithm: "RandomForest" }),
  );
  assert.throws(() => validatePrediction({ ...output, health_indicator: 82 }));
  assert.equal(
    validatePrediction({
      ...output,
      health_indicator: 0,
      health_mapping: "Documented backend mapping",
    }).health_indicator,
    0,
  );
});
test("demo has only synthetic readings, with no fabricated predictions", () => {
  const d = createDemoSnapshot();
  assert.ok(d.rows.length);
  assert.equal(d.prediction, undefined);
  assert.equal(d.alerts, undefined);
  assert.equal(healthState(null).label, "Not available");
  assert.equal(healthState(82).tone, "");
});
test("configurable project bands and meaningful settings", () => {
  assert.equal(healthState(20, { healthyMin: 80, warningMin: 40 }).tone, "red");
  assert.equal(
    validateSettings(structuredClone(defaultSettings)).connection.pollMs,
    5000,
  );
  assert.throws(() =>
    validateSettings({
      ...defaultSettings,
      health: { healthyMin: 40, warningMin: 80 },
    }),
  );
});
test("histograms conserve counts; missing/constant correlation unavailable", () => {
  assert.equal(
    histogram([1, 1, 2, 4, null, NaN]).reduce((s, r) => s + r.count, 0),
    4,
  );
  assert.equal(
    correlation(
      [
        { a: 1, b: 3 },
        { a: 2, b: 6 },
      ],
      "a",
      "b",
    ),
    1,
  );
  assert.equal(
    correlation(
      [
        { a: 1, b: 2 },
        { a: 1, b: 3 },
      ],
      "a",
      "b",
    ),
    null,
  );
});
test("installation markers reflect ordering and do not alias dataset features", () => {
  assert.ok(
    markerDefinitions.ds18b20.position[1] >
      markerDefinitions.adxl345.position[1],
  );
  assert.ok(
    markerDefinitions.adxl345.position[1] > markerDefinitions.esp32.position[1],
  );
  assert.ok(markerDefinitions.acs712.position[0] > 1);
  assert.equal(markerDefinitions.esp32.fields.length, 0);
  assert.deepEqual(
    markerDefinitions.ds18b20.fields.map((f) => f[0]),
    ["temp_c"],
  );
});
