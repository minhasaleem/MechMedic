import { FEATURE_KEYS, POLL_MS } from "./config.js";
// Synthetic signals only. No fabricated Isolation Forest, health or maintenance predictions.
export function createDemoSnapshot(now = Date.now(), interval = POLL_MS) {
  const rows = Array.from({ length: 120 }, (_, i) => {
    const t = (now / interval - 119 + i) / 9;
    const values = [
      1000 + Math.sin(t) * 15,
      0.18 + Math.sin(t) * 0.02,
      0.65 + Math.sin(t) * 0.04,
      2.8 + Math.cos(t) * 0.1,
      0.04 + Math.cos(t) * 0.004,
      0.01 + Math.sin(t) * 0.001,
      62 + Math.sin(t) * 2,
      58 + Math.cos(t) * 2,
      67 + Math.sin(t) * 3,
      25 + Math.sin(t) * 0.5,
      4.8 + Math.cos(t) * 0.2,
    ];
    return {
      reading_index: i + 1,
      timestamp: new Date(now - (119 - i) * interval).toISOString(),
      ...Object.fromEntries(FEATURE_KEYS.map((k, n) => [k, values[n]])),
    };
  });
  return { rows };
}
