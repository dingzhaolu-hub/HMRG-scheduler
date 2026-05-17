import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSchedules } from "../context/ScheduleContext.jsx";
import { emptySchedule, scheduleFields } from "../utils/schedule.js";

export default function ScheduleFormModal({ schedule, onClose }) {
  const { options, createSchedule, editSchedule } = useSchedules();
  const [form, setForm] = useState(emptySchedule);

  useEffect(() => {
    if (!schedule) return;
    setForm({
      ...emptySchedule,
      room: options.rooms[0] || "",
      study: options.studies[0] || "",
      coordinator: options.coordinators[0] || "",
      status: options.status[0] || "Pending",
      ...schedule
    });
  }, [schedule, options]);

  if (!schedule) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    const saved = form.id ? editSchedule(form.id, form) : createSchedule(form);
    if (saved) onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
      <form className="panel w-full max-w-2xl p-5" onSubmit={submit}>
        <div className="flex items-center justify-between border-b border-clinic-line pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-clinic-ink dark:text-white">{form.id ? "Edit Schedule" : "Add Schedule"}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Clinical visit booking details</p>
          </div>
          <button type="button" className="btn h-9 w-9 px-0" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 py-5 sm:grid-cols-2">
          {scheduleFields.map((field) => (
            <label key={field.key} className={field.key === "patientId" ? "sm:col-span-2" : ""}>
              <span className="label">{field.label}</span>
              {field.optionKey ? (
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

        <div className="flex justify-end gap-2 border-t border-clinic-line pt-4 dark:border-slate-800">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={17} />
            Save Schedule
          </button>
        </div>
      </form>
    </div>
  );
}

const withCurrentOption = (values, current) =>
  current && !values.includes(current) ? [current, ...values] : values;
