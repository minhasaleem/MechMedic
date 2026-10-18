# Verification — MechMedic update

Verified 18 October 2026. The existing frontend was modified in place.

## Passed

- `npm test`: seven data/model/configuration tests pass.
- `node ../dashboard/node_modules/oxlint/bin/oxlint src`: no warnings/errors. The existing project has no lint npm script; the available workspace Oxlint executable was used.
- `npm run build`: production build passes. Three.js/charts remain relatively large bundles; the equipment view, analytics and PDF code are loaded on demand.
- `node tests/browser-check.mjs`: all eight routes, login protection, real CSV loading, eleven parameter cards, rendered charts, custom reading-index range, 3D rendering/inspection/reset, model integration contract, alert details/acknowledgement, maintenance add/view/manual completion and PDF download pass.
- Layout checks pass at 1440px desktop and 768px, 390px and 320px widths without horizontal document overflow.
- `node tests/live-check.mjs`: CSV upload, condition exclusion, partial live payloads, correct physical-marker provenance, source isolation and disconnection states pass.
- Exported PDF text checked with pypdf: exact equipment name, QA manual record and Completed status present.
- Screenshots visually inspected for Home, equipment view and mobile settings.

Browser tests use isolated browser storage and **test-only intercepted backend responses**. They do not establish trained-model accuracy, real hardware connectivity or production authentication. No synthetic predictions were added to application demo data.

## Evidence

- `tests/updated-home.png`
- `tests/updated-twin.png`
- `tests/updated-mobile.png`
- `tests/updated-maintenance.pdf` (QA fixture, not an actual equipment service record)

## Resolved during verification

File encoding, unnecessary static-CSV refreshes, stale development dependency cache affecting PDF loading, profile update payload and obsolete Three.js shadow-map option. The Vite server was restarted on 127.0.0.1:5176.

## Remaining integration boundaries

No compatible trained Isolation Forest artifact/preprocessing service was found. Maintenance/LSTM prediction is unavailable. Production auth, shared acknowledgement/settings persistence, and the physical ESP32-C6 bridge remain backend work. Three-dimensional geometry is an explicitly simplified representation with approximate mounting locations.
