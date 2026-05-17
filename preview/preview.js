const SCHEDULE_KEY = "hmrg:schedules";
const OPTIONS_KEY = "hmrg:options";

const defaultOptions = {
  rooms: ["Room 4", "Room 5", "Room 6", "Room 7"],
  studies: ["ROXIATLAS", "WC45725", "NN7910 REDEFINE"],
  coordinators: ["Joe", "Analysis", "Stephanie", "Shiela"],
  status: ["Booked", "Pending", "Done"]
};

const fields = [
  ["date", "Date", "date"],
  ["startTime", "Start", "time"],
  ["endTime", "End", "time"],
  ["room", "Room", "rooms"],
  ["study", "Study", "studies"],
  ["patientId", "Patient ID", "text"],
  ["coordinator", "Coordinator", "coordinators"],
  ["status", "Status", "status"]
];

const groups = [
  ["rooms", "Rooms", "Room", "room"],
  ["studies", "Studies", "Study", "study"],
  ["coordinators", "Coordinators", "Coordinator", "coordinator"],
  ["status", "Status", "Status", "status"]
];

const today = new Date();
const dateInput = (date) => date.toISOString().slice(0, 10);
const addDays = (days) => {
  const date = new Date(today);
  date.setDate(today.getDate() + days);
  return dateInput(date);
};

const starterSchedules = [
  {
    id: crypto.randomUUID(),
    date: addDays(0),
    startTime: "09:00",
    endTime: "10:15",
    room: "Room 4",
    study: "ROXIATLAS",
    patientId: "HMRG-1042",
    coordinator: "Joe",
    status: "Booked"
  },
  {
    id: crypto.randomUUID(),
    date: addDays(1),
    startTime: "11:30",
    endTime: "12:30",
    room: "Room 5",
    study: "WC45725",
    patientId: "HMRG-2088",
    coordinator: "Stephanie",
    status: "Pending"
  },
  {
    id: crypto.randomUUID(),
    date: addDays(2),
    startTime: "14:00",
    endTime: "15:00",
    room: "Room 6",
    study: "NN7910 REDEFINE",
    patientId: "HMRG-3171",
    coordinator: "Shiela",
    status: "Done"
  }
];

let schedules = read(SCHEDULE_KEY, starterSchedules);
let options = read(OPTIONS_KEY, defaultOptions);
let view = "calendar";
let filters = { query: "", room: "", study: "", coordinator: "", startDate: "", endDate: "" };
let searchText = filters.query;
let sortConfig = { key: "date", direction: "asc" };
let weekStart = getWeekStart(new Date());
let modalSchedule = null;
let inlineId = "";
let inlineDraft = {};
let error = "";
let conflictNotice = "";
let selectedSlots = [];
let settingsOpen = false;

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function minutes(value) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

function validate(candidate, ignoreId = "") {
  const required = [
    ["date", "Date"],
    ["startTime", "Start time"],
    ["endTime", "End time"],
    ["room", "Room"],
    ["study", "Study"],
    ["patientId", "Patient ID"],
    ["coordinator", "Coordinator"],
    ["status", "Status"]
  ];
  const missing = required.filter(([key]) => !String(candidate[key] || "").trim()).map(([, label]) => label);
  if (missing.length) return `Please complete all booking details: ${missing.join(", ")}`;
  if (minutes(candidate.endTime) <= minutes(candidate.startTime)) return "End time must be after start time";
  const start = minutes(candidate.startTime);
  const end = minutes(candidate.endTime);
  const conflict = schedules.some((schedule) => {
    if (schedule.id === ignoreId) return false;
    if (schedule.date !== candidate.date || schedule.room !== candidate.room) return false;
    return start < minutes(schedule.endTime) && end > minutes(schedule.startTime);
  });
  return conflict ? "Room already booked for this time range" : "";
}

