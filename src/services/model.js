import { request } from "./http";
import { modelPayload } from "./dataset";
import { validateModelBatch } from "./validation";
export async function predictDataset(rows, id, base, signal) {
  const payload = modelPayload(rows, id);
  if (!payload.rows.length)
    throw new Error(
      "No complete 11-feature rows are available for this model.",
    );
  const response = await request("/api/model/predict", {
    method: "POST",
    body: payload,
    base,
    signal,
  });
  return validateModelBatch(response, id, rows);
}
