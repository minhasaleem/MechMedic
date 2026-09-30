export function validateReading(value) {
  if (!value || !Number.isFinite(Date.parse(value.timestamp)))
    throw new Error("Sensor response needs a valid timestamp.");
  for (const key of [
    "vibration_x",
    "vibration_y",
    "vibration_z",
    "temperature",
    "current",
  ])
    if (!Number.isFinite(value[key]))
      throw new Error(`Sensor response needs numeric ${key}.`);
  return value;
}
export function validatePrediction(value) {
  if (value == null) return null;
  if (!Number.isFinite(Date.parse(value.timestamp)))
    throw new Error("Prediction needs a valid timestamp.");
  if (value.fault_class != null && ![0, 1, 2, 3].includes(value.fault_class))
    throw new Error("Invalid fault class.");
  if (
    value.health_score != null &&
    (!Number.isFinite(value.health_score) ||
      value.health_score < 0 ||
      value.health_score > 100)
  )
    throw new Error("Invalid model health score.");
  if (
    value.maintenance_hours != null &&
    (!Number.isFinite(value.maintenance_hours) || value.maintenance_hours < 0)
  )
    throw new Error("Invalid maintenance window.");
  return value;
}
export function validateRecords(value, kind) {
  if (!Array.isArray(value))
    throw new Error(`${kind} response must be an array.`);
  return value.map((row) => {
    if (
      !row ||
      typeof row.id !== "string" ||
      typeof row.message !== "string" ||
      !Number.isFinite(Date.parse(row.timestamp))
    )
      throw new Error(`Invalid ${kind} record.`);
    for (const field of [
      "source",
      "condition",
      "type",
      "technician",
      "notes",
      "acknowledged_by",
    ])
      if (row[field] != null && typeof row[field] !== "string")
        throw new Error(`Invalid ${kind} ${field}.`);
    if (
      kind === "alerts" &&
      row.acknowledged != null &&
      typeof row.acknowledged !== "boolean"
    )
      throw new Error("Invalid acknowledgement state.");
    return row;
  });
}
export function validateSeries(value, kind) {
  if (!Array.isArray(value)) throw new Error(`Invalid ${kind} history.`);
  return value
    .map(kind === "sensor" ? validateReading : validatePrediction)
    .filter(Boolean)
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}
