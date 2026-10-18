import { FEATURE_KEYS } from "../data/config.js";
// Exact whitelist. Labels (including condition) never enter normalized data or requests.
export function numeric(value) {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
export function featureRow(raw, index) {
  return {
    reading_index: index,
    timestamp:
      typeof raw.timestamp === "string" &&
      /^\d{4}-\d{2}-\d{2}T/.test(raw.timestamp) &&
      Number.isFinite(Date.parse(raw.timestamp))
        ? raw.timestamp
        : null,
    ...Object.fromEntries(FEATURE_KEYS.map((k) => [k, numeric(raw[k])])),
  };
}
export function parseCSV(text) {
  const matrix = [];
  let row = [],
    field = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (!quoted && field.length)
        throw new Error("Malformed quoted CSV field.");
      else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((v) => v.trim())) matrix.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw new Error("Unclosed CSV quotation.");
  row.push(field);
  if (row.some((v) => v.trim())) matrix.push(row);
  if (matrix.length < 2)
    throw new Error("CSV must contain a header and at least one reading.");
  const headers = matrix.shift().map((h) => h.trim());
  if (new Set(headers).size !== headers.length)
    throw new Error("Duplicate CSV column names.");
  if (!FEATURE_KEYS.some((k) => headers.includes(k)))
    throw new Error("No supported dataset parameters found.");
  const warnings = [];
  const rows = matrix.map((cells, i) => {
    if (cells.length !== headers.length)
      throw new Error(
        `CSV reading ${i + 1}: column count does not match the header.`,
      );
    const raw = Object.fromEntries(headers.map((h, j) => [h, cells[j]]));
    const result = featureRow(raw, i + 1);
    if (
      FEATURE_KEYS.some(
        (k) =>
          headers.includes(k) && raw[k].trim() !== "" && result[k] === null,
      )
    )
      warnings.push(
        `Reading ${i + 1}: invalid numeric values shown as unavailable.`,
      );
    return result;
  });
  const missing = FEATURE_KEYS.filter((k) => !headers.includes(k));
  return {
    rows,
    missing,
    warnings,
    ignored: headers.filter(
      (k) => !FEATURE_KEYS.includes(k) && k !== "timestamp",
    ),
    hasTimestamps: rows.every((r) => r.timestamp !== null),
  };
}
export function modelPayload(rows, datasetId) {
  return {
    dataset_id: datasetId,
    features: [...FEATURE_KEYS],
    rows: rows
      .filter((r) => FEATURE_KEYS.every((k) => Number.isFinite(r[k])))
      .map((r) => ({
        reading_index: r.reading_index,
        values: FEATURE_KEYS.map((k) => r[k]),
      })),
  };
}
export function readingLabel(row) {
  return !row
    ? "Not available"
    : row.timestamp
      ? new Date(row.timestamp).toLocaleString()
      : `Reading ${row.reading_index}`;
}
