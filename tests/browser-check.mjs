import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL || "msedge",
  args: ["--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
async function route(key, title) {
  if (
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page.locator(`nav a[href="#${key}"]`).click();
  await page
    .getByRole("heading", { level: 1, name: title, exact: true })
    .waitFor();
}
await page.goto("http://127.0.0.1:5176/#analytics", {
  waitUntil: "networkidle",
});
await page
  .getByRole("heading", { name: "Welcome back", exact: true })
  .waitFor();
assert.equal(
  await page.locator('nav[aria-label="Main navigation"]').count(),
  0,
);
checks.push("Unauthenticated deep links cannot display the dashboard");
await page.getByRole("link", { name: "Register", exact: true }).click();
await page.getByLabel("Full name", { exact: true }).fill("QA Laboratory Staff");
const email = `qa-${Date.now()}@mechmedic.test`,
  password = "TestingMechMedic!42";
await page.getByLabel("Email", { exact: true }).fill(email);
await page.getByLabel("Password", { exact: true }).fill(password);
await page.getByLabel("Confirm password", { exact: true }).fill("NotMatching!");
await page.getByRole("button", { name: "Register", exact: true }).click();
await page.getByText("Passwords do not match.", { exact: true }).waitFor();
await page.getByLabel("Confirm password", { exact: true }).fill(password);
await page.getByRole("button", { name: "Register", exact: true }).click();
await page
  .getByText("Account created. You can now sign in.", { exact: true })
  .waitFor();
assert.equal(
  await page.evaluate(
    (pass) => JSON.stringify(localStorage).includes(pass),
    password,
  ),
  false,
);
await page.getByRole("link", { name: "Back to Login", exact: true }).click();
await page.getByLabel("Email", { exact: true }).fill(email);
await page.getByLabel("Password", { exact: true }).fill("Incorrect!");
await page.getByRole("button", { name: "Sign In", exact: true }).click();
await page
  .getByText("Email or password is incorrect.", { exact: true })
  .waitFor();
await page.getByLabel("Password", { exact: true }).fill(password);
await page.getByLabel("Remember me", { exact: true }).check();
await page.getByRole("button", { name: "Sign In", exact: true }).click();
await page
  .getByRole("heading", { level: 1, name: "Home", exact: true })
  .waitFor();
assert.ok(
  await page.evaluate(() => localStorage.getItem("mechmedic.demo.session.v1")),
);
await page.locator('canvas[data-rendered="true"]').waitFor({ timeout: 45000 });
assert.equal(await page.locator(".sensor-card").count(), 5);
assert.equal(await page.locator("img").count(), 0);
assert.equal(
  await page.getByText("System workflow", { exact: true }).count(),
  0,
);
checks.push(
  "Registration validation, hashed demo password, invalid login, Remember me and Login → Home",
);
for (const [key, title] of [
  ["sensors", "Live Sensor Data"],
  ["health", "Health Score"],
  ["twin", "Digital Twin"],
  ["alerts", "Alert Feed"],
  ["maintenance", "Maintenance Log"],
  ["analytics", "Analytics"],
  ["settings", "Settings"],
  ["home", "Home"],
]) {
  await route(key, title);
  assert.equal(
    await page.locator(`nav a[href="#${key}"]`).getAttribute("aria-current"),
    "page",
  );
}
checks.push(
  "Exactly eight authenticated navigation sections work; no photo or workflow content",
);
await route("sensors", "Live Sensor Data");
assert.equal(await page.locator(".sensor-card").count(), 5);
for (const name of ["Temperature", "Current", "Vibration"]) {
  await page.getByRole("tab", { name, exact: true }).click();
  assert.equal(
    await page
      .getByRole("tab", { name, exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
}
await page.getByLabel("Chart time range").selectOption("60");
const beforeTimestamp = await page
  .locator(".sensor-footer")
  .first()
  .innerText();
await page.waitForTimeout(5300);
assert.notEqual(
  await page.locator(".sensor-footer").first().innerText(),
  beforeTimestamp,
);
checks.push(
  "Five readings, all chart tabs, time ranges, and central five-second updates",
);
await route("twin", "Digital Twin");
await page.locator('canvas[data-rendered="true"]').waitFor();
const before = await page.locator("canvas").screenshot();
await page.getByRole("button", { name: "Rotate model" }).click();
await page.waitForTimeout(150);
const after = await page.locator("canvas").screenshot();
assert.equal(before.equals(after), false);
await page.getByRole("button", { name: "Zoom in", exact: true }).click();
await page.getByRole("button", { name: "Zoom out", exact: true }).click();
await page.getByRole("button", { name: "Reset view", exact: true }).click();
await page
  .getByRole("button", { name: "Dynamometer assembly", exact: true })
  .click();
await page
  .getByRole("heading", { name: "Dynamometer assembly", exact: true })
  .waitFor();
await page.getByLabel("Demo health scenario").selectOption("critical");
await page.locator(".critical-symbol").waitFor();
assert.ok(
  (await page.locator(".critical-symbol").innerText()).includes(
    "not fire detection",
  ),
);
await page.screenshot({
  path: "tests/mechmedic-twin-critical.png",
  fullPage: true,
});
await route("health", "Health Score");
assert.ok(
  (await page.locator(".health-ring").getAttribute("style")).includes(
    "#ef7185",
  ),
);
await page.getByLabel("Demo health scenario").selectOption("warning");
await page.getByText("Degrading / Warning", { exact: true }).first().waitFor();
assert.ok(
  (await page.locator(".health-ring").getAttribute("style")).includes(
    "#edb16a",
  ),
);
await page.getByLabel("Demo health scenario").selectOption("healthy");
checks.push(
  "Three.js canvas renders; rotation changes view; zoom/reset/inspection and three health colours work; critical effect is labelled symbolic",
);
await route("alerts", "Alert Feed");
await page.getByRole("button", { name: "Unacknowledged", exact: true }).click();
const count = await page
  .getByRole("button", { name: "Acknowledge", exact: true })
  .count();
await page
  .getByRole("button", { name: "Acknowledge", exact: true })
  .first()
  .click();
assert.equal(
  await page.getByRole("button", { name: "Acknowledge", exact: true }).count(),
  count - 1,
);
for (const name of ["Warning", "Critical", "Acknowledged", "All"])
  await page.getByRole("button", { name, exact: true }).click();
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: "Acknowledged", exact: true }).click();
assert.ok(await page.getByText(/Acknowledged · QA Laboratory Staff/).count());
checks.push("Alert filters and acknowledgement persist across reload");
await route("maintenance", "Maintenance Log");
await page
  .getByRole("button", { name: "Add maintenance record", exact: true })
  .click();
await page
  .getByLabel("Description / action taken", { exact: true })
  .fill("QA inspection record");
await page
  .getByLabel("Notes", { exact: true })
  .fill("QA report layout verification with wrapped notes. ".repeat(60));
await page.getByRole("button", { name: "Save record", exact: true }).click();
await page
  .getByRole("cell", { name: "QA inspection record", exact: true })
  .waitFor();
await page.getByLabel("Search maintenance").fill("QA inspection");
await page.getByLabel("Maintenance type filter").selectOption("Inspection");
assert.equal(await page.locator("tbody tr").count(), 1);
await page
  .getByRole("button", { name: "View QA inspection record", exact: true })
  .click();
await page
  .getByRole("heading", { name: "Maintenance record", exact: true })
  .waitFor();
assert.ok(
  (await page.locator(".record-detail").innerText()).includes(
    "QA report layout verification",
  ),
);
await page.getByRole("button", { name: "Close dialog", exact: true }).click();
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Export PDF", exact: true }).click();
const download = await downloadPromise;
await download.saveAs("tests/MechMedic-maintenance-QA.pdf");
assert.ok(
  download.suggestedFilename().startsWith("MechMedic-maintenance-demo-"),
);
checks.push("Maintenance add/view/search/filter and PDF download work");
await route("analytics", "Analytics");
for (const label of ["Today", "7 days", "30 days", "Recent"]) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.waitForTimeout(150);
}
await page.getByRole("button", { name: "Custom range", exact: true }).click();
await page.getByLabel("Analytics from date").fill("2026-09-29");
await page.getByLabel("Analytics to date").fill("2026-09-01");
await page.getByText(/Choose a valid date range/).waitFor();
await page.getByLabel("Analytics to date").fill("2026-09-29");
await page.getByRole("button", { name: "30 days", exact: true }).click();
assert.equal(await page.locator(".history-panel").count(), 7);
await page.screenshot({
  path: "tests/mechmedic-analytics.png",
  fullPage: true,
});
checks.push(
  "Seven analytics charts and recent/today/7/30/custom filters work; invalid dates are rejected",
);
await route("settings", "Settings");
await page
  .getByLabel("Surface temperature warning threshold", { exact: true })
  .fill("70");
await page
  .getByLabel("Surface temperature critical threshold", { exact: true })
  .fill("60");
await page
  .getByRole("button", { name: "Save monitoring settings", exact: true })
  .click();
await page.getByText(/critical must be greater than warning/).waitFor();
await page
  .getByLabel("Surface temperature warning threshold", { exact: true })
  .fill("1");
await page
  .getByLabel("Surface temperature critical threshold", { exact: true })
  .fill("2");
await page.getByLabel("Compact dashboard spacing", { exact: true }).check();
await page
  .getByRole("button", { name: "Save monitoring settings", exact: true })
  .click();
await page
  .getByText("Monitoring settings saved locally for this demo account.", {
    exact: true,
  })
  .waitFor();
await route("sensors", "Live Sensor Data");
await page.getByText("Critical limit", { exact: true }).waitFor();
await page.reload({ waitUntil: "networkidle" });
await page.getByText("Critical limit", { exact: true }).waitFor();
assert.ok(await page.locator(".density-compact").count());
await route("settings", "Settings");
await page.getByLabel("Full name", { exact: true }).fill("Updated QA Staff");
await page.getByRole("button", { name: "Save profile", exact: true }).click();
await page.getByText("Profile saved.", { exact: true }).waitFor();
await page
  .locator(".staff-profile strong")
  .getByText("Updated QA Staff", { exact: true })
  .waitFor();
checks.push(
  "Threshold validation, applied limits, compact preference, persistence and profile update work",
);
for (const width of [1440, 1024, 768, 390, 320]) {
  await page.setViewportSize({ width, height: 950 });
  for (const [key, title] of [
    ["home", "Home"],
    ["sensors", "Live Sensor Data"],
    ["health", "Health Score"],
    ["twin", "Digital Twin"],
    ["alerts", "Alert Feed"],
    ["maintenance", "Maintenance Log"],
    ["analytics", "Analytics"],
    ["settings", "Settings"],
  ]) {
    await route(key, title);
    await page.waitForTimeout(130);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${key} overflow at ${width}`,
    );
  }
  if (width === 390) {
    await route("home", "Home");
    await page.locator('canvas[data-rendered="true"]').waitFor();
    await page.screenshot({
      path: "tests/mechmedic-mobile.png",
      fullPage: true,
    });
  }
}
checks.push(
  "All eight pages have no page overflow at 1440, 1024, 768, 390 and 320px; mobile navigation works",
);
await page.setViewportSize({ width: 1440, height: 1050 });
await route("home", "Home");
await page.route("http://localhost:5000/**", (route) => route.abort());
await page.getByLabel("Data source", { exact: true }).selectOption("live");
await page.getByText("Backend disconnected", { exact: true }).waitFor();
assert.equal(
  await page.locator(".sensor-value strong").first().innerText(),
  "—",
);
assert.ok(await page.getByText("Condition unknown", { exact: true }).count());
checks.push(
  "Unavailable live backend clears demo outputs and shows disconnected state",
);
await page.getByRole("button", { name: "Sign out", exact: true }).click();
await page
  .getByRole("heading", { name: "Welcome back", exact: true })
  .waitFor();
assert.equal(await page.locator("nav").count(), 0);
await page.getByRole("link", { name: "Forgot password?", exact: true }).click();
await page.getByLabel("Email", { exact: true }).fill(email);
await page.getByRole("button", { name: "Request reset", exact: true }).click();
await page.getByText(/Demo mode: no reset email was sent/).waitFor();
checks.push(
  "Sign out protects the workspace again; forgot-password demo is explicit",
);
assert.deepEqual(errors, []);
checks.push("No browser JavaScript runtime errors");
console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
await browser.close();
