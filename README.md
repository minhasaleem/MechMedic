# MechMedic

**Keeping Machines One Step Ahead**

The existing `lab-monitor` React/Vite frontend was revised in place for laboratory staff. It retains the shared dark theme, Recharts trends, UI primitives and central data integration. It does not render workflow explanations, academic content or the equipment photograph.

## Run

```powershell
cd E:\mca\S3\MINIPROJECT\lab-monitor
npm install
npm run dev
```

Open http://127.0.0.1:5176. Requires Node.js 22.12+ or a newer supported release. `npm run build` produces `dist/`; `npm run preview` previews it. `npm test` runs the data-contract checks.

On the Login page, select **Use demo credentials**, then **Sign In**. The public preview account is `staff@mechmedic.demo` / `MechMedicDemo!`. Alternatively, register a browser-local demo account. These are demonstration credentials, not a real laboratory account.

## Routes

Public: `#login`, `#register`, `#forgot-password`.

Authenticated: `#home`, `#sensors`, `#health`, `#twin`, `#alerts`, `#maintenance`, `#analytics`, `#settings`.

The dashboard is not mounted until a session exists. Successful login opens Home. Unauthenticated deep links show Login. Logout removes the session. Remember me uses a seven-day local demo session; otherwise the session is tab-local and expires after one day. Opening the root URL with an existing session uses the preferred starting page from Settings.

## Authentication boundary

The default `VITE_AUTH_MODE=demo` is a frontend UX simulation. Accounts and sessions are browser-local and **do not provide secure access control**. Registration stores a salted PBKDF2 password hash rather than a plaintext password. It is still not production authentication. Forgot password explicitly states that no reset email is sent in demo mode.

To integrate secure authentication, set `VITE_AUTH_MODE=backend`. `src/services/auth.js` calls:

- `GET /api/auth/session` -> `{ user: { id, name, email } }` or `{ user: null }`
- `POST /api/auth/login` with `{ email, password, remember }` -> `{ user }`
- `POST /api/auth/register` with `{ name, email, password }`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password` with `{ email }`
- `PATCH /api/auth/profile` with `{ name, email }` -> `{ user }`

Use secure HttpOnly server session cookies, authorization for every monitoring API and WebSocket connection, CSRF protection, and server-side validation. The shared HTTP client uses `credentials: include`; configure CORS for the exact frontend origin with credential support. The browser route guard is not a substitute for backend authorization. Authentication/data API contracts are proposed integration interfaces, not existing backend functionality.

## Structure and retained components

```
src/
  App.jsx                       Authenticated shell and eight staff routes
  main.jsx                      React entry point
  styles.css                    Retained dark theme plus staff/auth/responsive styles
  context/AuthContext.jsx       Session initialization, login/logout and profile state
  components/
    ui.jsx                      Shared icons, panels, badges, brand and accessible dialog
    Sidebar.jsx                 Eight-section staff navigation
    SensorCard.jsx              Reusable single measurement, units, status and timestamp
    Trends.jsx                  Retained Recharts sensor tabs and time ranges
    Predictions.jsx             Separate RF classification and LSTM gauge
    HistoryChart.jsx            Shared line/bar historical charts
    DigitalTwin.jsx             Three.js lifecycle, controls, health and asset loading
    rigModel.js                 Simplified diesel test-rig assembly and inspectable parts
    Records.jsx                 Alert feed, filters and acknowledgement
  pages/
    AuthPage.jsx                Login/register/password-reset views
    HealthPage.jsx              Health gauge, trend and maintenance estimate
    MaintenancePage.jsx         Search/filter/add/view/PDF workflow
    AnalyticsPage.jsx           Seven historical charts and time filters
    SettingsPage.jsx            Limits, preferences, notifications and profile
  data/
    config.js                   Units, equipment, cadence, health bands and empty limits
    demo.js                     ALL synthetic readings/model scenarios/history/seed records
  services/
    http.js                     Shared timed, credentialed HTTP requests
    api.js                      Monitoring REST and reconnecting native WebSocket adapters
    auth.js                     Demo/backend authentication adapter
    settings.js                 Central validation and demo/backend settings persistence
    demoStore.js                Per-user demo alert/maintenance persistence
    validation.js               Incoming data contract validation
    reports.js                  Lazy-loaded jsPDF maintenance-report generation
  hooks/
    useMonitoring.js            Shared polling/subscription lifecycle and write actions
    useSettings.js              Settings load/save lifecycle
```

Removed: `components/Workflow.jsx`, `components/EquipmentView.jsx`, the workflow route, the photo display and the academic ML explanation page. The original photograph remains in `public/equipment.png` only as an unused reference asset; no application component displays it.

## Data source and demo behaviour

`src/data/demo.js` is the only synthetic telemetry/model fixture generator. It produces deterministic curves and explicit Healthy, Warning and Critical demonstration scenarios. It does not implement or pretend to train an LSTM. The interface labels the entire demo workspace, model outputs and example records as synthetic. Switching to Live backend clears the demo values.

`src/services/demoStore.js` persists acknowledgement and maintenance changes separately per local demo user. `src/services/settings.js` persists that user's configuration. Browser-local records are not shared between laboratory staff and are not a production database.

`POLL_MS` in `src/data/config.js` is the one central five-second update interval. The stale display policy is four intervals; it is not an equipment fault threshold. The actual ADXL345 acquisition frequency is separate from dashboard delivery. Components never create their own random readings.

## Monitoring integration

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`, optional `VITE_WS_URL`, and `VITE_AUTH_MODE`. Restart Vite after changing environment values. Never place secrets in VITE variables.

