const SCHEDULE_KEY = "hmrg:schedules";
const OPTIONS_KEY = "hmrg:options";

export const defaultOptions = {
  rooms: ["Room 4", "Room 5", "Room 6", "Room 7"],
  studies: ["ROXIATLAS", "WC45725", "NN7910 REDEFINE"],
  coordinators: ["Joe", "Analysis", "Stephanie", "Shiela"],
  status: ["Booked", "Pending", "Done"]
};

const today = new Date();
const toDateInput = (date) => date.toISOString().slice(0, 10);
const addDays = (days) => {
  const next = new Date(today);
  next.setDate(today.getDate() + days);
  return toDateInput(next);
};

export const starterSchedules = [
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

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
};

export const getSchedules = () => readJson(SCHEDULE_KEY, starterSchedules);

export const addSchedule = (schedule) => {
  const schedules = getSchedules();
  const created = { ...schedule, id: crypto.randomUUID() };
  writeJson(SCHEDULE_KEY, [...schedules, created]);
  return created;
};

export const updateSchedule = (id, updates) => {
  const updated = getSchedules().map((schedule) =>
    schedule.id === id ? { ...schedule, ...updates } : schedule
  );
  writeJson(SCHEDULE_KEY, updated);
  return updated.find((schedule) => schedule.id === id);
};

export const deleteSchedule = (id) => {
  const updated = getSchedules().filter((schedule) => schedule.id !== id);
  writeJson(SCHEDULE_KEY, updated);
  return updated;
};

export const setSchedules = (schedules) => writeJson(SCHEDULE_KEY, schedules);

export const getOptions = () => readJson(OPTIONS_KEY, defaultOptions);

export const updateOptions = (options) => writeJson(OPTIONS_KEY, options);

export const resetSchedulerData = () => {
  writeJson(SCHEDULE_KEY, starterSchedules);
  writeJson(OPTIONS_KEY, defaultOptions);
  return { schedules: starterSchedules, options: defaultOptions };
};
