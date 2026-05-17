import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useSchedules } from "../context/ScheduleContext.jsx";
import { colorForSchedule, formatDateInput, formatDay, getWeekDays, getWeekStart, timeToMinutes } from "../utils/schedule.js";

const dayStart = 7 * 60;
const dayEnd = 19 * 60;
const daySpan = dayEnd - dayStart;

export default function CalendarView({ schedules, weekStart, setWeekStart, onEdit, onAdd }) {
  const { editSchedule } = useSchedules();
  const days = getWeekDays(weekStart);
  const [selectedSlots, setSelectedSlots] = useState([]);

  const moveWeek = (direction) => {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + direction * 7);
    setWeekStart(next);
  };

  const onDrop = (event, date) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const schedule = schedules.find((item) => item.id === id);
    if (!schedule) return;
    editSchedule(id, { date: formatDateInput(date) });
  };

  const addAtSlot = (date, hour) => {
    onAdd({
      date: formatDateInput(date),
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(hour + 1).padStart(2, "0")}:00`
    });
  };

  const slotKey = (date, hour) => `${date}-${hour}`;

  const toggleSlot = (date, hour) => {
    const key = slotKey(date, hour);
    setSelectedSlots((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-clinic-line p-4 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-clinic-ink dark:text-white">Weekly Calendar</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatDay(days[0])} - {formatDay(days[6])}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn h-9 w-9 px-0" onClick={() => moveWeek(-1)} aria-label="Previous week">
            <ChevronLeft size={17} />
          </button>
          <button className="btn h-9" onClick={() => setWeekStart(getWeekStart())}>
            Today
          </button>
          <button className="btn h-9 w-9 px-0" onClick={() => moveWeek(1)} aria-label="Next week">
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="grid min-h-[660px] grid-cols-[68px_repeat(7,minmax(135px,1fr))] overflow-x-auto">
        <div className="border-r border-clinic-line bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-14 border-b border-clinic-line dark:border-slate-800" />
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="h-12 border-b border-clinic-line px-2 py-1 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {String(index + 7).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dateValue = formatDateInput(day);
          const daySchedules = schedules.filter((schedule) => schedule.date === dateValue);

          return (
            <div
              key={dateValue}
              className="relative border-r border-clinic-line dark:border-slate-800"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, day)}
            >
              <div className="sticky top-0 z-10 h-14 border-b border-clinic-line bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-clinic-ink dark:text-white">{formatDay(day)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{daySchedules.length} visits</p>
              </div>
              <div className="relative h-[576px] bg-white dark:bg-slate-950">
                {Array.from({ length: 12 }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`block h-12 w-full border-b border-clinic-line/80 text-left transition hover:bg-teal-50 dark:border-slate-800 dark:hover:bg-teal-950 ${
                      selectedSlots.includes(slotKey(dateValue, index + 7))
                        ? "bg-teal-100 ring-2 ring-inset ring-clinic-teal dark:bg-teal-950"
                        : ""
                    }`}
                    onMouseDown={(event) => {
                      if (event.button !== 0) return;
                      event.preventDefault();
                      toggleSlot(dateValue, index + 7);
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      const key = slotKey(dateValue, index + 7);
                      setSelectedSlots((current) => (current.includes(key) ? current : [...current, key]));
                      addAtSlot(day, index + 7);
                    }}
                    aria-label={`Add visit ${formatDay(day)} at ${String(index + 7).padStart(2, "0")}:00`}
                  />
                ))}
                {daySchedules.map((schedule) => {
                  const top = Math.max(0, ((timeToMinutes(schedule.startTime) - dayStart) / daySpan) * 100);
                  const height = Math.max(7, ((timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime)) / daySpan) * 100);
                  return (
                    <button
                      key={schedule.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", schedule.id)}
                      onClick={() => onEdit(schedule)}
                      className={`absolute left-2 right-2 overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm ${colorForSchedule(schedule)}`}
                      style={{ top: `${top}%`, height: `${height}%` }}
                    >
                      <span className="block truncate font-semibold">
                        {schedule.startTime} {schedule.room}
                      </span>
                      <span className="block truncate">{schedule.study}</span>
                      <span className="block truncate opacity-80">{schedule.patientId || "Template slot"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
