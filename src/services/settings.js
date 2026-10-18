import { defaultSettings, FEATURE_KEYS } from "../data/config.js";

export function validateSettings(value) {
  if (
    !value?.connection ||
    !value.health ||
    !value.model ||
    !Array.isArray(value.parameters)
  )
    throw new Error("Invalid configuration.");

  const url = new URL(value.connection.apiBase);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Use an HTTP(S) backend URL without credentials.");

  if (value.connection.wsUrl) {
    const ws = new URL(value.connection.wsUrl);
    if (!["ws:", "wss:"].includes(ws.protocol) || ws.username || ws.password)
      throw new Error("Use a WS(S) URL without credentials.");
  }

  if (
    !Number.isInteger(value.connection.pollMs) ||
    value.connection.pollMs < 1000 ||
    value.connection.pollMs > 60000
  )
    throw new Error("Update interval must be 1000–60000 milliseconds.");

  const { healthyMin, warningMin } = value.health;
  if ((healthyMin === null) !== (warningMin === null))
    throw new Error("Set both health bands, or leave both unset.");

  if (
    healthyMin !== null &&
    (!Number.isFinite(healthyMin) ||
      !Number.isFinite(warningMin) ||
      warningMin < 0 ||
      healthyMin > 100 ||
      warningMin >= healthyMin)
  )
    throw new Error("Health bands must satisfy 0 ≤ amber < green ≤ 100.");

  if (
    typeof value.model.enabled !== "boolean" ||
    typeof value.alerts?.showAcknowledged !== "boolean" ||
    typeof value.dashboard?.compact !== "boolean"
  )
    throw new Error("Invalid monitoring preferences.");

  if (
    !value.parameters.length ||
    value.parameters.some((k) => !FEATURE_KEYS.includes(k))
  )
    throw new Error("Select at least one supported parameter.");
  return value;
}

const key = (id) => `mechmedic.settings.v3.${id}`;

export async function loadSettings(id) {
  try {
    return validateSettings(
      JSON.parse(localStorage.getItem(key(id))) ||
        structuredClone(defaultSettings),
    );
  } catch {
    return structuredClone(defaultSettings);
  }
}

export async function saveSettings(id, _mode, value) {
  validateSettings(value);
  localStorage.setItem(key(id), JSON.stringify(value));
  return value;
}
