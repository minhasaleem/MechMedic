import { useEffect, useState } from "react";
import { defaultSettings } from "../data/config";
import { loadSettings, saveSettings } from "../services/settings";
export function useSettings(userId, mode) {
  const [settings, setSettings] = useState(() =>
      structuredClone(defaultSettings),
    ),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    setSettings(structuredClone(defaultSettings));
    setError("");
    setLoaded(false);
    loadSettings(userId, mode)
      .then((v) => {
        if (active) setSettings(v);
      })
      .catch(() => {
        if (active)
          setError("Saved settings could not be loaded. Limits are unset.");
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [userId, mode]);
  async function save(value) {
    const result = await saveSettings(userId, mode, value);
    setSettings(result || value);
    setError("");
  }
  return { settings, error, save, loaded };
}
