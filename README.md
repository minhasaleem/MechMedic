# MechMedic

Keeping Machines One Step Ahead

Existing React/Vite dashboard updated in place for the Computer-Based Single-Cylinder Four-Stroke Diesel Engine Test Rig. Dark navy/teal styling, authentication, sidebar and eight routes are retained.

## Run

From `E:/mca/S3/MINIPROJECT/lab-monitor`:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5176/#login and keep the development terminal running. Use **Use demo credentials**, then **Sign In**. If port 5176 is already in use, the existing server may already be running; do not start another copy. `npm run build` creates `dist`; `npm run preview` previews the production build.

Demo login is a frontend demonstration, not production access control. Set `VITE_AUTH_MODE=backend` and implement the existing auth service endpoints and protected server APIs for real deployment.

## Pages

- `#home`: equipment identity, four summary cards. No charts or equipment visualization.
- `#sensors`: grouped parameter cards, sparklines and selectable comparisons separated by unit.
- `#health`: backend Isolation Forest score, threshold, decision, optional score-derived indicator and histories. Maintenance prediction remains unavailable.
- `#twin`: interactive simplified rig with numbered installation markers, rotate, zoom, reset and component details.
- `#alerts`: model anomalies, details, filtering and browser-local staff acknowledgement. No confirmed mechanical fault labels.
- `#maintenance`: manual records, search/type filter, details, manual acknowledgement/completion, PDF export. CSV/demo records are browser-local; live records use the backend.
- `#analytics`: selected rows, reading-index/time filters, sensor trends, histograms, Pearson correlation and model-result analysis.
- `#settings`: source/connection, model endpoint enablement, visible parameters, optional project-defined health bands, alert visibility, density and profile.

## Dataset mapping

| Keys | Units |
|---|---|
| speed_rpm | RPM |
| vib_rms_g, vib_peak_g, vib_firing_band_g, vib_hf_band_g | g |
| vib_kurtosis | dimensionless |
| temp_coolant_C, temp_oil_C, temp_block_C, temp_ambient_C | degrees Celsius |
| current_A | A |

`src/data/config.js` is the canonical ordered feature list. `src/services/dataset.js` parses CSV and retains only these numerical features plus reading index/valid timestamp metadata. **condition is discarded**; it never becomes a model input, target, prediction or health assessment. This frontend performs no training. Any future backend training pipeline must independently enforce the same whitelist and exclude condition as a target.

The two supplied CSV files are copied unchanged from `../lab-sensor/data_set/` to `public/datasets/`. Neither has timestamps, so charts use 1-based CSV reading indices. Missing/invalid values remain null; incomplete rows are not submitted to the model. Uploads accept up to 10 MB / 50,000 readings. Demo signals live only in `src/data/demo.js`; no synthetic model predictions or alerts are supplied.

## Isolation Forest integration

No trained Isolation Forest artifact and matching preprocessing pipeline were found in this project. Existing notebooks do not constitute a connected inference service. The UI therefore reports **Model not connected**, **Unknown**, and **Not available**. Old simulated Random Forest classes and LSTM estimates were removed.

Enable model integration in Settings only when the backend is available. `src/services/model.js` posts to `${apiBase}/api/model/predict`:

```json
{"dataset_id":"opaque-content-id","features":["the 11 ordered keys from config.js"],"rows":[{"reading_index":1,"values":["11 finite numbers in that order"]}]}
```

The response must echo dataset_id and return `results`. Each result requires:

```json
{"algorithm":"IsolationForest","model_version":"your-version","reading_index":1,"status":"normal","anomaly_score":0.12,"decision_threshold":0,"health_indicator":null,"health_mapping":null}
```

This is a schema example, not an equipment prediction. `status` is `normal` or `anomaly`; the backend must interpret its own score convention. Numeric score and threshold are mandatory. Optional health_indicator must be 0–100 and accompanied by a documented health_mapping string. The frontend never invents the transformation. Backend preprocessing must exactly match training: feature ordering, scaling and feature definitions. Return only indices sent in the request; mismatched/duplicate responses are rejected.

Health colour bands are optional, unset initially, and explicitly project-defined. They are display bands, not validated fault severity. No ML accuracy/confidence is asserted. Future maintenance/LSTM integration needs its own validated model, inputs and prediction contract; there is no RUL calculation in this UI.

## Live integration

`src/services/api.js` handles GET `/api/monitoring` and native WebSocket messages. Both accept complete history snapshots:

```json
{"readings":[{"reading_index":1,"timestamp":"2026-10-17T10:00:00Z","speed_rpm":null,"current_A":null}],"physical":{"timestamp":"2026-10-17T10:00:00Z","temp_c":null,"ax_m_s2":null,"ay_m_s2":null,"az_m_s2":null,"current_dc_a":null,"current_rms_a":null,"adc_clipped":0}}
```

Use real ISO timestamps only when available and stable unique reading indices. Missing fields stay unavailable. Physical keys follow the existing ESP32-C6 firmware/logger; acceleration is m/s², temperature °C and current A. Clipped ADC current is unavailable. The backend bridge must establish calibration, freshness and provenance. Dataset current_A is not automatically aliased to DC or RMS current; derived vibration features and temperature locations require a verified feature pipeline.

Polling defaults to 5 seconds, configured centrally and adjustable in Settings. Optional WebSocket URL uses native WebSocket, not Socket.IO. Disconnections/stale timestamps are indicated; the UI does not generate replacement live data. Configure backend CORS and authenticated sessions appropriately.

## Installation visualization

`src/components/rigModel.js` retains the simplified green vertical engine, left blue/silver panel, blue cylindrical coupling, right grey dynamometer, black base and far-right blue enclosure. `markerDefinitions` in config.js defines:

1. DS18B20 near the upper head, highest engine marker; only raw temp_c can be shown.
2. ADXL345 on the mid/lower side below DS18B20; raw XYZ acceleration only, not unsupported derived feature aliases.
3. ESP32-C6 below ADXL345 near the support; data collection role, no measurement.
4. ACS712 on the far-right enclosure; current circuit location without internal wiring claims.

CSV/demo markers show no physical readings. Marker buttons support keyboard inspection; markers can also be clicked on the model. The model is not a validated physics-based twin. Accurate replacement requires dimensions, front/side/rear views and mounting close-ups. `VITE_EQUIPMENT_MODEL_URL` supports a GLB/GLTF replacement; calibrate marker positions against its geometry before use.

## Storage, reports and checks

`useMonitoring` coordinates source state, model results, generated anomaly alerts and maintenance. Source changes remount this scope so readings/results do not leak across modes. `services/settings.js` stores per-account browser preferences. `services/demoStore.js` keeps manual CSV/demo maintenance separate and migrates prior user-entered demo records while excluding old seeded examples. Acknowledgements are per-account, browser-local, dataset/model/reading scoped; a shared lab deployment needs server acknowledgement persistence.

Live maintenance uses GET/POST `/api/maintenance` and PATCH `/api/maintenance/:id` with `{status}`. Records require id, timestamp, type, message, status (Recorded/Acknowledged/Completed), technician and notes. `services/reports.js` produces a printable PDF using manual records only.

Run `npm test` for data/model/configuration contracts and `npm run build`. Browser interaction checks live in `tests/browser-check.mjs` and use Playwright with Edge; `PLAYWRIGHT_MODULE` can point to a local Playwright installation. QA inference responses in that test are test-only and never part of demo/application data.
