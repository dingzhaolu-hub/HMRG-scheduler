export const optionGroups = [
  { key: "studies", label: "Studies", singular: "Study", scheduleField: "study" },
  { key: "coordinators", label: "Coordinators", singular: "Coordinator", scheduleField: "coordinator" }
];

export const scheduleFields = [
  { key: "room", label: "Room", optionKey: "rooms" },
  { key: "date", label: "Date", type: "date" },
  { key: "startTime", label: "Start Time", type: "time" },
  { key: "endTime", label: "End Time", type: "time" },
  { key: "study", label: "Study", optionKey: "studies" },
  { key: "patientId", label: "Patient ID", type: "text" },
  { key: "coordinator", label: "Study Coordinator", optionKey: "coordinators" }
];

export const emptySchedule = {
  date: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  endTime: "10:00",
  room: "",
  study: "",
  patientId: "",
  coordinator: ""
};

export const timeToMinutes = (value) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const isTemporaryRoomBlock = (room, date) => {
  const roomNumber = Number(String(room).match(/\d+/)?.[0] || 0);
  if (roomNumber < 1 || roomNumber > 5 || !date) return false;
  if (date > "2026-07-31") return false;
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 2 || day === 4;
};

export const temporaryRoomBlockMessage = (room) =>
  `${room} is temporarily unavailable on Tuesdays and Thursdays through July 31, 2026. Booking opens again starting August 1, 2026.`;

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
      !isTemporaryRoomBlock(room, candidate.date) &&
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
    ["coordinator", "Coordinator"]
  ];
  const missing = requiredFields.filter(([key]) => !String(schedule[key] || "").trim()).map(([, label]) => label);
  if (missing.length) {
    return `Please complete all booking details: ${missing.join(", ")}`;
  }
  if (timeToMinutes(schedule.endTime) <= timeToMinutes(schedule.startTime)) {
    return "End time must be after start time";
  }
  if (isTemporaryRoomBlock(schedule.room, schedule.date)) {
    return temporaryRoomBlockMessage(schedule.room);
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

export const colorForSchedule = (schedule) =>
  "border-clinic-teal bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-100";

export const exportSchedulesToCsv = (schedules) => {
  const headers = ["Date", "Start Time", "End Time", "Room", "Study", "Patient ID", "Coordinator"];
  const rows = schedules.map((schedule) => [
    schedule.date,
    schedule.startTime,
    schedule.endTime,
    schedule.room,
    schedule.study,
    schedule.patientId,
    schedule.coordinator
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
