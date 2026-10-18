// User-entered records are separated by source; old seeded examples are excluded.

export function readDemoRecords(userId, source = "demo") {
  try {
    const key = `mechmedic.records.v3.${userId}.${source}`;
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && Array.isArray(saved.maintenance)) return saved;

    if (source === "demo") {
      const legacy = JSON.parse(
        localStorage.getItem(`mechmedic.demo.records.${userId}`),
      );
      if (Array.isArray(legacy?.maintenance)) {
        const migrated = {
          maintenance: legacy.maintenance
            .filter((r) => !r.id.startsWith("demo-record-"))
            .map(({ condition: _condition, ...r }) => ({
              ...r,
              status: r.status || "Recorded",
            })),
        };
        writeDemoRecords(userId, migrated, source);
        return migrated;
      }
    }
  } catch {
    /* Unavailable storage or invalid saved records. */
  }
  return { maintenance: [] };
}

export function writeDemoRecords(userId, records, source = "demo") {
  localStorage.setItem(
    `mechmedic.records.v3.${userId}.${source}`,
    JSON.stringify(records),
  );
}
