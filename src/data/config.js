export const branding = {
  name: "MechMedic",
  tagline: "Keeping Machines One Step Ahead",
};
export const equipment = {
  name: "Diesel engine test rig",
  manufacturer: "Greaves",
  description: "Single-cylinder, four-stroke diesel engine",
  power: "3.7 kW",
  ratedSpeed: "1500 RPM",
};
export const POLL_MS = 5000; // Guide: sensor/dashboard delivery every five seconds.
export const REQUEST_TIMEOUT_MS = 4000;
export const STALE_MS = POLL_MS * 4; // Display freshness policy, not a fault threshold.
export const HEALTH_BANDS = { healthy: 70, warning: 40 }; // Revised guide, section 07.
export const faultClasses = [
  "Normal",
  "Minor Fault",
  "Moderate Fault",
  "Severe Fault",
];
export const sensors = [
  {
    id: "vibration",
    name: "Vibration",
    model: "ADXL345",
    location: "Engine block",
    unit: "g",
    icon: "activity",
    color: "#49dab7",
    channels: [
      { key: "vibration_x", label: "X axis", color: "#49dab7" },
      { key: "vibration_y", label: "Y axis", color: "#76a7ff" },
      { key: "vibration_z", label: "Z axis", color: "#c397fa" },
    ],
  },
  {
    id: "temperature",
    name: "Surface temperature",
    model: "DS18B20",
    location: "Exhaust manifold surface",
    unit: "°C",
    icon: "thermometer",
    color: "#edb16a",
    channels: [{ key: "temperature", label: "Temperature", color: "#edb16a" }],
  },
  {
    id: "current",
    name: "Current",
    model: "ACS712",
    location: "Dynamometer output cable",
    unit: "A",
    icon: "zap",
    color: "#76a7ff",
    channels: [{ key: "current", label: "Current", color: "#76a7ff" }],
  },
];
export const measurements = sensors.flatMap((s) =>
  s.channels.map((c) => ({
    ...s,
    key: c.key,
    name: s.id === "vibration" ? `Vibration ${c.label[0]}` : s.name,
    color: c.color,
  })),
);
export function healthState(score) {
  if (!Number.isFinite(score))
    return { label: "Unavailable", tone: "", color: "#6f8599" };
  if (score >= HEALTH_BANDS.healthy)
    return { label: "Healthy", tone: "mint", color: "#49dab7" };
  if (score >= HEALTH_BANDS.warning)
    return { label: "Degrading / Warning", tone: "amber", color: "#edb16a" };
  return { label: "Critical", tone: "red", color: "#ef7185" };
}
export const defaultSettings = {
  thresholds: Object.fromEntries(
    measurements.map((m) => [m.key, { warningHigh: null, criticalHigh: null }]),
  ),
  alerts: { warning: true, critical: true },
  notifications: { email: false, sms: false, whatsapp: false },
  dashboard: { defaultPage: "home", compact: false, symbolicEffect: true },
};
export function readingState(value, threshold) {
  if (!Number.isFinite(value)) return { label: "No data", tone: "" };
  if (threshold?.criticalHigh != null && value >= threshold.criticalHigh)
    return { label: "Critical limit", tone: "red" };
  if (threshold?.warningHigh != null && value >= threshold.warningHigh)
    return { label: "Warning limit", tone: "amber" };
  return {
    label:
      threshold?.warningHigh != null || threshold?.criticalHigh != null
        ? "Within set limits"
        : "No limits set",
    tone: "",
  };
}
