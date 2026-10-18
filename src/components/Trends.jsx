import { useState } from "react";
import { measurements } from "../data/config";
import { HistoryChart } from "./HistoryChart";
export function Trends({
  history,
  availableKeys = measurements.map((m) => m.key),
}) {
  const [selected, setSelected] = useState([
    "vib_rms_g",
    "temp_block_C",
    "current_A",
  ]);
  const active = measurements.filter(
    (m) => selected.includes(m.key) && availableKeys.includes(m.key),
  );
  const units = [...new Set(active.map((m) => m.unit))];
  return (
    <section className="parameter-trends">
      <div className="section-label">
        <h2>Compare parameter trends</h2>
        <span>Separate charts for different units</span>
      </div>
      <div className="parameter-picker">
        {measurements
          .filter((m) => availableKeys.includes(m.key))
          .map((m) => (
            <label key={m.key} className="check-label">
              <input
                type="checkbox"
                checked={selected.includes(m.key)}
                onChange={(e) =>
                  setSelected((v) =>
                    e.target.checked
                      ? [...v, m.key]
                      : v.filter((k) => k !== m.key),
                  )
                }
              />
              {m.name}
            </label>
          ))}
      </div>
      {!active.length && (
        <p className="monitoring-note">Select one or more parameters.</p>
      )}
      <div className="analytics-grid">
        {units.map((unit) => (
          <HistoryChart
            key={unit || "dimensionless"}
            title={`${unit || "Dimensionless"} measurements`}
            data={history}
            unit={unit}
            series={active
              .filter((m) => m.unit === unit)
              .map((m) => ({ key: m.key, label: m.name, color: m.color }))}
          />
        ))}
      </div>
    </section>
  );
}
