import test from "node:test";
import assert from "node:assert/strict";
import {
  validateReading,
  validatePrediction,
  validateRecords,
  validateSeries,
} from "../src/services/validation.js";
import {
  createDemoSnapshot,
  createDemoAnalytics,
  createDemoRecords,
} from "../src/data/demo.js";
import {
  healthState,
  readingState,
  defaultSettings,
  POLL_MS,
} from "../src/data/config.js";
test("central demo service produces exactly five measured fields at configured cadence", () => {
  const data = createDemoSnapshot(1800000000000);
  assert.equal(data.history.length, 721);
  assert.equal(
    Date.parse(data.history[1].timestamp) -
      Date.parse(data.history[0].timestamp),
    POLL_MS,
  );
  assert.deepEqual(Object.keys(data.latest).sort(), [
    "current",
    "temperature",
    "timestamp",
    "vibration_x",
    "vibration_y",
    "vibration_z",
  ]);
  data.history.forEach(validateReading);
  validatePrediction(data.prediction);
});
test("synthetic scenarios exercise all health colours, without a component calculation", () => {
  assert.equal(
    healthState(
      createDemoSnapshot(1800000000000, "healthy").prediction.health_score,
    ).label,
    "Healthy",
  );
  assert.equal(
    healthState(
      createDemoSnapshot(1800000000000, "warning").prediction.health_score,
    ).tone,
    "amber",
  );
  assert.equal(
    healthState(
      createDemoSnapshot(1800000000000, "critical").prediction.health_score,
    ).tone,
    "red",
  );
  assert.equal(healthState(null).label, "Unavailable");
  assert.equal(healthState(70).tone, "mint");
  assert.equal(healthState(40).tone, "amber");
  assert.equal(healthState(0).tone, "red");
});
test("invalid readings and ML outputs are rejected; zero outputs remain valid", () => {
  const reading = createDemoSnapshot().latest;
  assert.throws(() => validateReading({ ...reading, current: "4.1" }));
  assert.throws(() => validateReading({ ...reading, timestamp: "invalid" }));
  assert.throws(() => validateReading({ ...reading, vibration_z: NaN }));
  const value = {
    timestamp: new Date().toISOString(),
    fault_class: 0,
    health_score: 0,
    maintenance_hours: 0,
  };
  assert.equal(validatePrediction(value), value);
  assert.throws(() => validatePrediction({ ...value, health_score: 101 }));
  assert.throws(() => validatePrediction({ ...value, fault_class: 4 }));
  assert.throws(() => validatePrediction({ ...value, maintenance_hours: -1 }));
});
test("record contracts reject malformed acknowledgement state and missing fields", () => {
  assert.deepEqual(validateRecords([], "alerts"), []);
  assert.throws(() =>
    validateRecords(
      [{ id: "1", message: "Test", timestamp: "invalid" }],
      "alerts",
    ),
  );
  const record = createDemoRecords().alerts[0];
  assert.throws(() =>
    validateRecords([{ ...record, acknowledged: "yes" }], "alerts"),
  );
  assert.throws(() => validateRecords([{ ...record, source: {} }], "alerts"));
});
test("unconfigured thresholds do not imply normal; configured boundaries compare inclusively", () => {
  assert.equal(
    readingState(100, defaultSettings.thresholds.temperature).label,
    "No limits set",
  );
  assert.equal(
    readingState(10, { warningHigh: 5, criticalHigh: 10 }).tone,
    "red",
  );
  assert.equal(
    readingState(5, { warningHigh: 5, criticalHigh: 10 }).tone,
    "amber",
  );
  assert.equal(readingState(null, {}).label, "No data");
});
test("demo analytics obey requested range and do not generate future data", () => {
  const now = 1800000000000;
  const result = createDemoAnalytics(now - 3600000, now, "healthy", now);
  assert.ok(result.history.length > 1);
  assert.ok(
    result.history.every(
      (r) =>
        Date.parse(r.timestamp) >= now - 3600000 &&
        Date.parse(r.timestamp) <= now,
    ),
  );
  assert.deepEqual(
    createDemoAnalytics(now + 1000, now + 2000, "healthy", now).history,
    [],
  );
  assert.equal(
    validateSeries(result.healthHistory, "health").length,
    result.healthHistory.length,
  );
});
