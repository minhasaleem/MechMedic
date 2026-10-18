export const branding = {
  name: "MechMedic",
  tagline: "Keeping Machines One Step Ahead",
};
export const equipment = {
  name: "Computer-Based Single-Cylinder Four-Stroke Diesel Engine Test Rig",
};
export const POLL_MS = 5000;
export const REQUEST_TIMEOUT_MS = 8000;
export const STALE_MS = POLL_MS * 4;
const parameter = (key, name, unit, group, icon, color, derived = false) => ({
  key,
  name,
  unit,
  group,
  icon,
  color,
  derived,
});
export const measurements = [
  parameter(
    "speed_rpm",
    "Engine Speed",
    "RPM",
    "Engine Speed",
    "activity",
    "#75b7ff",
  ),
  parameter(
    "vib_rms_g",
    "RMS Vibration",
    "g",
    "Vibration Analysis",
    "activity",
    "#49dab7",
    true,
  ),
  parameter(
    "vib_peak_g",
    "Peak Vibration",
    "g",
    "Vibration Analysis",
    "activity",
    "#76a7ff",
    true,
  ),
  parameter(
    "vib_kurtosis",
    "Vibration Kurtosis",
    "",
    "Vibration Analysis",
    "activity",
    "#c397fa",
    true,
  ),
  parameter(
    "vib_firing_band_g",
    "Firing Frequency Band",
    "g",
    "Vibration Analysis",
    "activity",
    "#e6ba76",
    true,
  ),
  parameter(
    "vib_hf_band_g",
    "High-Frequency Vibration",
    "g",
    "Vibration Analysis",
    "activity",
    "#ee8fa9",
    true,
  ),
  parameter(
    "temp_coolant_C",
    "Coolant Temperature",
    "°C",
    "Temperature Monitoring",
    "thermometer",
    "#edb16a",
  ),
  parameter(
    "temp_oil_C",
    "Oil Temperature",
    "°C",
    "Temperature Monitoring",
    "thermometer",
    "#f08a7a",
  ),
  parameter(
    "temp_block_C",
    "Engine Block Temperature",
    "°C",
    "Temperature Monitoring",
    "thermometer",
    "#c397fa",
  ),
  parameter(
    "temp_ambient_C",
    "Ambient Temperature",
    "°C",
    "Temperature Monitoring",
    "thermometer",
    "#76a7ff",
  ),
  parameter(
    "current_A",
    "Current",
    "A",
    "Electrical Monitoring",
    "zap",
    "#49dab7",
  ),
];
export const FEATURE_KEYS = measurements.map((m) => m.key);
export const GROUPS = [...new Set(measurements.map((m) => m.group))];
export const sourceNames = {
  demo: "Demo Data",
  csv: "CSV Data",
  live: "Live Sensor Data",
};
export const CSV_FILES = [
  {
    name: "Rig sensor dataset · 16 · 30 min",
    url: "/datasets/Rig_sensor_dataset_16_30min.csv",
  },
  {
    name: "Rig sensor dataset · 15 · 20 min",
    url: "/datasets/rig_sensor_dataset_15_20min.csv",
  },
];
export const defaultSettings = {
  connection: {
    apiBase: import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000",
    wsUrl: import.meta.env?.VITE_WS_URL || "",
    pollMs: POLL_MS,
  },
  model: { enabled: false },
  health: { healthyMin: null, warningMin: null },
  alerts: { showAcknowledged: true },
  dashboard: { compact: false },
  parameters: FEATURE_KEYS,
};
export function healthState(score, bands = {}) {
  if (!Number.isFinite(score))
    return { label: "Not available", tone: "", color: "#6f8599" };
  if (!Number.isFinite(bands.healthyMin) || !Number.isFinite(bands.warningMin))
    return {
      label: "Indicator available · bands unset",
      tone: "",
      color: "#76a7ff",
    };
  if (score >= bands.healthyMin)
    return { label: "Project band: green", tone: "mint", color: "#49dab7" };
  if (score >= bands.warningMin)
    return { label: "Project band: amber", tone: "amber", color: "#edb16a" };
  return { label: "Project band: red", tone: "red", color: "#ef7185" };
}
export const markerDefinitions = {
  ds18b20: {
    name: "DS18B20 – Engine Head Temperature",
    location: "Upper green engine, visible cylinder-head mounting surface.",
    role: "Measures temperature at the head mounting location.",
    position: [-0.53, 1.94, 0.46],
    color: "#edb16a",
    fields: [["temp_c", "Engine head temperature", "°C"]],
  },
  adxl345: {
    name: "ADXL345 – Engine Vibration",
    location:
      "Middle-to-lower engine side, directly below the temperature sensor.",
    role: "Measures acceleration; RMS, peaks, kurtosis and frequency bands require a defined feature pipeline.",
    position: [-0.53, 1.32, 0.55],
    color: "#49dab7",
    fields: [
      ["ax_m_s2", "Acceleration X", "m/s²"],
      ["ay_m_s2", "Acceleration Y", "m/s²"],
      ["az_m_s2", "Acceleration Z", "m/s²"],
    ],
  },
  esp32: {
    name: "ESP32-C6 – Data Collection",
    location: "Lower green engine/support frame, below the vibration sensor.",
    role: "Microcontroller: collects sensor readings and transmits data. Does not measure engine parameters itself.",
    position: [-0.53, 0.63, 0.56],
    color: "#c397fa",
    fields: [],
  },
  acs712: {
    name: "ACS712 – Electrical Current",
    location: "Far-right blue electrical/control enclosure.",
    role: "Measures current in the monitored circuit. Internal wiring and excitation terminals are not asserted.",
    position: [2.13, 1.1, 1.03],
    color: "#76a7ff",
    fields: [
      ["current_dc_a", "DC current", "A"],
      ["current_rms_a", "RMS current", "A"],
    ],
  },
};
