import { useMemo, useRef, useState } from "react";
import { CalendarDays, Download, Moon, Plus, RotateCcw, Search, Settings, Sun, Table2 } from "lucide-react";
import CalendarView from "./components/CalendarView.jsx";
import ScheduleTable from "./components/ScheduleTable.jsx";
import ScheduleFormModal from "./components/ScheduleFormModal.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import { useSchedules } from "./context/ScheduleContext.jsx";
import { exportSchedulesToCsv, getWeekStart } from "./utils/schedule.js";

const defaultFilters = {
  query: "",
  room: "",
  study: "",
  coordinator: "",
  startDate: "",
  endDate: ""
};

export default function App() {
  const { schedules, options, error, conflictNotice, setError, setConflictNotice, generateWeekTemplate, resetData } = useSchedules();
  const [view, setView] = useState("calendar");
  const [filters, setFilters] = useState(defaultFilters);
  const [searchText, setSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "asc" });
  const [modalSchedule, setModalSchedule] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const searchInputRef = useRef(null);

  const filteredSchedules = useMemo(() => {
    const query = filters.query.toLowerCase();
    const filtered = schedules
      .filter((schedule) => {
        const haystack = [
          schedule.patientId,
          schedule.room,
          schedule.study,
          schedule.coordinator,
          schedule.status,
          schedule.date
        ]
          .join(" ")
          .toLowerCase();

        if (query && !haystack.includes(query)) return false;
        if (filters.room && schedule.room !== filters.room) return false;
        if (filters.study && schedule.study !== filters.study) return false;
        if (filters.coordinator && schedule.coordinator !== filters.coordinator) return false;
        if (filters.startDate && schedule.date < filters.startDate) return false;
        if (filters.endDate && schedule.date > filters.endDate) return false;
        return true;
      });

    return filtered.sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const primary = String(a[sortConfig.key] || "").localeCompare(String(b[sortConfig.key] || ""), undefined, {
        numeric: true,
        sensitivity: "base"
      });
      if (primary !== 0) return primary * direction;
      return `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
    });
  }, [schedules, filters, sortConfig]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const requestSort = (key) =>
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));

  return (
    <main className={darkMode ? "dark min-h-screen bg-slate-950 text-slate-100" : "min-h-screen bg-clinic-mist text-slate-900"}>
      {conflictNotice ? (
        <div className="fixed left-1/2 top-3 z-[100] w-[min(92vw,760px)] -translate-x-1/2 rounded-lg border border-rose-300 bg-white p-4 text-sm text-rose-900 shadow-2xl dark:border-rose-700 dark:bg-slate-900 dark:text-rose-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">
                {conflictNotice.startsWith("Room already booked") ? "Scheduling conflict" : "Required booking details"}
              </p>
              <p className="mt-1 whitespace-pre-line">{conflictNotice}</p>
            </div>
            <button className="btn h-8 shrink-0 px-2" onClick={() => setConflictNotice("")}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-clinic-line pb-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-clinic-teal dark:text-teal-300">Hamilton Medical Research Group</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-clinic-ink dark:text-white sm:text-3xl">
              Clinical Research Scheduler
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn" onClick={() => setDarkMode((enabled) => !enabled)} title="Toggle dark mode">
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              Theme
            </button>
            <button className="btn" onClick={() => exportSchedulesToCsv(filteredSchedules)}>
              <Download size={17} />
              Export CSV
            </button>
            <button className="btn" onClick={() => generateWeekTemplate(weekStart)}>
              <CalendarDays size={17} />
              Week Template
            </button>
            <button className="btn" onClick={resetData}>
              <RotateCcw size={17} />
              Reset
            </button>
            <button className="btn" onClick={() => setSettingsOpen(true)}>
              <Settings size={17} />
              Settings
            </button>
            <button className="btn btn-primary" onClick={() => setModalSchedule({})}>
              <Plus size={17} />
              Add Visit
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">
            {error}
            <button className="ml-3 underline" onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        ) : null}

        <section className="panel p-4">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr)_auto)]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                ref={searchInputRef}
                className="field pl-9"
                placeholder="Search patient, room, study, coordinator"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") updateFilter("query", searchText);
                }}
              />
            </label>
            <FilterSelect label="Room" value={filters.room} values={options.rooms} onChange={(value) => updateFilter("room", value)} />
            <FilterSelect label="Study" value={filters.study} values={options.studies} onChange={(value) => updateFilter("study", value)} />
            <FilterSelect
              label="Coordinator"
              value={filters.coordinator}
              values={options.coordinators}
              onChange={(value) => updateFilter("coordinator", value)}
            />
            <input className="field" type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} />
            <input className="field" type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} />
            <button className="btn btn-primary h-10" onClick={() => updateFilter("query", searchText)}>
              <Search size={17} />
              Search
            </button>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-md border border-clinic-line bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              className={`btn h-9 border-0 ${view === "calendar" ? "bg-clinic-teal text-white hover:text-white" : ""}`}
              onClick={() => setView("calendar")}
            >
              <CalendarDays size={17} />
              Calendar
            </button>
            <button
              className={`btn h-9 border-0 ${view === "table" ? "bg-clinic-teal text-white hover:text-white" : ""}`}
              onClick={() => setView("table")}
            >
              <Table2 size={17} />
              Scheduled Visits
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{filteredSchedules.length} schedule records</p>
        </section>

        {view === "calendar" ? (
          <CalendarView
            schedules={filteredSchedules}
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            onEdit={setModalSchedule}
            onAdd={setModalSchedule}
          />
        ) : (
          <ScheduleTable schedules={filteredSchedules} onEdit={setModalSchedule} sortConfig={sortConfig} onSort={requestSort} />
        )}
      </div>

      <ScheduleFormModal schedule={modalSchedule} onClose={() => setModalSchedule(null)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}

function FilterSelect({ label, value, values, onChange }) {
  return (
    <select className="field" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">All {label}</option>
      {values.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}
