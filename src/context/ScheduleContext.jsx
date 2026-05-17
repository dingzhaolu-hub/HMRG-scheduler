import { createContext, useContext, useMemo, useState } from "react";
import {
  addSchedule as persistAddSchedule,
  deleteSchedule as persistDeleteSchedule,
  getOptions,
  getSchedules,
  resetSchedulerData,
  setSchedules as persistSchedules,
  updateOptions as persistOptions,
  updateSchedule as persistUpdateSchedule
} from "../data/storage.js";
import { conflictAlertMessage, emptySchedule, optionGroups, validateSchedule } from "../utils/schedule.js";

const ScheduleContext = createContext(null);

export const ScheduleProvider = ({ children }) => {
  const [schedules, setSchedules] = useState(getSchedules);
  const [options, setOptions] = useState(getOptions);
  const [error, setError] = useState("");
  const [conflictNotice, setConflictNotice] = useState("");

  const createSchedule = (payload) => {
    const schedule = withOptionDefaults(payload, options);
    const validation = validateSchedule(schedule, schedules);
    if (validation) {
      setError(validation);
      if (validation === "Room already booked for this time range") {
        setConflictNotice(conflictAlertMessage(schedule, schedules, options.rooms));
      } else {
        setConflictNotice(validation);
      }
      return null;
    }
    const created = persistAddSchedule(schedule);
    setSchedules((current) => [...current, created]);
    setError("");
    return created;
  };

  const editSchedule = (id, updates) => {
    const current = schedules.find((schedule) => schedule.id === id);
    if (!current) return null;
    const next = withOptionDefaults({ ...current, ...updates }, options);
    const validation = validateSchedule(next, schedules, id);
    if (validation) {
      setError(validation);
      if (validation === "Room already booked for this time range") {
        setConflictNotice(conflictAlertMessage(next, schedules, options.rooms, id));
      } else {
        setConflictNotice(validation);
      }
      return null;
    }
    const updated = persistUpdateSchedule(id, next);
    setSchedules((items) => items.map((schedule) => (schedule.id === id ? updated : schedule)));
    setError("");
    return updated;
  };

  const removeSchedule = (id) => {
    const updated = persistDeleteSchedule(id);
    setSchedules(updated);
  };

  const replaceOptions = (nextOptions, renamePatch = null) => {
    const cleaned = normalizeOptions(nextOptions);
    setOptions(cleaned);
    persistOptions(cleaned);

    if (renamePatch) {
      const group = optionGroups.find((item) => item.key === renamePatch.groupKey);
      if (group) {
        const updatedSchedules = schedules.map((schedule) =>
          schedule[group.scheduleField] === renamePatch.from
            ? { ...schedule, [group.scheduleField]: renamePatch.to }
            : schedule
        );
        setSchedules(updatedSchedules);
        persistSchedules(updatedSchedules);
      }
    }
  };

  const generateWeekTemplate = (weekStart) => {
    const rooms = options.rooms.length ? options.rooms : [emptySchedule.room];
    const studies = options.studies.length ? options.studies : [emptySchedule.study];
    const coordinators = options.coordinators.length ? options.coordinators : [emptySchedule.coordinator];
    const generated = [];
    const start = new Date(weekStart);

    for (let day = 0; day < 5; day += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + day);
      generated.push({
        ...emptySchedule,
        id: crypto.randomUUID(),
        date: date.toISOString().slice(0, 10),
        startTime: "08:30",
        endTime: "09:00",
        room: rooms[day % rooms.length],
        study: studies[day % studies.length],
        coordinator: coordinators[day % coordinators.length],
        patientId: "",
        status: "Pending"
      });
    }

    const merged = [...schedules, ...generated.filter((item) => !validateSchedule(item, schedules))];
    persistSchedules(merged);
    setSchedules(merged);
  };

  const resetData = () => {
    const reset = resetSchedulerData();
    setSchedules(reset.schedules);
    setOptions(reset.options);
    setError("");
    setConflictNotice("");
  };

  const value = useMemo(
    () => ({
      schedules,
      options,
      error,
      conflictNotice,
      setError,
      setConflictNotice,
      createSchedule,
      editSchedule,
      removeSchedule,
      replaceOptions,
      generateWeekTemplate,
      resetData
    }),
    [schedules, options, error, conflictNotice]
  );

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};

export const useSchedules = () => {
  const context = useContext(ScheduleContext);
  if (!context) throw new Error("useSchedules must be used inside ScheduleProvider");
  return context;
};

const withOptionDefaults = (schedule, options) => ({
  ...schedule,
  room: schedule.room || options.rooms[0] || "",
  study: schedule.study || options.studies[0] || "",
  coordinator: schedule.coordinator || options.coordinators[0] || "",
  status: schedule.status || options.status[0] || "Pending"
});

const normalizeOptions = (options) =>
  Object.fromEntries(
    Object.entries(options).map(([key, values]) => [
      key,
      Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    ])
  );
