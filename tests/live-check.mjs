import assert from "node:assert/strict";
import { FEATURE_KEYS } from "../src/data/config.js";
const { chromium } = await import(
  "file:///C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs"
);
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.setDefaultTimeout(45000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:5176/#analytics");
  await page.getByRole("button", { name: "Use demo credentials" }).click();
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.locator(".summary-card").first().waitFor();
  await page.getByLabel("Data source", { exact: true }).selectOption("csv");
  await page.locator(".csv-details summary").click();
  const text =
    FEATURE_KEYS.join(",") +
    ",condition\n" +
    FEATURE_KEYS.map((_, i) => i + 1).join(",") +
    ",healthy\n" +
    FEATURE_KEYS.map((_, i) => i + 11).join(",") +
    ",fault";
  await page
    .getByLabel("Upload CSV")
    .setInputFiles({
      name: "qa-fixture.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(text),
    });
  await page
    .getByText("qa-fixture.csv · 2 readings", { exact: false })
    .first()
    .waitFor();
  await page
    .locator(".summary-card")
    .filter({ hasText: "Equipment Status" })
    .getByText("Unknown", { exact: true })
    .waitFor();
  await page.locator('nav a[href="#sensors"]').click();
  assert.equal(await page.locator(".sensor-card").count(), 11);
  await page
    .locator(".sensor-card")
    .filter({ hasText: "Engine Speed" })
    .locator("strong")
    .getByText("11", { exact: true })
    .waitFor();
  let count = 0;
  await page.route("**/api/monitoring", async (route) => {
    count++;
    await route.fulfill({
      json: {
        readings: [
          {
            reading_index: count,
            timestamp: new Date().toISOString(),
            current_A: 5,
          },
        ],
        physical: {
          timestamp: new Date().toISOString(),
          temp_c: 61,
          ax_m_s2: null,
          current_dc_a: 3,
          current_rms_a: 3.2,
          adc_clipped: 0,
        },
      },
    });
  });
  await page.route("**/api/maintenance", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.getByLabel("Data source", { exact: true }).selectOption("live");
  await page.getByText("Live connection: connected", { exact: true }).waitFor();
  assert.equal(await page.locator(".sensor-card").count(), 11);
  await page
    .locator(".sensor-card")
    .filter({ hasText: "Engine Speed" })
    .getByText("Not available", { exact: true })
    .waitFor();
  await page
    .locator(".sensor-card")
    .filter({ hasText: "Current" })
    .locator("strong")
    .getByText("5", { exact: true })
    .waitFor();
  await page.locator('nav a[href="#twin"]').click();
  await page.getByRole("button", { name: /DS18B20/ }).click();
  await page.getByText("61 °C", { exact: true }).waitFor();
  await page.getByRole("button", { name: /ESP32-C6/ }).click();
  await page
    .getByText("Microcontroller role only; no measurement.", { exact: true })
    .waitFor();
  await page.getByLabel("Data source", { exact: true }).selectOption("csv");
  await page.getByRole("button", { name: /DS18B20/ }).click();
  assert.equal(await page.getByText("61 °C", { exact: true }).count(), 0);
  await page
    .locator(".inspection-detail")
    .getByText("Not available", { exact: true })
    .waitFor();
  await page.getByLabel("Data source", { exact: true }).selectOption("live");
  await page.unroute("**/api/monitoring");
  await page.route("**/api/monitoring", (route) => route.abort());
  await page
    .getByText("Live connection: disconnected", { exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: uploaded CSV, label exclusion, live partial measurements, physical provenance, source isolation, disconnected state, auth protection.",
  );
} finally {
  await browser.close();
}
