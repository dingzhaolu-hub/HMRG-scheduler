import { Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSchedules } from "../context/ScheduleContext.jsx";
import { emptySchedule, scheduleFields } from "../utils/schedule.js";

export default function ScheduleFormModal({ schedule, onClose, onSaved = onClose }) {
  const { options, createSchedule, editSchedule, removeSchedule } = useSchedules();
  const [form, setForm] = useState(emptySchedule);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!schedule) return;
    setConfirmDelete(false);
    setForm({
      ...emptySchedule,
      room: options.rooms[0] || "",
      study: options.studies[0] || "",
      coordinator: options.coordinators[0] || "",
      ...schedule
    });
  }, [schedule, options]);

  if (!schedule) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    const saved = form.id ? editSchedule(form.id, form) : createSchedule(form);
    if (saved) onSaved();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <form className="panel w-full max-w-2xl p-6" data-schedule-modal="true" onSubmit={submit}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#13213a] dark:text-white">{form.id ? "Edit Schedule" : "Add Schedule"}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Clinical visit booking details</p>
          </div>
          <button type="button" className="btn h-9 w-9 px-0" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 py-6 sm:grid-cols-2">
          {scheduleFields.map((field) => (
            <label key={field.key} className={field.key === "coordinator" ? "sm:col-span-2" : ""}>
              <span className="label">{field.label}</span>
              {field.key === "room" && schedule.lockRoom ? (
                <input className="field mt-1" type="text" value={form.room} readOnly />
              ) : field.optionKey ? (
                <select className="field mt-1" value={form[field.key]} onChange={(event) => update(field.key, event.target.value)}>
                  {withCurrentOption(options[field.optionKey] || [], form[field.key]).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="field mt-1"
                  type={field.type}
                  value={form[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                  required
                />
              )}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800">
          {form.id ? (
            <button
              type="button"
              className="btn btn-danger mr-auto"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={17} />
              Delete
            </button>
          ) : null}
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={17} />
            Save Schedule
          </button>
        </div>
      </form>
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
              <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#13213a] dark:text-white">Delete scheduled visit?</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {form.date} {form.startTime}-{form.endTime} {form.room}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-5">
              <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  removeSchedule(form.id);
                  setConfirmDelete(false);
                  onClose();
                }}
              >
                <Trash2 size={17} />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const withCurrentOption = (values, current) =>
  current && !values.includes(current) ? [current, ...values] : values;
