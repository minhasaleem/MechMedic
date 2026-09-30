import { defaultSettings, measurements } from "../data/config";
import { request } from "./http";
function key(userId) {
  return `mechmedic.settings.${userId}`;
}
export function validateSettings(value) {
  if (
    !value?.thresholds ||
    !value.alerts ||
    !value.notifications ||
    !value.dashboard
  )
    throw new Error("Incomplete settings response.");
  for (const [group, keys] of [
    ["alerts", ["warning", "critical"]],
    ["notifications", ["email", "sms", "whatsapp"]],
    ["dashboard", ["compact", "symbolicEffect"]],
  ])
    for (const key of keys)
      if (typeof value[group][key] !== "boolean")
        throw new Error("Invalid settings preference.");
  if (
    ![
      "home",
      "sensors",
      "health",
      "twin",
      "alerts",
      "maintenance",
      "analytics",
    ].includes(value.dashboard.defaultPage)
  )
    throw new Error("Invalid preferred page.");
  for (const m of measurements) {
    const t = value.thresholds[m.key];
    for (const n of [t.warningHigh, t.criticalHigh])
      if (n != null && !Number.isFinite(n))
        throw new Error(`${m.name}: enter valid numeric limits.`);
    if (
      t.warningHigh != null &&
      t.criticalHigh != null &&
      t.warningHigh >= t.criticalHigh
    )
      throw new Error(`${m.name}: critical must be greater than warning.`);
  }
  return value;
}
export async function loadSettings(userId, mode) {
  if (mode === "live") return validateSettings(await request("/api/settings"));
  try {
    return validateSettings(
      JSON.parse(localStorage.getItem(key(userId))) ||
        structuredClone(defaultSettings),
    );
  } catch {
    return structuredClone(defaultSettings);
  }
}
export async function saveSettings(userId, mode, value) {
  validateSettings(value);
  if (mode === "live")
    return request("/api/settings", { method: "PUT", body: value });
  localStorage.setItem(key(userId), JSON.stringify(value));
  return value;
}
