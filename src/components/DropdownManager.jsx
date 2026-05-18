import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useSchedules } from "../context/ScheduleContext.jsx";

export default function DropdownManager({ group }) {
  const { options, replaceOptions } = useSchedules();
  const [newValue, setNewValue] = useState("");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const values = options[group.key] || [];

  const addOption = (event) => {
    event.preventDefault();
    const value = newValue.trim();
    if (!value) return;
    replaceOptions({ ...options, [group.key]: [...values, value] });
    setNewValue("");
  };

  const deleteOption = (value) => {
    replaceOptions({ ...options, [group.key]: values.filter((item) => item !== value) });
  };

  const startEdit = (value) => {
    setEditing(value);
    setDraft(value);
  };

  const saveEdit = () => {
    const value = draft.trim();
    if (!editing || !value) return;
    replaceOptions(
      {
        ...options,
        [group.key]: values.map((item) => (item === editing ? value : item))
      },
      { groupKey: group.key, from: editing, to: value }
    );
    setEditing(null);
    setDraft("");
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-[#13213a] dark:text-white">{group.label}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{values.length} options</p>
        </div>
      </div>

      <form className="mb-3 flex gap-2" onSubmit={addOption}>
        <input
          className="field"
          placeholder={`Add ${group.singular}`}
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
        />
        <button className="btn btn-primary w-11 px-0" type="submit" aria-label={`Add ${group.singular}`}>
          <Plus size={18} />
        </button>
      </form>

      <div className="space-y-2">
        {values.map((value) => (
          <div key={value} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
            {editing === value ? (
              <input className="field h-9" value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus />
            ) : (
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">{value}</span>
            )}

            {editing === value ? (
              <>
                <button className="btn h-9 w-9 px-0" type="button" onClick={saveEdit} aria-label="Save option">
                  <Check size={16} />
                </button>
                <button className="btn h-9 w-9 px-0" type="button" onClick={() => setEditing(null)} aria-label="Cancel option edit">
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <button className="btn h-9 w-9 px-0" type="button" onClick={() => startEdit(value)} aria-label={`Edit ${value}`}>
                  <Pencil size={16} />
                </button>
                <button className="btn btn-danger h-9 w-9 px-0" type="button" onClick={() => deleteOption(value)} aria-label={`Delete ${value}`}>
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ))}

        {!values.length ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No options yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