function conflictAlert(candidate, ignoreId = "") {
  const openRooms = (options.rooms || []).filter((room) => {
    if (room === candidate.room) return false;
    return !validate({ ...candidate, room }, ignoreId);
  });
  const alternatives = openRooms.length
    ? `Available room options for this time: ${openRooms.join(", ")}.`
    : "No other rooms are open for this exact time. Try a different time range or date.";
  conflictNotice = `Room already booked for this time range.\n\n${alternatives}`;
}

function getWeekStart(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day + (day === 0 ? -6 : 1));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function weekDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

function filteredSchedules() {
  const query = filters.query.toLowerCase();
  return schedules
    .filter((schedule) => {
      const text = Object.values(schedule).join(" ").toLowerCase();
      if (query && !text.includes(query)) return false;
      if (filters.room && schedule.room !== filters.room) return false;
      if (filters.study && schedule.study !== filters.study) return false;
      if (filters.coordinator && schedule.coordinator !== filters.coordinator) return false;
      if (filters.startDate && schedule.date < filters.startDate) return false;
      if (filters.endDate && schedule.date > filters.endDate) return false;
      return true;
    })
    .sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const primary = String(a[sortConfig.key] || "").localeCompare(String(b[sortConfig.key] || ""), undefined, {
        numeric: true,
        sensitivity: "base"
      });
      if (primary !== 0) return primary * direction;
      return `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
    });
}

function select(key, value = "", label = "") {
  return `<select class="field" data-filter="${key}">
    <option value="">All ${label}</option>
    ${(options[key] || []).map((item) => `<option value="${escapeHtml(item)}" ${value === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
  </select>`;
}

function optionSelect(field, groupKey, value) {
  const values = [...(options[groupKey] || [])];
  if (value && !values.includes(value)) values.unshift(value);
  return `<select class="field" data-field="${field}">
    ${values.map((item) => `<option value="${escapeHtml(item)}" ${value === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
  </select>`;
}

function icon(name) {
  const attrs = `class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
  const icons = {
    theme: `<svg ${attrs}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"/></svg>`,
    export: `<svg ${attrs}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 19h14"/></svg>`,
    calendar: `<svg ${attrs}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/><path d="M8 14h2"/><path d="M12 14h2"/><path d="M8 18h2"/><path d="M12 18h2"/></svg>`,
    reset: `<svg ${attrs}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></svg>`,
    settings: `<svg ${attrs}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>`,
    add: `<svg ${attrs}><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
    search: `<svg ${attrs}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>`,
    table: `<svg ${attrs}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M9 4v16"/></svg>`
  };
  return icons[name] || "";
}

function render() {
  const list = filteredSchedules();
  document.body.classList.toggle("dark", localStorage.getItem("hmrg:dark") === "true");
  document.querySelector("#app").innerHTML = `
    <main class="shell">
      ${conflictNotice ? `<div class="top-alert"><div class="top-alert-head"><div><strong>${conflictNotice.startsWith("Room already booked") ? "Scheduling conflict" : "Required booking details"}</strong><p>${escapeHtml(conflictNotice)}</p></div><button class="btn" data-action="clear-conflict">Dismiss</button></div></div>` : ""}
      <section class="topbar">
        <div>
          <p class="brand">Hamilton Medical Research Group</p>
          <h1>Clinical Research Scheduler</h1>
        </div>
        <div class="actions">
          <button class="btn" data-action="theme">${icon("theme")}Theme</button>
          <button class="btn" data-action="export">${icon("export")}Export CSV</button>
          <button class="btn" data-action="template">${icon("calendar")}Week Template</button>
          <button class="btn" data-action="reset">${icon("reset")}Reset</button>
          <button class="btn" data-action="settings">${icon("settings")}Settings</button>
          <button class="btn primary" data-action="add">${icon("add")}Add Visit</button>
        </div>
      </section>
      <div class="error ${error ? "visible" : ""}">${escapeHtml(error)} <button class="btn" data-action="clear-error">Dismiss</button></div>
      <section class="filters">
        <label class="search-field">${icon("search")}<input class="field" placeholder="Search patient, room, study, coordinator" value="${escapeAttr(searchText)}" data-search-input="true" /></label>
        ${select("rooms", filters.room, "Room")}
        ${select("studies", filters.study, "Study")}
        ${select("coordinators", filters.coordinator, "Coordinator")}
        <input class="field" type="date" value="${filters.startDate}" data-filter="startDate" />
        <input class="field" type="date" value="${filters.endDate}" data-filter="endDate" />
        <button class="btn primary" data-action="focus-search">${icon("search")}Search</button>
      </section>
      <section class="viewbar">
        <div class="tabs">
          <button class="btn ${view === "calendar" ? "active" : ""}" data-view="calendar">${icon("calendar")}Calendar</button>
          <button class="btn ${view === "table" ? "active" : ""}" data-view="table">${icon("table")}Scheduled Visits</button>
        </div>
        <p>${list.length} schedule records</p>
      </section>
      ${view === "calendar" ? calendar(list) : table(list)}
    </main>
    ${modal()}
    ${settings()}
  `;
}

function table(list) {
  return `<section class="panel table-wrap"><table>
    <thead><tr>${fields.map(([key, label]) => `<th><button class="sort-head" data-action="sort" data-key="${key}">${label} <span>${sortConfig.key === key ? (sortConfig.direction === "asc" ? "ASC" : "DESC") : "SORT"}</span></button></th>`).join("")}<th>Actions</th></tr></thead>
    <tbody>${list.length ? list.map(row).join("") : `<tr><td colspan="9">No schedules match the current filters.</td></tr>`}</tbody>
  </table></section>`;
}

function row(schedule) {
  const editing = inlineId === schedule.id;
  const data = editing ? inlineDraft : schedule;
  return `<tr>
    ${fields
      .map(([key, label, type]) => {
        if (!editing) return `<td>${key === "status" ? `<span class="badge">${escapeHtml(schedule[key])}</span>` : escapeHtml(schedule[key] || "-")}</td>`;
        if (options[type]) return `<td>${optionSelect(key, type, data[key])}</td>`;
        return `<td><input class="field" type="${type}" data-field="${key}" value="${escapeAttr(data[key] || "")}" /></td>`;
      })
      .join("")}
    <td><div class="row-actions">
      ${editing
        ? `<button class="btn" data-action="save-inline" data-id="${schedule.id}">Save</button><button class="btn" data-action="cancel-inline">Cancel</button>`
        : `<button class="btn" data-action="inline" data-id="${schedule.id}">Inline</button><button class="btn" data-action="edit" data-id="${schedule.id}">Edit</button><button class="btn danger" data-action="delete" data-id="${schedule.id}">Delete</button>`}
    </div></td>
  </tr>`;
}

function calendar(list) {
  const days = weekDays();
  return `<section class="panel">
    <div class="calendar-head">
      <div><h2>Weekly Calendar</h2><p>${formatDay(days[0])} - ${formatDay(days[6])}</p></div>
      <div class="row-actions">
        <button class="btn" data-action="prev-week">Prev</button>
        <button class="btn" data-action="today">Today</button>
        <button class="btn" data-action="next-week">Next</button>
      </div>
    </div>
    <div class="calendar-grid">
      <div class="time-col"><div class="time-head"></div>${Array.from({ length: 12 }, (_, i) => `<div class="time-slot">${String(i + 7).padStart(2, "0")}:00</div>`).join("")}</div>
      ${days.map((day) => dayColumn(day, list)).join("")}
    </div>
  </section>`;
}

function dayColumn(day, list) {
  const date = dateInput(day);
  const dayItems = list.filter((item) => item.date === date);
  return `<div class="day-col" data-drop-date="${date}">
    <div class="day-title"><strong>${formatDay(day)}</strong><br /><small>${dayItems.length} visits</small></div>
    <div class="day-body">${Array.from({ length: 12 }, (_, index) => {
      const hour = index + 7;
      const selected = selectedSlots.includes(slotKey(date, hour)) ? " selected" : "";
      return `<button type="button" class="day-line${selected}" data-action="add-slot" data-date="${date}" data-hour="${hour}" aria-label="Select visit slot ${date} at ${String(hour).padStart(2, "0")}:00"></button>`;
    }).join("")}${dayItems.map(eventBlock).join("")}</div>
  </div>`;
}

function slotKey(date, hour) {
  return `${date}-${hour}`;
}

function toggleSlot(date, hour) {
  const key = slotKey(date, hour);
  selectedSlots = selectedSlots.includes(key)
    ? selectedSlots.filter((item) => item !== key)
    : [...selectedSlots, key];
}

function selectedRangeForDate(date, clickedHour) {
  const selectedHours = selectedSlots
    .map((key) => {
      const separator = key.lastIndexOf("-");
      const slotDate = key.slice(0, separator);
      const slotHour = Number(key.slice(separator + 1));
      return slotDate === date ? slotHour : null;
    })
    .filter((hour) => Number.isFinite(hour));
  const hours = selectedHours.includes(clickedHour) ? selectedHours : [clickedHour];
  const start = Math.min(...hours);
  const end = Math.max(...hours) + 1;
  return {
    startTime: `${String(start).padStart(2, "0")}:00`,
    endTime: `${String(end).padStart(2, "0")}:00`
  };
}

function eventBlock(schedule) {
  const top = Math.max(0, ((minutes(schedule.startTime) - 420) / 720) * 100);
  const height = Math.max(7, ((minutes(schedule.endTime) - minutes(schedule.startTime)) / 720) * 100);
  return `<button draggable="true" class="event ${schedule.status.toLowerCase()}" data-action="edit" data-id="${schedule.id}" data-drag-id="${schedule.id}" style="top:${top}%;height:${height}%">
    <strong>${schedule.startTime} ${escapeHtml(schedule.room)}</strong><br />
    ${escapeHtml(schedule.study)}<br />
    <small>${escapeHtml(schedule.patientId || "Template slot")}</small>
  </button>`;
}

function modal() {
  if (!modalSchedule) return "";
  const data = modalSchedule.id
    ? modalSchedule
    : {
        date: modalSchedule.date || dateInput(new Date()),
        startTime: modalSchedule.startTime || "09:00",
        endTime: modalSchedule.endTime || "10:00",
        room: options.rooms[0] || "",
        study: options.studies[0] || "",
        patientId: "",
        coordinator: options.coordinators[0] || "",
        status: options.status[0] || "Pending"
      };
  return `<div class="overlay visible"><form class="modal" data-form="schedule">
    <div class="modal-head"><div><h2>${data.id ? "Edit Schedule" : "Add Schedule"}</h2><p>Clinical visit booking details</p></div><button type="button" class="btn" data-action="close-modal">Close</button></div>
    <div class="form-grid">${fields
      .map(([key, label, type]) => `<label><span>${label}</span>${options[type] ? optionSelect(key, type, data[key]) : `<input class="field" type="${type}" data-field="${key}" value="${escapeAttr(data[key] || "")}" />`}</label>`)
      .join("")}</div>
    <div class="modal-actions"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save Schedule</button></div>
  </form></div>`;
}

function settings() {
  return `<div class="drawer ${settingsOpen ? "visible" : ""}" id="settings"><aside class="settings">
    <div class="settings-head"><div><h2>Settings</h2><p>Manage editable dropdown values used across the scheduler.</p></div><button class="btn" data-action="close-settings">Close</button></div>
    ${groups.map(manager).join("")}
  </aside></div>`;
}

function manager([key, label, singular]) {
  return `<section class="manager"><h3>${label}</h3><p>${(options[key] || []).length} options</p>
    <div class="add-row"><input class="field" placeholder="Add ${singular}" data-new="${key}" /><button class="btn primary" data-action="add-option" data-group="${key}">Add</button></div>
    ${(options[key] || [])
      .map(
        (item) => `<div class="option-row"><span>${escapeHtml(item)}</span><button class="btn" data-action="rename-option" data-group="${key}" data-value="${escapeAttr(item)}">Edit</button><button class="btn danger" data-action="delete-option" data-group="${key}" data-value="${escapeAttr(item)}">Delete</button></div>`
      )
      .join("")}
  </section>`;
}

function saveScheduleFromForm(form) {
  const data = Object.fromEntries(fields.map(([key]) => [key, form.querySelector(`[data-field="${key}"]`).value]));
  const candidate = { ...data, id: modalSchedule.id };
  const validation = validate(candidate, modalSchedule.id);
  if (validation) {
    error = validation;
    if (validation === "Room already booked for this time range") conflictAlert(candidate, modalSchedule.id);
    else conflictNotice = validation;
    render();
    return;
  }
  if (modalSchedule.id) {
    schedules = schedules.map((item) => (item.id === modalSchedule.id ? candidate : item));
  } else {
    schedules = [...schedules, { ...candidate, id: crypto.randomUUID() }];
  }
  write(SCHEDULE_KEY, schedules);
  error = "";
  modalSchedule = null;
  render();
}

document.addEventListener("input", (event) => {
  if (event.target.dataset.searchInput) {
    searchText = event.target.value;
    return;
  }
  const filter = event.target.dataset.filter;
  if (filter) {
    const key = filter === "rooms" ? "room" : filter === "studies" ? "study" : filter === "coordinators" ? "coordinator" : filter;
    filters[key] = event.target.value;
    render();
  }
  if (inlineId && event.target.dataset.field) {
    inlineDraft = { ...inlineDraft, [event.target.dataset.field]: event.target.value };
  }
});

document.addEventListener("keydown", (event) => {
  if (event.target.dataset.searchInput && event.key === "Enter") {
    filters.query = searchText;
    render();
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.dataset.form === "schedule") {
    event.preventDefault();
    saveScheduleFromForm(event.target);
  }
});

document.addEventListener("dragstart", (event) => {
  if (event.target.dataset.dragId) event.dataTransfer.setData("text/plain", event.target.dataset.dragId);
});

document.addEventListener("dragover", (event) => {
  if (event.target.closest("[data-drop-date]")) event.preventDefault();
});

document.addEventListener("pointerdown", (event) => {
  const slot = event.target.closest('[data-action="add-slot"]');
  if (!slot || event.button !== 0) return;
  event.preventDefault();
  const hour = Number(slot.dataset.hour);
  toggleSlot(slot.dataset.date, hour);
  render();
});

document.addEventListener("contextmenu", (event) => {
  const slot = event.target.closest('[data-action="add-slot"]');
  if (!slot) return;
  event.preventDefault();
  const hour = Number(slot.dataset.hour);
  const key = slotKey(slot.dataset.date, hour);
  if (!selectedSlots.includes(key)) selectedSlots = [...selectedSlots, key];
  const range = selectedRangeForDate(slot.dataset.date, hour);
  modalSchedule = {
    date: slot.dataset.date,
    startTime: range.startTime,
    endTime: range.endTime
  };
  render();
});

document.addEventListener("drop", (event) => {
  const drop = event.target.closest("[data-drop-date]");
  if (!drop) return;
  const id = event.dataTransfer.getData("text/plain");
  const schedule = schedules.find((item) => item.id === id);
  if (!schedule) return;
  const candidate = { ...schedule, date: drop.dataset.dropDate };
    const validation = validate(candidate, id);
  if (validation) {
    error = validation;
    if (validation === "Room already booked for this time range") conflictAlert(candidate, id);
    else conflictNotice = validation;
  }
  else {
    schedules = schedules.map((item) => (item.id === id ? candidate : item));
    write(SCHEDULE_KEY, schedules);
  }
  render();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action], [data-view]");
  if (!button) return;
  const action = button.dataset.action;
  if (button.dataset.view) {
    view = button.dataset.view;
  } else if (action === "theme") {
    localStorage.setItem("hmrg:dark", String(localStorage.getItem("hmrg:dark") !== "true"));
  } else if (action === "settings") {
    settingsOpen = true;
    render();
    return;
  } else if (action === "close-settings") {
    settingsOpen = false;
    render();
    return;
  } else if (action === "add") {
    modalSchedule = {};
  } else if (action === "sort") {
    sortConfig = {
      key: button.dataset.key,
      direction: sortConfig.key === button.dataset.key && sortConfig.direction === "asc" ? "desc" : "asc"
    };
  } else if (action === "edit") {
    modalSchedule = schedules.find((item) => item.id === button.dataset.id);
  } else if (action === "delete") {
    schedules = schedules.filter((item) => item.id !== button.dataset.id);
    write(SCHEDULE_KEY, schedules);
  } else if (action === "inline") {
    inlineId = button.dataset.id;
    inlineDraft = schedules.find((item) => item.id === inlineId);
  } else if (action === "save-inline") {
    const validation = validate(inlineDraft, inlineId);
    if (validation) {
      error = validation;
      if (validation === "Room already booked for this time range") conflictAlert(inlineDraft, inlineId);
      else conflictNotice = validation;
    }
    else {
      schedules = schedules.map((item) => (item.id === inlineId ? inlineDraft : item));
      write(SCHEDULE_KEY, schedules);
      inlineId = "";
      inlineDraft = {};
      error = "";
    }
  } else if (action === "cancel-inline") {
    inlineId = "";
    inlineDraft = {};
  } else if (action === "close-modal") {
    modalSchedule = null;
  } else if (action === "prev-week" || action === "next-week") {
    weekStart.setDate(weekStart.getDate() + (action === "prev-week" ? -7 : 7));
  } else if (action === "today") {
    weekStart = getWeekStart(new Date());
  } else if (action === "clear-error") {
    error = "";
  } else if (action === "clear-conflict") {
    conflictNotice = "";
  } else if (action === "focus-search") {
    filters.query = searchText;
  } else if (action === "reset") {
    schedules = starterSchedules;
    options = defaultOptions;
    searchText = "";
    filters = { query: "", room: "", study: "", coordinator: "", startDate: "", endDate: "" };
    write(SCHEDULE_KEY, schedules);
    write(OPTIONS_KEY, options);
  } else if (action === "template") {
    addWeekTemplate();
  } else if (action === "export") {
    exportCsv(filteredSchedules());
  } else if (action === "add-option") {
    const input = document.querySelector(`[data-new="${button.dataset.group}"]`);
    const value = input.value.trim();
    if (value) {
      options = { ...options, [button.dataset.group]: [...(options[button.dataset.group] || []), value] };
      write(OPTIONS_KEY, options);
      settingsOpen = true;
    }
  } else if (action === "delete-option") {
    options = { ...options, [button.dataset.group]: options[button.dataset.group].filter((item) => item !== button.dataset.value) };
    write(OPTIONS_KEY, options);
    settingsOpen = true;
  } else if (action === "rename-option") {
    const next = prompt("Edit option label", button.dataset.value);
    if (next && next.trim()) {
      renameOption(button.dataset.group, button.dataset.value, next.trim());
      settingsOpen = true;
    }
  }
  render();
});

function renameOption(group, from, to) {
  const scheduleField = groups.find(([key]) => key === group)[3];
  options = { ...options, [group]: options[group].map((item) => (item === from ? to : item)) };
  schedules = schedules.map((item) => (item[scheduleField] === from ? { ...item, [scheduleField]: to } : item));
  write(OPTIONS_KEY, options);
  write(SCHEDULE_KEY, schedules);
}

function addWeekTemplate() {
  const generated = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      id: crypto.randomUUID(),
      date: dateInput(date),
      startTime: "08:30",
      endTime: "09:00",
      room: options.rooms[index % options.rooms.length] || "",
      study: options.studies[index % options.studies.length] || "",
      patientId: "",
      coordinator: options.coordinators[index % options.coordinators.length] || "",
      status: "Pending"
    };
  }).filter((item) => !validate(item));
  schedules = [...schedules, ...generated];
  write(SCHEDULE_KEY, schedules);
}

function exportCsv(list) {
  const headers = fields.map(([, label]) => label);
  const csv = [headers, ...list.map((item) => fields.map(([key]) => item[key] || ""))]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `clinical-schedule-${dateInput(new Date())}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDay(date) {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

render();
