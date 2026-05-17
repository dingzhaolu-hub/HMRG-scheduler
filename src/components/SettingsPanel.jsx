import { X } from "lucide-react";
import DropdownManager from "./DropdownManager.jsx";
import { optionGroups } from "../utils/schedule.js";

export default function SettingsPanel({ open, onClose }) {
  if (!open) return null;

  return (
    <aside className="fixed inset-0 z-30 flex justify-end bg-slate-950/35">
      <div className="flex h-full w-full max-w-xl flex-col border-l border-clinic-line bg-white shadow-panel dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-clinic-line p-5 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-clinic-ink dark:text-white">Settings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage editable dropdown values used across the scheduler.</p>
          </div>
          <button className="btn h-9 w-9 px-0" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {optionGroups.map((group) => (
            <DropdownManager key={group.key} group={group} />
          ))}
        </div>
      </div>
    </aside>
  );
}
