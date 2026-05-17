export const optionGroups = [
  { key: "rooms", label: "Rooms", singular: "Room", scheduleField: "room" },
  { key: "studies", label: "Studies", singular: "Study", scheduleField: "study" },
  { key: "coordinators", label: "Coordinators", singular: "Coordinator", scheduleField: "coordinator" },
  { key: "status", label: "Status", singular: "Status", scheduleField: "status" }
];

export const scheduleFields = [
  { key: "date", label: "Date", type: "date" },
  { key: "startTime", label: "Start", type: "time" },
  { key: "endTime", label: "End", type: "time" },
  { key: "room", label: "Room", optionKey: "rooms" },
  { key: "study", label: "Study", optionKey: "studies" },
  { key: "patientId", label: "Patient ID", type: "text" },
  { key: "coordinator", label: "Coordinator", optionKey: "coordinators" },
  { key: "status", label: "Status", optionKey: "status" }
];

export const emptySchedule = {
  date: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  endTime: "10:00",
  room: "",
  study: "",
  patientId: "",
  coordinator: "",
  status: "Pending"
};

export const timeToMinutes = (value) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const hasRoomConflict = (candidate, schedules, ignoreId = null) => {
  if (!candidate.date || !candidate.room || !candidate.startTime || !candidate.endTime) return false;
  const start = timeToMinutes(candidate.startTime);
  const end = timeToMinutes(candidate.endTime);
  if (end <= start) return false;

  return schedules.some((schedule) => {
    if (schedule.id === ignoreId) return false;
    if (schedule.date !== candidate.date || schedule.room !== candidate.room) return false;
    const existingStart = timeToMinutes(schedule.startTime);
    const existingEnd = timeToMinutes(schedule.endTime);
    return start < existingEnd && end > existingStart;
  });
};

export const getAvailableRoomsForSlot = (candidate, schedules, rooms, ignoreId = null) =>
  rooms.filter(
    (room) =>
      !hasRoomConflict(
        {
          ...candidate,
          room
        },
        schedules,
        ignoreId
      )
  );

export const validateSchedule = (schedule, schedules, ignoreId = null) => {
  const requiredFields = [
    ["date", "Date"],
    ["startTime", "Start time"],
    ["endTime", "End time"],
    ["room", "Room"],
    ["study", "Study"],
    ["patientId", "Patient ID"],
    ["coordinator", "Coordinator"],
    ["status", "Status"]
  ];
  const missing = requiredFields.filter(([key]) => !String(schedule[key] || "").trim()).map(([, label]) => label);
  if (missing.length) {
    return `Please complete all booking details: ${missing.join(", ")}`;
  }
  if (timeToMinutes(schedule.endTime) <= timeToMinutes(schedule.startTime)) {
    return "End time must be after start time";
  }
  if (hasRoomConflict(schedule, schedules, ignoreId)) {
    return "Room already booked for this time range";
  }
  return "";
};

export const conflictAlertMessage = (schedule, schedules, rooms, ignoreId = null) => {
  const availableRooms = getAvailableRoomsForSlot(schedule, schedules, rooms, ignoreId).filter(
    (room) => room !== schedule.room
  );
  const alternatives = availableRooms.length
    ? `Available room options for this time: ${availableRooms.join(", ")}.`
    : "No other rooms are open for this exact time. Try a different time range or date.";

  return `Room already booked for this time range.\n\n${alternatives}`;
};

export const getWeekStart = (date = new Date()) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);
  current.setHours(0, 0, 0, 0);
  return current;
};

export const getWeekDays = (weekStart) =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

export const formatDateInput = (date) => date.toISOString().slice(0, 10);

export const formatDay = (date) =>
  new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(date);

export const statusClasses = {
  Booked: "border-clinic-blue bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-100",
  Pending: "border-clinic-amber bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100",
  Done: "border-clinic-green bg-green-50 text-green-800 dark:border-green-500 dark:bg-green-950 dark:text-green-100"
};

export const colorForSchedule = (schedule) =>
  statusClasses[schedule.status] ||
  "border-clinic-teal bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-100";

export const exportSchedulesToCsv = (schedules) => {
  const headers = ["Date", "Start Time", "End Time", "Room", "Study", "Patient ID", "Coordinator", "Status"];
  const rows = schedules.map((schedule) => [
    schedule.date,
    schedule.startTime,
    schedule.endTime,
    schedule.room,
    schedule.study,
    schedule.patientId,
    schedule.coordinator,
    schedule.status
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `clinical-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};
