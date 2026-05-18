import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Eye, EyeOff, LogIn, LogOut, Moon, Phone, Plus, Search, Settings, Sun, Table2, User } from "lucide-react";
import CalendarView from "./components/CalendarView.jsx";
import ScheduleTable from "./components/ScheduleTable.jsx";
import ScheduleFormModal from "./components/ScheduleFormModal.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import { useSchedules } from "./context/ScheduleContext.jsx";
import { getWeekStart } from "./utils/schedule.js";

const defaultFilters = {
  query: "",
  room: "",
  study: "",
  coordinator: "",
  date: ""
};

const defaultPassword = "HMRG2026";
const loginUsers = [
  { name: "Marc Tytus", email: "Marc.Tytus@hmrg.org", role: "Administrator" },
  { name: "Joe Ding", email: "Joe.Ding@hmrg.org", role: "Administrator" },
  { name: "Ana Walber", email: "Ana.Walber@hmrg.org", role: "User" },
  { name: "Christina Shamshoom", email: "Christina.Shamshoom@hmrg.org", role: "User" },
  { name: "Rick Tytus", email: "rick.tytus@hmrg.org", role: "User" },
  { name: "Rod Butt", email: "rod.butt@hmcg.org", role: "User" },
  { name: "Musician 5th", email: "musician5th@hotmail.com", role: "User" }
];

const roomColorThemes = {
  "Room 1": {
    accent: "#5f8f8b",
    bg: "rgba(226, 242, 239, 0.9)",
    border: "rgba(95, 143, 139, 0.42)",
    ink: "#2f6a64"
  },
  "Room 2": {
    accent: "#b9855f",
    bg: "rgba(249, 238, 226, 0.92)",
    border: "rgba(185, 133, 95, 0.44)",
    ink: "#8a5d38"
  },
  "Room 3": {
    accent: "#6f83bd",
    bg: "rgba(229, 235, 249, 0.92)",
    border: "rgba(111, 131, 189, 0.44)",
    ink: "#415a96"
  },
  "Room 4": {
    accent: "#7f9a68",
    bg: "rgba(235, 243, 228, 0.92)",
    border: "rgba(127, 154, 104, 0.44)",
    ink: "#536f3d"
  },
  "Room 5": {
    accent: "#6b8fbf",
    bg: "rgba(226, 238, 250, 0.93)",
    border: "rgba(107, 143, 191, 0.46)",
    ink: "#315f99"
  },
  "Room 6": {
    accent: "#9a72b6",
    bg: "rgba(242, 232, 249, 0.93)",
    border: "rgba(154, 114, 182, 0.46)",
    ink: "#744b91"
  },
  "Room 7": {
    accent: "#c28a4d",
    bg: "rgba(250, 239, 222, 0.94)",
    border: "rgba(194, 138, 77, 0.5)",
    ink: "#8b5e2f"
  },
  "Room 8": {
    accent: "#4f9a9d",
    bg: "rgba(224, 242, 243, 0.93)",
    border: "rgba(79, 154, 157, 0.46)",
    ink: "#246e72"
  }
};

const roomColorTheme = (room) => roomColorThemes[room] || roomColorThemes["Room 4"];

const roomThemeStyle = (room) => {
  const theme = roomColorTheme(room);
  return {
    "--room-accent": theme.accent,
    "--room-bg": theme.bg,
    "--room-border": theme.border,
    "--room-ink": theme.ink
  };
};

const roomNumber = (room) => Number(String(room).match(/\d+/)?.[0] || 999);
const sortedRooms = (rooms) => [...new Set(rooms)].sort((a, b) => roomNumber(a) - roomNumber(b) || a.localeCompare(b));
const addableRooms = (rooms) => ["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6", "Room 7", "Room 8"].filter((room) => !rooms.includes(room));

