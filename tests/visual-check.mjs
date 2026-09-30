const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  headless: true,
  channel: "msedge",
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5176/", { waitUntil: "networkidle" });
await page.screenshot({ path: "tests/mechmedic-login.png", fullPage: true });
await page.getByRole("button", { name: "Use demo credentials" }).click();
await page.getByRole("button", { name: "Sign In", exact: true }).click();
await page
  .getByRole("heading", { level: 1, name: "Home", exact: true })
  .waitFor();
await page.locator('canvas[data-rendered="true"]').waitFor({ timeout: 45000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: "tests/mechmedic-home.png", fullPage: true });
console.log(
  JSON.stringify({
    errors,
    canvas: await page.locator("canvas").count(),
    sensorCards: await page.locator(".sensor-card").count(),
    title: await page.title(),
  }),
);
await browser.close();
