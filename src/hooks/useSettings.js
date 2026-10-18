import { useEffect, useState } from "react";
import { defaultSettings } from "../data/config";
import { loadSettings, saveSettings } from "../services/settings";
export function useSettings(userId) {
  const [settings, setSettings] = useState(() =>
      structuredClone(defaultSettings),
    ),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    loadSettings(userId).then((v) => {
      if (active) {
        setSettings(v);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [userId]);
  async function save(value) {
    await saveSettings(userId, null, value);
    setSettings(value);
  }
  return { settings, save, loaded, error: "" };
}
