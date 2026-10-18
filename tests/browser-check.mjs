import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    "file:///C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs"
);
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1050 },
  acceptDownloads: true,
});
page.setDefaultTimeout(60000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:5176/#home");
  await page.getByRole("button", { name: "Use demo credentials" }).click();
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.getByRole("heading", { name: "MechMedic", exact: true }).waitFor();
  assert.equal(await page.locator(".summary-card").count(), 4);
  assert.equal(await page.locator("canvas").count(), 0);
  await page.getByLabel("Data source", { exact: true }).selectOption("csv");
  await page
    .getByText(/2500 readings/)
    .first()
    .waitFor();
  await page.screenshot({ path: "tests/updated-home.png", fullPage: true });
  for (const route of [
    "sensors",
    "health",
    "twin",
    "alerts",
    "maintenance",
    "analytics",
    "settings",
  ]) {
    await page.locator(`nav a[href="#${route}"]`).click();
    if (route === "sensors") {
      await page.locator(".sensor-card").last().waitFor();
      assert.equal(await page.locator(".sensor-card").count(), 11);
      assert.ok(await page.locator(".recharts-wrapper").count());
    }
    if (route === "twin") {
      await page.locator('canvas[data-rendered="true"]').waitFor();
      for (const name of ["DS18B20", "ADXL345", "ESP32-C6", "ACS712"])
        await page.getByRole("button", { name: new RegExp(name) }).click();
      await page
        .getByRole("button", { name: "Reset view", exact: true })
        .click();
      await page.screenshot({ path: "tests/updated-twin.png", fullPage: true });
    }
    if (route === "analytics") {
      await page.locator(".correlation-table").waitFor();
      await page.getByLabel("Analytics range").selectOption("custom");
      await page.getByLabel("Range from").fill("10");
      await page.getByLabel("Range to").fill("50");
      await page.getByText("CSV Data · 41 readings", { exact: true }).waitFor();
    }
    console.log("Route OK:", route);
  }
  await page.getByLabel("Connect Isolation Forest inference endpoint").check();
  let requests = 0;
  await page.route("**/api/model/predict", async (route) => {
    const body = route.request().postDataJSON();
    requests++;
    assert.equal(body.features.length, 11);
    assert.ok(!JSON.stringify(body).includes("condition"));
    await route.fulfill({
      json: {
        dataset_id: body.dataset_id,
        results: body.rows.map((r, i) => ({
          algorithm: "IsolationForest",
          model_version: "QA-only-fixture",
          reading_index: r.reading_index,
          status: i === body.rows.length - 1 ? "anomaly" : "normal",
          anomaly_score: i === body.rows.length - 1 ? -0.2 : 0.2,
          decision_threshold: 0,
          health_indicator: i === body.rows.length - 1 ? 30 : 90,
          health_mapping: "QA test fixture only",
        })),
      },
    });
  });
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await page.locator('nav a[href="#home"]').click();
  await page
    .locator(".summary-card")
    .filter({ hasText: "Equipment Status" })
    .getByText("Anomaly Detected", { exact: true })
    .waitFor();
  assert.ok(requests > 0);
  await page.locator('nav a[href="#alerts"]').click();
  await page.getByRole("button", { name: "View details", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Acknowledge", exact: true }).click();
  await page.getByText(/Acknowledged by/).waitFor();
  await page.locator('nav a[href="#maintenance"]').click();
  await page
    .getByRole("button", { name: "Add maintenance record", exact: true })
    .click();
  await page
    .getByLabel("Description / action taken")
    .fill("QA inspection record");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await page.getByRole("button", { name: "View QA inspection record" }).click();
  await page.getByRole("button", { name: "Mark completed" }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF" }).click();
  await (await download).saveAs("tests/updated-maintenance.pdf");
  await page.getByLabel("Data source", { exact: true }).selectOption("demo");
  await page.locator('nav a[href="#home"]').click();
  await page
    .locator(".summary-card")
    .filter({ hasText: "Equipment Status" })
    .getByText("Unknown", { exact: true })
    .waitFor();
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "home",
      "sensors",
      "health",
      "twin",
      "alerts",
      "maintenance",
      "analytics",
      "settings",
    ]) {
      await page.goto(`http://127.0.0.1:5176/#${route}`);
      await page.locator("h1").waitFor();
      await page.waitForTimeout(300);
      const sizes = await page.evaluate(() => ({
        w: innerWidth,
        sw: document.documentElement.scrollWidth,
      }));
      assert.ok(
        sizes.sw <= sizes.w + 1,
        `${route} overflow at ${width}: ${sizes.sw}`,
      );
    }
    console.log("Responsive OK:", width);
  }
  await page.screenshot({ path: "tests/updated-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: routes, CSV, model contract, alerts, manual maintenance, PDF, responsive layouts.",
  );
} catch (e) {
  await page.screenshot({ path: "tests/check-failure.png", fullPage: true });
  console.log("ERRORS", errors);
  console.log(
    await page
      .locator('[aria-label="Range from"]')
      .evaluateAll((es) =>
        es.map((e) => ({
          rect: e.getBoundingClientRect().toJSON(),
          style: getComputedStyle(e).display,
          html: e.outerHTML,
        })),
      ),
  );
  throw e;
} finally {
  await browser.close();
}
