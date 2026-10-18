export function histogram(values, bins = 12) {
  const nums = values.filter(Number.isFinite);
  if (!nums.length) return [];
  let min = Math.min(...nums),
    max = Math.max(...nums);
  if (min === max) return [{ bucket: String(min), count: nums.length }];
  const width = (max - min) / bins;
  const counts = Array(bins).fill(0);
  nums.forEach(
    (v) => counts[Math.min(bins - 1, Math.floor((v - min) / width))]++,
  );
  return counts.map((count, i) => ({
    bucket: `${(min + i * width).toPrecision(3)}–${(min + (i + 1) * width).toPrecision(3)}`,
    count,
  }));
}
export function correlation(rows, a, b) {
  const pairs = rows.filter(
    (r) => Number.isFinite(r[a]) && Number.isFinite(r[b]),
  );
  if (pairs.length < 2) return null;
  const ma = pairs.reduce((s, r) => s + r[a], 0) / pairs.length,
    mb = pairs.reduce((s, r) => s + r[b], 0) / pairs.length;
  let cov = 0,
    va = 0,
    vb = 0;
  for (const r of pairs) {
    const da = r[a] - ma,
      db = r[b] - mb;
    cov += da * db;
    va += da * da;
    vb += db * db;
  }
  return va && vb ? Math.max(-1, Math.min(1, cov / Math.sqrt(va * vb))) : null;
}