export default function App() {
  const { schedules, options, error, conflictNotice, setError, setConflictNotice, replaceOptions } = useSchedules();
  const [view, setView] = useState("calendar");
  const [filters, setFilters] = useState(defaultFilters);
  const [activeRoom, setActiveRoom] = useState("Room 6");
  const [searchText, setSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "asc" });
  const [modalSchedule, setModalSchedule] = useState(null);
  const [pendingModalSchedules, setPendingModalSchedules] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginDraft, setLoginDraft] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(window.localStorage?.getItem("hmrg:current-user") || "null");
    } catch {
      return null;
    }
  });
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [addRoomMenuOpen, setAddRoomMenuOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState("week");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage?.getItem("hmrg:dark");
    if (saved !== null) return saved === "true";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
  });
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const searchInputRef = useRef(null);
  const addRoomRef = useRef(null);
  const templateRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;
    const syncTheme = (event) => {
      if (window.localStorage?.getItem("hmrg:dark") === null) setDarkMode(event.matches);
    };
    media.addEventListener?.("change", syncTheme);
    return () => media.removeEventListener?.("change", syncTheme);
  }, []);

  useEffect(() => {
    const closeMenus = (event) => {
      if (addRoomRef.current && !addRoomRef.current.contains(event.target)) setAddRoomMenuOpen(false);
      if (templateRef.current && !templateRef.current.contains(event.target)) setTemplateMenuOpen(false);
    };
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, []);

  const filteredSchedules = useMemo(() => {
    const query = filters.query.toLowerCase();
    const filtered = schedules
      .filter((schedule) => {
        const haystack = [
          schedule.patientId,
          schedule.room,
          schedule.study,
          schedule.coordinator,
          schedule.date
        ]
          .join(" ")
          .toLowerCase();

        if (query && !haystack.includes(query)) return false;
        if (activeRoom && schedule.room !== activeRoom) return false;
        if (filters.room && schedule.room !== filters.room) return false;
        if (filters.study && schedule.study !== filters.study) return false;
        if (filters.coordinator && schedule.coordinator !== filters.coordinator) return false;
        if (filters.date && schedule.date !== filters.date) return false;
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
  }, [schedules, filters, sortConfig, activeRoom]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const requestSort = (key) =>
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  const activeSection = modalSchedule && !modalSchedule.id ? "add" : view;
  const openScheduleModal = (payload) => {
    if (Array.isArray(payload)) {
      const [first, ...rest] = payload;
      setModalSchedule(first || null);
      setPendingModalSchedules(rest);
      return;
    }
    setModalSchedule(payload);
    setPendingModalSchedules([]);
  };
  const closeScheduleModal = () => {
    setModalSchedule(null);
    setPendingModalSchedules([]);
  };
  const completeScheduleModal = () => {
    setPendingModalSchedules((current) => {
      const [next, ...rest] = current;
      setModalSchedule(next || null);
      return rest;
    });
  };
  const submitLogin = (event) => {
    event.preventDefault();
    const user = loginUsers.find((item) => item.email.toLowerCase() === loginDraft.email.trim().toLowerCase());
    if (!user || loginDraft.password !== defaultPassword) {
      setLoginError("Username or password is incorrect");
      return;
    }
    setCurrentUser(user);
    window.localStorage?.setItem("hmrg:current-user", JSON.stringify(user));
    if (window.PasswordCredential && navigator.credentials?.store) {
      const credential = new PasswordCredential({ id: user.email, name: user.name, password: loginDraft.password });
      navigator.credentials.store(credential).catch(() => {});
    }
    event.currentTarget.submit();
    setLoginOpen(false);
    setLoginError("");
    setLoginDraft({ email: "", password: "" });
    setLoginPasswordVisible(false);
  };
  const logout = () => {
    setCurrentUser(null);
    window.localStorage?.removeItem("hmrg:current-user");
  };

  if (!currentUser) {
    return (
      <main className={darkMode ? "dark min-h-screen bg-slate-950 text-slate-100" : "min-h-screen bg-[#f6f8f8] text-[#13213a]"}>
        <LoginModal
          required
          draft={loginDraft}
          error={loginError}
          passwordVisible={loginPasswordVisible}
          onChange={setLoginDraft}
          onTogglePassword={() => setLoginPasswordVisible((visible) => !visible)}
          onClose={() => {}}
          onSubmit={submitLogin}
        />
      </main>
    );
  }

  return (
    <main className={darkMode ? "dark min-h-screen bg-slate-950 text-slate-100" : "min-h-screen bg-[#f6f8f8] text-[#13213a]"}>
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6">
        <header className="panel relative overflow-hidden p-6">
          <div className="relative z-10">
          <nav className="mb-8 flex items-center gap-2 rounded-[18px] border border-blue-100 bg-blue-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/80">
            <img
              className="h-[87px] w-[147px] object-contain"
              src="/brand-logo-mark.png"
              alt="Hamilton Medical Research Group logo"
            />
            <p className="mr-auto min-w-80 whitespace-nowrap text-[19.5px] font-extrabold uppercase tracking-[0.18em] text-[#176f73] dark:text-white">
              Hamilton Medical Research Group
            </p>
            <button className="btn" onClick={() => setContactOpen(true)}>
              <Phone size={17} />
              Contact
            </button>
            <button className="btn" onClick={() => setSettingsOpen(true)}>
              <Settings size={17} />
              Settings
            </button>
          </nav>
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <h1 className="whitespace-nowrap text-[32px] font-bold leading-[1.02] tracking-[-0.04em] text-[#13213a] dark:text-white sm:text-5xl lg:text-[54px]">
              Clinical Research Scheduler
            </h1>
            <div className="flex shrink-0 items-center gap-2">
              {currentUser ? (
                <>
                  <div className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-extrabold text-[#13213a] shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                    <User size={17} />
                    <span>{currentUser.name}</span>
                    <span className="border-l border-slate-200 pl-2 text-[11px] uppercase tracking-wider text-[#176f73] dark:border-slate-700 dark:text-teal-200">
                      {currentUser.role}
                    </span>
                  </div>
                  <button className="btn min-h-[63px] border-rose-700 bg-gradient-to-br from-rose-700 to-rose-950 px-6 text-[27px] font-extrabold text-white shadow-[0_18px_34px_rgba(180,35,74,0.28)] hover:border-slate-300 hover:bg-slate-100 hover:bg-none hover:text-rose-950 hover:shadow-[0_18px_34px_rgba(19,33,58,0.14)]" onClick={logout}>
                    <LogOut size={25} />
                    Logout
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setLoginOpen(true)}>
                  <LogIn size={17} />
                  Log In
                </button>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              className="btn"
              onClick={() =>
                setDarkMode((enabled) => {
                  window.localStorage?.setItem("hmrg:dark", String(!enabled));
                  return !enabled;
                })
              }
              title="Toggle dark mode"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              Theme
            </button>
            <div className="relative" ref={templateRef}>
              <button className="btn" onClick={() => setTemplateMenuOpen((open) => !open)}>
                <CalendarDays size={17} />
                Week/Month Template
              </button>
              {templateMenuOpen ? (
                <div className="absolute left-1/2 z-[60] mt-0 w-40 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#13213a] shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <button
                    className="block w-full px-3 py-2.5 text-left leading-tight hover:bg-teal-50 hover:text-[#176f73] dark:hover:bg-slate-800"
                    onClick={() => {
                      setCalendarMode("week");
                      setView("calendar");
                      setWeekStart(getWeekStart(new Date()));
                      setTemplateMenuOpen(false);
                    }}
                  >
                    Weekly Template
                  </button>
                  <button
                    className="block w-full px-3 py-2.5 text-left leading-tight hover:bg-teal-50 hover:text-[#176f73] dark:hover:bg-slate-800"
                    onClick={() => {
                      setCalendarMode("month");
                      setView("calendar");
                      setWeekStart(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                      setTemplateMenuOpen(false);
                    }}
                  >
                    Monthly Template
                  </button>
                </div>
              ) : null}
            </div>
          </div>
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
          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,minmax(0,0.75fr))_minmax(0,0.7fr)_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                ref={searchInputRef}
                className="field pl-10"
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
            <input className="field" type="date" value={filters.date} onChange={(event) => updateFilter("date", event.target.value)} />
            <button className="btn btn-primary" onClick={() => updateFilter("query", searchText)}>
              <Search size={17} />
              Search
            </button>
          </div>
        </section>

        <section
          className="panel room-linked flex flex-wrap gap-2 p-3"
          style={roomThemeStyle(activeRoom)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const room = event.dataTransfer.getData("application/x-hmrg-add-room");
            if (!room) return;
            replaceOptions({ ...options, rooms: sortedRooms([...options.rooms, room]) });
            setActiveRoom(room);
            setAddRoomMenuOpen(false);
          }}
        >
          {sortedRooms(options.rooms).map((room) => (
            <button
              key={room}
              className={`room-btn ${activeRoom === room ? "active" : ""}`}
              style={roomThemeStyle(room)}
              draggable
              title="Drag to + Add Room to remove"
              onDragStart={(event) => event.dataTransfer.setData("application/x-hmrg-room", room)}
              onClick={() => {
                setActiveRoom(room);
                updateFilter("room", "");
              }}
            >
              {room}
            </button>
          ))}
          <div className="relative" ref={addRoomRef}>
            <button
              className="room-btn border-dashed"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const room = event.dataTransfer.getData("application/x-hmrg-room");
                if (!room) return;
                const nextRooms = sortedRooms(options.rooms.filter((item) => item !== room));
                replaceOptions({ ...options, rooms: nextRooms });
                setActiveRoom(nextRooms[0] || "");
                setAddRoomMenuOpen(false);
              }}
              onClick={() => setAddRoomMenuOpen((open) => !open)}
            >
              + Add Room
            </button>
            {addRoomMenuOpen ? (
              <div className="absolute left-0 z-20 mt-2 min-w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-xl dark:border-slate-700 dark:bg-slate-900">
                {addableRooms(options.rooms).length ? (
                  addableRooms(options.rooms).map((room) => (
                    <button
                      key={room}
                      draggable
                      className="block w-full px-4 py-3 text-left hover:bg-teal-50 hover:text-[#176f73] dark:hover:bg-slate-800"
                      onDragStart={(event) => event.dataTransfer.setData("application/x-hmrg-add-room", room)}
                      onClick={() => {
                        replaceOptions({ ...options, rooms: sortedRooms([...options.rooms, room]) });
                        setActiveRoom(room);
                        setAddRoomMenuOpen(false);
                      }}
                    >
                      {room}
                    </button>
                  ))
                ) : (
                  <span className="block px-4 py-3 text-slate-500">All rooms added</span>
                )}
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel room-linked flex flex-wrap items-center justify-between gap-3 p-3" style={roomThemeStyle(activeRoom)}>
          <div className="flex flex-wrap gap-2">
            <button
              className={`btn ${activeSection === "calendar" ? "btn-primary" : ""}`}
              onClick={() => setView("calendar")}
            >
              <CalendarDays size={17} />
              Calendar
            </button>
            <button className={`btn ${activeSection === "add" ? "btn-primary" : ""}`} onClick={() => openScheduleModal({ room: activeRoom, lockRoom: true })}>
              <Plus size={17} />
              Add Visit
            </button>
            <button
              className={`btn ${activeSection === "table" ? "btn-primary" : ""}`}
              onClick={() => setView("table")}
            >
              <Table2 size={17} />
              Scheduled Visits
            </button>
          </div>
          <p className="px-2 text-sm font-bold text-slate-500 dark:text-slate-400">{filteredSchedules.length} schedule records</p>
        </section>

        {view === "calendar" ? (
          <CalendarView
            schedules={filteredSchedules}
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            calendarMode={calendarMode}
            activeRoom={activeRoom}
            onEdit={setModalSchedule}
            onAdd={openScheduleModal}
          />
        ) : (
          <ScheduleTable schedules={filteredSchedules} onEdit={setModalSchedule} sortConfig={sortConfig} onSort={requestSort} />
        )}
      </div>

      <ScheduleFormModal schedule={modalSchedule} onClose={closeScheduleModal} onSaved={completeScheduleModal} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {contactOpen ? <ContactPanel onClose={() => setContactOpen(false)} /> : null}
      {loginOpen ? (
        <LoginModal
          draft={loginDraft}
          error={loginError}
          passwordVisible={loginPasswordVisible}
          onChange={setLoginDraft}
          onTogglePassword={() => setLoginPasswordVisible((visible) => !visible)}
          onClose={() => {
            setLoginOpen(false);
            setLoginError("");
            setLoginDraft({ email: "", password: "" });
            setLoginPasswordVisible(false);
          }}
          onSubmit={submitLogin}
        />
      ) : null}
    </main>
  );
}

function ContactPanel({ onClose }) {
  const contacts = [
    ["Marc Tytus", "(289) 205-3727"],
    ["Joe Ding", "(289) 270-8110"]
  ];
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-slate-950/40">
      <aside className="mt-6 h-auto w-full max-w-[410px] self-start rounded-l-[18px] border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex items-center justify-start gap-[clamp(105px,32vw,150px)]">
          <div>
            <h2 className="text-2xl font-bold">Contact</h2>
          </div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="grid gap-3 pb-14">
          {contacts.map(([name, phone]) => (
            <div key={name} className="block text-[17px] font-extrabold leading-7 text-[#1d3f72] dark:text-white">
              {name}: {phone}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function LoginModal({ draft, error, onChange, onClose, onSubmit, onTogglePassword, passwordVisible = false, required = false }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
      <iframe className="absolute h-0 w-0 border-0 opacity-0" name="password-save-frame" title="Password save helper" />
      <form className="panel w-full max-w-lg p-6" autoComplete="on" method="post" action="/password-save" target="password-save-frame" onSubmit={onSubmit}>
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#13213a] dark:text-white">Log In</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use your approved scheduler account.</p>
          </div>
          {required ? null : <button type="button" className="btn" onClick={onClose}>Close</button>}
        </div>
        <div className="grid gap-4">
          <label>
            <span className="label">Username / Email</span>
            <input
              id="login-email"
              name="username"
              className="field mt-2"
              type="email"
              autoComplete="username"
              value={draft.email}
              onChange={(event) => onChange((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            <span className="label">Password</span>
            <div className="mt-2 flex gap-2">
              <input
                id="login-password"
                name="password"
                className="field"
                type={passwordVisible ? "text" : "password"}
                autoComplete="current-password"
                value={draft.password}
                onChange={(event) => onChange((current) => ({ ...current, password: event.target.value }))}
              />
              <button type="button" className="btn min-w-20" onClick={onTogglePassword}>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-700/10 text-[#176f73] dark:bg-white/10 dark:text-white">
                  {passwordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </span>
                {passwordVisible ? "Hide" : "View"}
              </button>
            </div>
          </label>
        </div>
        {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800">
          {required ? null : <button type="button" className="btn" onClick={onClose}>Cancel</button>}
          <button type="submit" className="btn btn-primary">
            <LogIn size={17} />
            Log In
          </button>
        </div>
      </form>
    </div>
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
