# MechMedic verification results

Final checks completed on 30 September 2026 using Node.js 24 and headless Microsoft Edge. The existing frontend was revised in place.

## Automated results

- `npm test`: **6 tests passed**. These cover the five-channel data contract, central update cadence, synthetic health scenarios and documented bands, invalid responses, acknowledgement shapes, configured threshold boundaries, and historical date ranges.
- `npm run build`: **passed**. Vite reports non-blocking bundle-size warnings for React/Recharts and Three.js. The 3D, analytics and PDF modules are loaded separately; bundle optimization remains optional future work.
- `tests/browser-check.mjs`: **13 acceptance groups passed**, with **zero JavaScript runtime errors**.

## Browser acceptance coverage

1. Unauthenticated deep links show Login without mounting the monitoring dashboard.
2. Registration, mismatched passwords, invalid login, salted password storage, Remember me and Login -> Home.
3. All eight authenticated navigation routes and active states. No equipment photograph or project-workflow page is rendered.
4. Five sensor measurements, chart tabs, historical time selectors and central five-second demo updates.
5. Three.js rendering, visible view change after rotation, zoom, reset, part inspection, green/amber/red health states, and the explicitly symbolic critical effect.
6. Alert severity/acknowledgement filters and acknowledgement persistence after reload.
7. Maintenance add, search, type filter, view dialog and PDF download.
8. Seven analytics charts, Recent/Today/7 days/30 days/Custom filters, and invalid-range rejection.
9. Threshold validation, reading badges using saved limits, compact layout, settings persistence, and profile changes.
10. All eight pages checked at **1440, 1024, 768, 390 and 320 pixels**, with no horizontal page overflow. Maintenance tables scroll inside their container. Mobile navigation works.
11. Live-mode connection failure clears synthetic readings and model outputs and displays the disconnected state.
12. Sign out removes dashboard access. Forgot-password demo explicitly states that no email is sent.
13. No browser JavaScript runtime errors during these checks.

## Visual and PDF review

Desktop Login/Home, the critical 3D view, analytics and mobile screenshots are under `tests/mechmedic-*.png`. The latest mobile header and maintenance-table containment fixes passed the responsive sweep.

The downloaded `tests/MechMedic-maintenance-QA.pdf` is a **QA-only synthetic report**, not a laboratory service record. A long-notes export generated two pages and was inspected as text and rendered images. Branding, wrapped text, repeated headings, page numbers and the demo footer were verified. The PDF uses a Latin built-in font; multilingual production reports require an embedded Unicode font.

## Re-run

Start the application with `npm run dev`. Make Playwright available or set `PLAYWRIGHT_MODULE` to its module URL, then run:

```
node tests/browser-check.mjs
```

The runner uses installed Edge by default; `BROWSER_CHANNEL` can override the channel. It uses a separate browser context, so its accounts, threshold edits and maintenance test records do not modify the user's normal browser data.

## Integration limits

Authentication currently defaults to an explicitly labelled, browser-local demo. Production authentication requires the documented server session endpoints and server-side API authorization. Actual sensors, trained models, an authenticated WebSocket server, notification delivery and a shared maintenance database are not connected and were not tested. Backend contracts are documented in README.md. The simplified 3D assembly is not an exact physical replica; an accurate GLB/GLTF can replace it later.