The five sensor keys are `vibration_x`, `vibration_y`, `vibration_z` (g), `temperature` (degrees Celsius), and `current` (A). Every reading requires an ISO timestamp with timezone and five finite numeric values.

- `GET /api/latest` -> one reading.
- `GET /api/history` -> array of readings, preferably at least one hour.
- `GET /api/health` -> `null` or `{ timestamp, fault_class, health_score, maintenance_hours }`; unavailable individual outputs may be null. `fault_class`: 0 Normal, 1 Minor Fault, 2 Moderate Fault, 3 Severe Fault. `health_score`: 0–100. `maintenance_hours`: nonnegative estimate.
- `GET /api/health-history` -> `[{ timestamp, health_score }]`.
- `GET /api/classification-history` -> `[{ timestamp, fault_class }]`.
- `GET /api/alerts` -> array of `{ id, timestamp, severity, source, message, condition, acknowledged, acknowledged_by?, acknowledged_at? }`.
- `POST /api/alerts/:id/acknowledge` -> updated alert record. The backend derives the acknowledging user from the authenticated session.
- `GET /api/maintenance` -> array of `{ id, timestamp, type, message, condition, technician, notes }`.
- `POST /api/maintenance` with the record fields except id -> saved record, including id.
- `GET /api/analytics?from=<ISO>&to=<ISO>` -> `{ history, healthHistory, classificationHistory, alerts, maintenance }`, using the record shapes above.
- `GET /api/settings` and `PUT /api/settings` -> the shape of `defaultSettings` in `config.js`.

All writes show errors and wait for the backend response; live actions are not silently redirected to local demo storage. The guide names latest, health and alerts endpoints. Additional routes and exact response schemas are frontend integration proposals for the future backend.

Native WebSocket messages:

```
{ "type": "reading", "data": Reading }
{ "type": "prediction", "data": Prediction }
{ "type": "alert", "data": Alert }
```

The adapter validates messages, appends sensor history, updates model state and accepts alert events. It reconnects at the central cadence and keeps REST polling as fallback. Socket.IO needs a protocol-specific replacement adapter. The data layer retains explicit disconnected/stale states; unavailable model results are not inferred to be Normal. Historical analytics never substitute synthetic results while in live mode.

## Health, limits and notifications

Health bands follow the revised guide: 70–100 Healthy, 40–69 Degrading/Warning, below 40 Critical. Health scores and maintenance windows come from the LSTM response (or an explicitly labelled demo fixture). The frontend never computes a real health score or displays invented accuracy/confidence. Maintenance hours are an estimated maintenance window, not a proven remaining equipment lifespan.

Sensor upper limits start unset. Staff can enter warning and critical limits in Settings; critical must be above warning when both are supplied. These limits only affect measurement badges and the saved configuration. They do not alter Random Forest output, calculate LSTM results or send notifications. The backend owns alert rules and Twilio/email delivery. Home alert preferences affect the Home feed; the full Alert Feed retains all alerts. Notification checkboxes store requested channels but do not claim successful delivery.

## 3D equipment representation

The interactive Three.js view uses simplified geometry resembling the supplied rig: instrument cabinet, single-cylinder engine, flywheel, dynamometer/generator, exhaust and frame. It is labelled as a simplified representation, not an exact replica. Health colour follows the displayed LSTM score; a stale result uses a neutral state. Critical cone/flame-like markers are explicitly symbolic and do not mean physical fire has been detected. There is no fire sensor in the UI.

Rotate by dragging or using the Rotate button; zoom by wheel/pinch or buttons. Click geometry or an inspection button to inspect a part. Reset restores the camera. Normal operation renders on interaction/data/resize; only the critical symbolic effect uses a capped animation loop. Reduced-motion preference disables its motion. WebGL failure has a visible fallback message, never a photograph filler.

Set `VITE_EQUIPMENT_MODEL_URL` to a future GLB/GLTF asset to replace the approximate model. The loader normalizes scale. For component picking, tag mesh `userData.part` with keys from `rigParts` (`engine`, `generator`, `panel`, `exhaust`, `frame`). This future accurate asset still needs validation against the physical equipment.

## Maintenance PDF

`src/services/reports.js` exports the currently filtered records to a landscape report with MechMedic branding, generation time, filter, staff name, all maintenance fields, repeating table headers, page numbers and a demo watermark/footer when appropriate. It supports wrapped text and multiple pages. The current PDF font uses Latin text; non-ASCII characters are replaced with `?`. Embed a licensed Unicode font for multilingual production records. No export endpoint is needed for this frontend implementation; replace this service for signed/server-generated reports later.

## Verification

`tests/contracts.test.js` tests cadence, the five-field schema, health bands, invalid response rejection, thresholds and analytics ranges. `tests/browser-check.mjs` covers the staff journeys using an isolated browser profile. It uses Playwright (install separately or provide its module URL in `PLAYWRIGHT_MODULE`) and installed Edge by default. Start the dev server first, then run `node tests/browser-check.mjs`. `BROWSER_CHANNEL` can override Edge. QA fixtures are not actual laboratory records. See `QA.md` for completed checks and limitations.
