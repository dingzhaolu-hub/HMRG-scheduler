import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSchedules } from "../context/ScheduleContext.jsx";
import { colorForSchedule, formatDateInput, formatDay, getWeekDays, getWeekStart, isTemporaryRoomBlock, timeToMinutes } from "../utils/schedule.js";

const dayStart = 7 * 60;
const dayEnd = 19 * 60;
const daySpan = dayEnd - dayStart;
const slots = Array.from({ length: 24 }, (_, index) => dayStart + index * 30);
const formatTime = (value) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const timeToNumber = (value) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
const scheduleTooltip = (schedule) =>
  [
    `Room: ${schedule.room}`,
    `Date: ${schedule.date}`,
    `Time: ${schedule.startTime} - ${schedule.endTime}`,
    `Study: ${schedule.study}`,
    `Patient ID: ${schedule.patientId}`,
    `Study Coordinator: ${schedule.coordinator}`
  ].join("\n");

export default function CalendarView({ schedules, weekStart, setWeekStart, calendarMode = "week", activeRoom = "", onEdit, onAdd }) {
  const { editSchedule } = useSchedules();
  const days = getWeekDays(weekStart);
  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
  const monthGridStart = getWeekStart(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(monthGridStart);
    date.setDate(monthGridStart.getDate() + index);
    return date;
  });
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isSelectingSlots, setIsSelectingSlots] = useState(false);
  const dragAnchorRef = useRef(null);
  const dragModeRef = useRef("add");
  const dragBaseSlotsRef = useRef([]);

  useEffect(() => {
    const clearSelectionOnOutsideClick = (event) => {
      if (!selectedSlots.length) return;
      if (event.target.closest?.(".day-line")) return;
      if (event.target.closest?.("[data-schedule-modal]")) return;
      setSelectedSlots([]);
    };
    document.addEventListener("click", clearSelectionOnOutsideClick);
    return () => document.removeEventListener("click", clearSelectionOnOutsideClick);
  }, [selectedSlots.length]);

  useEffect(() => {
    const stopSelecting = () => {
      setIsSelectingSlots(false);
      dragAnchorRef.current = null;
      dragBaseSlotsRef.current = [];
    };
    document.addEventListener("mouseup", stopSelecting);
    document.addEventListener("pointerup", stopSelecting);
    return () => {
      document.removeEventListener("mouseup", stopSelecting);
      document.removeEventListener("pointerup", stopSelecting);
    };
  }, []);

  const moveWeek = (direction) => {
    const next =
      calendarMode === "month"
        ? new Date(weekStart.getFullYear(), weekStart.getMonth() + direction, 1)
        : new Date(weekStart);
    if (calendarMode !== "month") next.setDate(weekStart.getDate() + direction * 7);
    setWeekStart(next);
  };

  const onDrop = (event, date, minute = null) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const schedule = schedules.find((item) => item.id === id);
    if (!schedule) return;
    if (minute === null) {
      editSchedule(id, { date: formatDateInput(date) });
      return;
    }
    const duration = timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime);
    editSchedule(id, { date: formatDateInput(date), startTime: formatTime(minute), endTime: formatTime(minute + duration) });
  };

  const slotKey = (date, minute) => `${date}-${minute}`;

  const slotRangeKeys = (date, startMinute, endMinute) => {
    const start = Math.min(startMinute, endMinute);
    const end = Math.max(startMinute, endMinute);
    const keys = [];
    for (let slotMinute = start; slotMinute <= end; slotMinute += 30) {
      keys.push(slotKey(date, slotMinute));
    }
    return keys;
  };

  const applySlotDragRange = (date, minute, baseSlots = dragBaseSlotsRef.current) => {
    if (!dragAnchorRef.current) return baseSlots;
    const rangeKeys =
      date === dragAnchorRef.current.date
        ? slotRangeKeys(date, dragAnchorRef.current.minute, minute)
        : [slotKey(date, minute)];
    const rangeSet = new Set(rangeKeys);
    if (dragModeRef.current === "remove") {
      return baseSlots.filter((key) => !rangeSet.has(key));
    }
    return Array.from(new Set([...baseSlots, ...rangeKeys]));
  };

  const startSlotSelection = (date, minute) => {
    const key = slotKey(date, minute);
    setSelectedSlots((current) => {
      dragAnchorRef.current = { date, minute };
      dragModeRef.current = current.includes(key) ? "remove" : "add";
      dragBaseSlotsRef.current = [...current];
      setIsSelectingSlots(true);
      return applySlotDragRange(date, minute, current);
    });
  };

  const continueSlotSelection = (date, minute, event, requireLeftButton = true) => {
    if (!isSelectingSlots) return;
    if (requireLeftButton && (event.buttons & 1) !== 1) {
      setIsSelectingSlots(false);
      dragAnchorRef.current = null;
      dragBaseSlotsRef.current = [];
      return;
    }
    setSelectedSlots(applySlotDragRange(date, minute));
  };

  const selectedRangesForDate = (date, clickedMinute) => {
    const selectedMinutes = selectedSlots
      .map((key) => {
        const separator = key.lastIndexOf("-");
        const slotDate = key.slice(0, separator);
        const slotMinute = Number(key.slice(separator + 1));
        return slotDate === date ? slotMinute : null;
      })
      .filter((minute) => Number.isFinite(minute))
      .sort((a, b) => a - b);
    const minutes = selectedMinutes.includes(clickedMinute) ? selectedMinutes : [clickedMinute];
    const ranges = [];
    let start = minutes[0];
    let end = minutes[0] + 30;

    for (let index = 1; index < minutes.length; index += 1) {
      const minute = minutes[index];
      if (minute === end) {
        end += 30;
      } else {
        ranges.push({ startTime: formatTime(start), endTime: formatTime(end) });
        start = minute;
        end = minute + 30;
      }
    }

    ranges.push({ startTime: formatTime(start), endTime: formatTime(end) });
    const clickedRangeIndex = ranges.findIndex((range) => {
      const rangeStart = timeToNumber(range.startTime);
      const rangeEnd = timeToNumber(range.endTime);
      return clickedMinute >= rangeStart && clickedMinute < rangeEnd;
    });
    if (clickedRangeIndex <= 0) return ranges;
    const [clickedRange] = ranges.splice(clickedRangeIndex, 1);
    return [clickedRange, ...ranges];
  };

  const selectedSlotTooltip = (date, minute) => {
    if (!selectedSlots.includes(slotKey(date, minute))) return "";
    const range = selectedRangesForDate(date, minute)[0];
    if (!range) return "";
    return `${range.startTime} - ${range.endTime}`;
  };

  return (
    <section className={`panel overflow-hidden ${isSelectingSlots ? "slot-selecting" : ""}`}>
      <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#13213a] dark:text-white">
            {activeRoom} {calendarMode === "month" ? "Monthly Calendar" : "Weekly Calendar"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {calendarMode === "month"
              ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(weekStart)
              : `${formatDay(days[0])} - ${formatDay(days[6])}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn h-9 w-9 px-0" onClick={() => moveWeek(-1)} aria-label="Previous week">
            <ChevronLeft size={17} />
          </button>
          <button className="btn h-9" onClick={() => setWeekStart(calendarMode === "month" ? new Date() : getWeekStart())}>
            Today
          </button>
          <button className="btn h-9 w-9 px-0" onClick={() => moveWeek(1)} aria-label="Next week">
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {calendarMode === "month" ? (
        <div className="grid grid-cols-[repeat(7,minmax(130px,1fr))] overflow-x-auto">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="border-b border-r border-slate-200 bg-slate-50/80 px-3 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              {day}
            </div>
          ))}
          {monthDays.map((day) => {
            const dateValue = formatDateInput(day);
            const daySchedules = schedules.filter((schedule) => schedule.date === dateValue);
            const muted = day.getMonth() !== weekStart.getMonth();
            const blocked = isTemporaryRoomBlock(activeRoom, dateValue);
            return (
              <div key={dateValue} className={`min-h-32 border-b border-r border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950 ${muted ? "opacity-45" : ""} ${blocked ? "bg-slate-100/80 bg-[repeating-linear-gradient(135deg,rgba(100,116,139,0.10)_0_8px,transparent_8px_16px)] dark:bg-slate-900/80" : ""}`}>
                <button
                  type="button"
                  disabled={blocked}
                  className="flex w-full items-center justify-between text-left text-sm font-bold text-[#13213a] hover:text-[#176f73] disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
                  onClick={() => onAdd({ date: dateValue, startTime: "09:00", endTime: "10:00", room: activeRoom, lockRoom: true })}
                >
                  <span>{day.getDate()}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{blocked ? "Unavailable" : `${daySchedules.length} visits`}</span>
                </button>
                <div className="mt-2 grid gap-1.5">
                  {daySchedules.slice(0, 4).map((schedule) => (
                    <button
                      key={schedule.id}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        onEdit(schedule);
                      }}
                      onClick={() => onEdit(schedule)}
                      title={scheduleTooltip(schedule)}
                      className={`truncate rounded-lg border px-2 py-1 text-left text-xs ${colorForSchedule(schedule)}`}
                    >
                      {schedule.startTime} {schedule.room} - {schedule.study}
                    </button>
                  ))}
                  {daySchedules.length > 4 ? <p className="text-xs font-bold text-slate-500">+{daySchedules.length - 4} more</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="grid min-h-[660px] grid-cols-[72px_repeat(7,minmax(150px,1fr))] overflow-x-auto">
        <div className="border-r border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-[60px] border-b border-slate-200 dark:border-slate-800" />
          {slots.map((minute) => (
            <div key={minute} className="h-8 border-b border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {formatTime(minute)}
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dateValue = formatDateInput(day);
          const daySchedules = schedules.filter((schedule) => schedule.date === dateValue);
          const blocked = isTemporaryRoomBlock(activeRoom, dateValue);

          return (
            <div
              key={dateValue}
              className={`relative border-r border-slate-200 dark:border-slate-800 ${blocked ? "bg-slate-100/80 bg-[repeating-linear-gradient(135deg,rgba(100,116,139,0.10)_0_8px,transparent_8px_16px)] dark:bg-slate-900/80" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, day)}
            >
              <div className="sticky top-0 z-10 h-[60px] border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-bold text-[#13213a] dark:text-white">{formatDay(day)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{daySchedules.length} visits</p>
              </div>
              <div className="relative h-[768px] bg-white dark:bg-slate-950">
                {slots.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    data-tooltip={selectedSlotTooltip(dateValue, minute)}
                    disabled={blocked}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => onDrop(event, day, minute)}
                    className={`day-line block h-8 w-full border-b border-slate-200/80 text-left transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-55 dark:border-slate-800 dark:hover:bg-teal-950 ${
                      selectedSlots.includes(slotKey(dateValue, minute))
                        ? "bg-teal-100 ring-2 ring-inset ring-clinic-teal dark:bg-teal-950"
                        : ""
                    }`}
                    onMouseDown={(event) => {
                      if (blocked) return;
                      if (event.button !== 0) return;
                      event.preventDefault();
                      startSlotSelection(dateValue, minute);
                    }}
                    onMouseEnter={(event) => continueSlotSelection(dateValue, minute, event)}
                    onMouseMove={(event) => continueSlotSelection(dateValue, minute, event)}
                    onMouseUp={(event) => {
                      continueSlotSelection(dateValue, minute, event, false);
                      setIsSelectingSlots(false);
                      dragAnchorRef.current = null;
                      dragBaseSlotsRef.current = [];
                    }}
                    onContextMenu={(event) => {
                      if (blocked) return;
                      event.preventDefault();
                      const key = slotKey(dateValue, minute);
                      setSelectedSlots((current) => (current.includes(key) ? current : [...current, key]));
                      onAdd(
                        selectedRangesForDate(dateValue, minute).map((range) => ({
                          date: dateValue,
                          room: activeRoom,
                          lockRoom: true,
                          ...range
                        }))
                      );
                    }}
                    aria-label={`Add visit ${formatDay(day)} at ${formatTime(minute)}`}
                  />
                ))}
                {blocked ? (
                  <div className="pointer-events-none absolute left-3 right-3 top-1/2 -translate-y-1/2 rounded-xl border border-slate-300/70 bg-white/80 px-3 py-2 text-center text-xs font-extrabold text-slate-500 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-300">
                    Unavailable Tue/Thu through July 2026
                  </div>
                ) : null}
                {daySchedules.map((schedule) => {
                  const top = Math.max(0, ((timeToMinutes(schedule.startTime) - dayStart) / daySpan) * 100);
                  const height = Math.max(7, ((timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime)) / daySpan) * 100);
                  return (
                    <button
                      key={schedule.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", schedule.id)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        onEdit(schedule);
                      }}
                      onClick={() => onEdit(schedule)}
                      title={scheduleTooltip(schedule)}
                      className={`absolute left-2 right-2 overflow-hidden whitespace-normal rounded-xl border px-2 py-1 text-left text-[11px] leading-tight shadow-lg ${colorForSchedule(schedule)}`}
                      style={{ top: `${top}%`, height: `${height}%` }}
                    >
                      <span className="block truncate font-semibold">
                        {schedule.startTime}-{schedule.endTime} {schedule.room}
                      </span>
                      <span className="block truncate">{schedule.study}</span>
                      <span className="block truncate">{schedule.patientId}</span>
                      <span className="block truncate">{schedule.coordinator}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
