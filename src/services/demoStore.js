import { createDemoRecords } from "../data/demo";
const storageKey = (id) => `mechmedic.demo.records.${id}`;
export function readDemoRecords(userId) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(userId)));
    if (stored?.alerts && stored?.maintenance) return stored;
  } catch {
    /* reset malformed local demo state */
  }
  const records = createDemoRecords();
  writeDemoRecords(userId, records);
  return records;
}
export function writeDemoRecords(userId, records) {
  localStorage.setItem(storageKey(userId), JSON.stringify(records));
}
