const SCHEDULE_KEY = "hmrg:schedules";
const OPTIONS_KEY = "hmrg:options";
const MANUAL_ONLY_RESET_KEY = "hmrg:manual-only-reset-v1";

export const defaultOptions = {
  rooms: ["Room 6", "Room 7"],
  studies: ["ROXIATLAS", "WC45725", "NN7910 REDEFINE"],
  coordinators: ["Joe", "Ana", "Stephanie", "Shiela"]
};

export const starterSchedules = [];

const ensureManualOnlyReset = () => {
  if (localStorage.getItem(MANUAL_ONLY_RESET_KEY) === "true") return;
  writeJson(SCHEDULE_KEY, []);
  localStorage.setItem(MANUAL_ONLY_RESET_KEY, "true");
};

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

const normalizeSavedNames = (value) => {
  if (Array.isArray(value)) return value.map(normalizeSavedNames);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeSavedNames(item)]));
  }
  return value === "Analysis" ? "Ana" : value;
};

export const getSchedules = () => {
  ensureManualOnlyReset();
  const schedules = normalizeSavedNames(readJson(SCHEDULE_KEY, starterSchedules));
  writeJson(SCHEDULE_KEY, schedules);
  return schedules;
};

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

export const getOptions = () => {
  const options = normalizeSavedNames(readJson(OPTIONS_KEY, defaultOptions));
  writeJson(OPTIONS_KEY, options);
  return options;
};

export const updateOptions = (options) => writeJson(OPTIONS_KEY, options);
