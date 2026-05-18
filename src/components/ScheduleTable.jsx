import { ArrowUpDown, Check, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useSchedules } from "../context/ScheduleContext.jsx";
import { scheduleFields } from "../utils/schedule.js";

export default function ScheduleTable({ schedules, onEdit, sortConfig, onSort }) {
  const { options, editSchedule, removeSchedule } = useSchedules();
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState({});

  const startInlineEdit = (schedule) => {
    setEditingId(schedule.id);
    setDraft(schedule);
  };

  const saveInlineEdit = () => {
    const saved = editSchedule(editingId, draft);
    if (saved) {
      setEditingId("");
      setDraft({});
    }
  };

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <section className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
          <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              {scheduleFields.map((field) => (
                <th key={field.key} className="px-3 py-3 font-semibold">
                  <button className="inline-flex items-center gap-2 hover:text-clinic-teal" onClick={() => onSort(field.key)}>
                    <span>{field.label}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] dark:border-slate-700 dark:bg-slate-950">
                      <ArrowUpDown size={12} />
                      {sortConfig?.key === field.key ? (sortConfig.direction === "asc" ? "ASC" : "DESC") : ""}
                    </span>
                  </button>
                </th>
              ))}
              <th className="w-28 px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {schedules.map((schedule) => {
              const isEditing = editingId === schedule.id;
              return (
                <tr key={schedule.id} className="align-top transition hover:bg-teal-50/50 dark:hover:bg-slate-800/70">
                  {scheduleFields.map((field) => (
                    <td key={field.key} className="min-w-36 px-3 py-3">
                      {isEditing ? (
                        <EditableCell field={field} value={draft[field.key]} options={options} onChange={updateDraft} />
                      ) : (
                        <span>{schedule[field.key] || "-"}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button className="btn h-8 w-8 px-0" onClick={saveInlineEdit} aria-label="Save row">
                            <Check size={16} />
                          </button>
                          <button className="btn h-8 w-8 px-0" onClick={() => setEditingId("")} aria-label="Cancel edit">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn h-8 w-8 px-0" onClick={() => startInlineEdit(schedule)} aria-label="Inline edit row">
                            <Pencil size={16} />
                          </button>
                          <button className="btn h-8 w-8 px-0" onClick={() => onEdit(schedule)} aria-label="Open edit modal">
                            <Pencil size={16} />
                          </button>
                          <button className="btn btn-danger h-8 w-8 px-0" onClick={() => removeSchedule(schedule.id)} aria-label="Delete row">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!schedules.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={scheduleFields.length + 1}>
                  No schedules match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EditableCell({ field, value, options, onChange }) {
  if (field.optionKey) {
    return (
      <select className="field h-9 min-w-36" value={value || ""} onChange={(event) => onChange(field.key, event.target.value)}>
        {withCurrentOption(options[field.optionKey] || [], value).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className="field h-9 min-w-32"
      type={field.type}
      value={value || ""}
      onChange={(event) => onChange(field.key, event.target.value)}
    />
  );
}

const withCurrentOption = (values, current) =>
  current && !values.includes(current) ? [current, ...values] : values;
