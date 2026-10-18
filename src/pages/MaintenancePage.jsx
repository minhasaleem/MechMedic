import { useState } from "react";

import {
  Panel,
  Badge,
  EmptyState,
  Icon,
  Modal,
  dateLabel,
} from "../components/ui";

const activityStates = ["Recorded", "Acknowledged", "Completed"];

const types = ["Inspection", "Preventive", "Corrective", "Other"];

function localNow() {
  const date = new Date();

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)

    .toISOString()

    .slice(0, 16);
}

export default function MaintenancePage({
  records,

  onAdd,

  onUpdate,

  user,

  demo,

  unavailable,
}) {
  const [search, setSearch] = useState(""),
    [type, setType] = useState("all"),
    [adding, setAdding] = useState(false),
    [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    date: localNow(),

    type: "Inspection",

    message: "",

    status: "Recorded",

    technician: user.name,

    notes: "",
  });

  const filtered = records

    .filter(
      (r) =>
        (type === "all" || r.type === type) &&
        [r.message, r.technician, r.notes, r.status].some((v) =>
          String(v || "")
            .toLowerCase()

            .includes(search.toLowerCase()),
        ),
    )

    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const change = (e) =>
    setForm((v) => ({ ...v, [e.target.name]: e.target.value }));

  async function save(e) {
    e.preventDefault();

    setBusy(true);

    setError("");

    try {
      if (!form.message.trim() || !form.technician.trim())
        throw new Error("Description and technician are required.");

      await onAdd({
        timestamp: new Date(form.date).toISOString(),

        type: form.type,

        message: form.message.trim(),

        status: form.status,

        technician: form.technician.trim(),

        notes: form.notes.trim(),
      });

      setAdding(false);

      setForm({ ...form, date: localNow(), message: "", notes: "" });

      setSuccess(
        demo
          ? "Record saved in this browser’s demo log."
          : "Maintenance record saved.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);

    setError("");

    try {
      const { exportMaintenance } = await import("../services/reports");

      exportMaintenance(filtered, {
        demo,

        staff: user.name,

        filter: `${type === "all" ? "All maintenance types" : type}${search ? `; search: ${search}` : ""}`,
      });

      setSuccess("PDF report exported.");
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-actions">
        <div className="search-field">
          <Icon name="search" size={17} />

          <input
            aria-label="Search maintenance"
            placeholder="Search records, technician or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          aria-label="Maintenance type filter"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">All maintenance types</option>

          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <button
          className="secondary-button"
          onClick={download}
          disabled={busy || unavailable}
        >
          <Icon name="download" /> Export PDF
        </button>

        <button
          className="primary-button"
          onClick={() => {
            setError("");

            setAdding(true);
          }}
        >
          <Icon name="plus" /> Add maintenance record
        </button>
      </div>

      {error && !adding && (
        <p role="alert" className="form-error inset">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="form-success inset">
          {success}
        </p>
      )}

      <Panel
        title="Maintenance Log"
        action={<Badge>{filtered.length} records</Badge>}
      >
        {unavailable ? (
          <EmptyState icon="maintenance" title="Maintenance log unavailable">
            The backend maintenance log could not be loaded.
          </EmptyState>
        ) : filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>

                  <th>Type</th>

                  <th>Description / action</th>

                  <th>Activity status</th>

                  <th>Technician / staff</th>

                  <th>
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.timestamp).toLocaleDateString()}</td>

                    <td>{r.type || "Not provided"}</td>

                    <td className="description-cell">{r.message}</td>

                    <td>{r.status || "Not provided"}</td>

                    <td>{r.technician || "Not provided"}</td>

                    <td>
                      <button
                        className="text-link"
                        onClick={() => setSelected(r)}
                        aria-label={`View ${r.message}`}
                      >
                        View record ↗
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="maintenance"
            title="No matching maintenance records"
          >
            Add a service record or adjust your filters.
          </EmptyState>
        )}
      </Panel>

      {adding && (
        <Modal
          title="Add maintenance record"
          onClose={() => {
            if (!busy) setAdding(false);
          }}
        >
          <form onSubmit={save} className="record-form">
            <div className="form-grid">
              <label>
                Date
                <input
                  type="datetime-local"
                  name="date"
                  required
                  max={localNow()}
                  value={form.date}
                  onChange={change}
                />
              </label>

              <label>
                Maintenance type
                <select name="type" value={form.type} onChange={change}>
                  {types.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label>
                Activity status
                <select name="status" value={form.status} onChange={change}>
                  {activityStates.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>

              <label>
                Technician / staff
                <input
                  name="technician"
                  required
                  maxLength={80}
                  value={form.technician}
                  onChange={change}
                />
              </label>
            </div>

            <label>
              Description / action taken
              <textarea
                name="message"
                required
                maxLength={2000}
                rows={3}
                value={form.message}
                onChange={change}
              />
            </label>

            <label>
              Notes
              <textarea
                name="notes"
                maxLength={4000}
                rows={3}
                value={form.notes}
                onChange={change}
              />
            </label>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAdding(false)}
                disabled={busy}
              >
                Cancel
              </button>

              <button className="primary-button" disabled={busy}>
                {busy ? "Saving…" : "Save record"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title="Maintenance record" onClose={() => setSelected(null)}>
          <dl className="record-detail">
            {[
              ["Date", dateLabel(selected.timestamp)],

              ["Maintenance type", selected.type],

              ["Description / action taken", selected.message],

              ["Activity status", selected.status],

              ["Technician / staff", selected.technician],

              ["Notes", selected.notes || "No notes"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>

                <dd>{value || "Not provided"}</dd>
              </div>
            ))}
          </dl>
          <div className="modal-actions">
            {["Acknowledged", "Completed"]
              .filter((s) => s !== selected.status)
              .map((status) => (
                <button
                  key={status}
                  className="secondary-button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onUpdate(selected.id, status);
                      setSelected({ ...selected, status });
                      setError("");
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Mark {status.toLowerCase()}
                </button>
              ))}
          </div>
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
    </>
  );
}
