# MechMedic update notes

The existing React/Vite application was modified in place. Authentication, sidebar, eight routes, native dialogs, Three.js controls and PDF export were retained. No second application was created.

## Page changes

| Page | Changes |
|---|---|
| Home | Exact equipment name, subtitle, four summaries. Duplicate quick-navigation cards removed following feedback. Removed detailed sensors, charts, model breakdown, alert history and 3D scene from Home. CSV controls are collapsible. |
| Live Sensor Data | Eleven dataset features grouped into speed, vibration, temperature and electrical monitoring; units, latest reading, source, sparklines and unit-separated comparison charts. |
| Health Score | Isolation Forest score, decision threshold/status, optional backend-derived indicator, trend and historical detection status. No frontend health formula or fabricated LSTM maintenance estimate. |
| Digital Twin | Green vertical engine, blue cylindrical coupling, grey dynamometer, left cabinet, shared black frame and right enclosure. Four numbered clickable/keyboard-accessible component markers. No unverified dataset-to-sensor mappings. |
| Alert Feed | Actual validated anomaly results only, reading/score/source details, acknowledgement and filtering. Acknowledgements are browser-local. |
| Maintenance Log | Preserved manual add/search/filter/view/PDF; added explicit manual Recorded/Acknowledged/Completed states. Old seeded demo records are excluded; manually entered records migrate. |
| Analytics | Selected-dataset trends, numerical distributions, correlations, anomaly scores/counts/history, recent/custom index or timestamp ranges. Missing timestamps are never invented. |
| Settings | Meaningful live/model/source settings, visible features, optional project-defined health colour bands, acknowledgement visibility, density and profile. |

## Technical corrections

- The canonical equipment name is **Computer-Based Single-Cylinder Four-Stroke Diesel Engine Test Rig**.
- Exact numerical model input order: speed_rpm, vib_rms_g, vib_peak_g, vib_kurtosis, vib_firing_band_g, vib_hf_band_g, temp_coolant_C, temp_oil_C, temp_block_C, temp_ambient_C, current_A.
- The condition column is excluded from normalized readings and model payloads. This frontend does not train models. Future training must enforce the same exclusion independently.
- Simulated Random Forest classifications and fake maintenance estimates are removed. No saved compatible Isolation Forest pipeline was found. A strict versioned integration contract is implemented; inference is disabled by default.
- DS18B20 is highest on the head, ADXL345 below it on the engine side, ESP32-C6 below that near the frame, and ACS712 at the far-right enclosure. ESP32-C6 has a collection role, not a measurement. CSV provenance remains unknown for those mounting locations.
- Live data is never substituted with synthetic values. Model results and source scope reset on source changes. Invalid/missing values stay unavailable.

## Integration still required

Trained Isolation Forest artifact plus matching preprocessing and backend inference; a validated health-score mapping; an actual maintenance/LSTM model; the ESP32-C6-to-backend/WebSocket bridge; production authentication and shared server storage for preferences/acknowledgements. Detailed endpoint contracts are in README.md.

The rig is explicitly a simplified visualization, not a validated physics-based twin. Dimensions and front/side/rear photographs plus mounting close-ups are needed for an accurate replacement model.

## Modified and added files

- `README.md`
- `public/datasets/Rig_sensor_dataset_16_30min.csv`
- `public/datasets/rig_sensor_dataset_15_20min.csv`
- `src/App.jsx`
- `src/components/DigitalTwin.jsx`
- `src/components/HistoryChart.jsx`
- `src/components/Predictions.jsx`
- `src/components/Records.jsx`
- `src/components/SensorCard.jsx`
- `src/components/Trends.jsx`
- `src/components/rigModel.js`
- `src/data/config.js`
- `src/data/demo.js`
- `src/hooks/useMonitoring.js`
- `src/hooks/useSettings.js`
- `src/pages/AnalyticsPage.jsx`
- `src/pages/HealthPage.jsx`
- `src/pages/MaintenancePage.jsx`
- `src/pages/SettingsPage.jsx`
- `src/services/analytics.js`
- `src/services/api.js`
- `src/services/dataset.js`
- `src/services/demoStore.js`
- `src/services/http.js`
- `src/services/model.js`
- `src/services/reports.js`
- `src/services/settings.js`
- `src/services/validation.js`
- `src/styles.css`
- `tests/browser-check.mjs`
- `tests/contracts.test.js`
- `tests/visual-check.mjs`

Additional verification/documentation files:

- `QA.md`
- `UPDATE_NOTES.md`
- `tests/live-check.mjs`
- `tests/updated-home.png`
- `tests/updated-twin.png`
- `tests/updated-mobile.png`
- `tests/updated-maintenance.pdf`
