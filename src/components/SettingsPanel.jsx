import { X } from "lucide-react";
import DropdownManager from "./DropdownManager.jsx";
import { optionGroups } from "../utils/schedule.js";

export default function SettingsPanel({ open, onClose }) {
  if (!open) return null;

  return (
    <aside className="fixed inset-0 z-30 flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#13213a] dark:text-white">Settings</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage editable dropdown values used across the scheduler.</p>
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
