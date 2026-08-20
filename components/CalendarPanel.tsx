"use client";

import { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Video,
  Plus,
  RefreshCw,
  ChevronRight,
  Clock,
  Calendar,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  format,
  isToday,
  isTomorrow,
  addDays,
  startOfWeek,
  isSameDay,
} from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  meetLink?: string | null;
  type: string;
  location?: string | null;
  description?: string | null;
};

type CalendarPanelProps = {
  events: CalendarEvent[];
  todayEvents: CalendarEvent[];
  onRefresh?: () => void;
};

// ─── Event type → colour mapping ─────────────────────────────────────────────
// All class strings are written as full literals so Tailwind's scanner picks
// them up at build time (dynamic string construction would be missed).

type EventColors = {
  borderLeft: string; // left accent colour for the card strip
  cardBg: string;
  badge: string;      // type badge pill
  dot: string;        // calendar-strip dot
};

const EVENT_COLORS: Record<string, EventColors> = {
  MEETING: {
    borderLeft: "bg-blue-500",
    cardBg: "bg-blue-500/[0.04]",
    badge: "bg-blue-500/15 text-blue-300",
    dot: "bg-blue-400",
  },
  APPOINTMENT: {
    borderLeft: "bg-purple-500",
    cardBg: "bg-purple-500/[0.04]",
    badge: "bg-purple-500/15 text-purple-300",
    dot: "bg-purple-400",
  },
  REMINDER: {
    borderLeft: "bg-amber-500",
    cardBg: "bg-amber-500/[0.04]",
    badge: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
  PERSONAL: {
    borderLeft: "bg-green-500",
    cardBg: "bg-green-500/[0.04]",
    badge: "bg-green-500/15 text-green-300",
    dot: "bg-green-400",
  },
  FOCUS: {
    borderLeft: "bg-cyan-500",
    cardBg: "bg-cyan-500/[0.04]",
    badge: "bg-cyan-500/15 text-cyan-300",
    dot: "bg-cyan-400",
  },
};

const FALLBACK_COLORS: EventColors = {
  borderLeft: "bg-slate-500",
  cardBg: "bg-slate-500/[0.04]",
  badge: "bg-slate-500/15 text-slate-300",
  dot: "bg-slate-500",
};

function getEventColors(type: string): EventColors {
  return EVENT_COLORS[type] ?? FALLBACK_COLORS;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeRange(start: string, end: string): string {
  return `${format(new Date(start), "HH:mm")} – ${format(new Date(end), "HH:mm")}`;
}

function friendlyDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE d MMM");
}

const DURATION_OPTIONS = [
  "15 min",
  "30 min",
  "45 min",
  "1 hour",
  "1.5 hours",
  "2 hours",
  "3 hours",
] as const;

type DurationOption = (typeof DURATION_OPTIONS)[number];

const DURATION_MINUTES: Record<DurationOption, number> = {
  "15 min": 15,
  "30 min": 30,
  "45 min": 45,
  "1 hour": 60,
  "1.5 hours": 90,
  "2 hours": 120,
  "3 hours": 180,
};

type AddEventForm = {
  title: string;
  date: string;
  time: string;
  duration: DurationOption;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarPanel({
  events,
  todayEvents,
  onRefresh,
}: CalendarPanelProps) {
  const [syncing, setSyncing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AddEventForm>({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    duration: "1 hour",
  });

  const today = new Date();

  // ── 7-day week strip (Mon → Sun of current week) ────────────────────────
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Set of "yyyy-MM-dd" strings that have at least one event (for dots)
  const daysWithEvents = new Set(
    events.map((e) => format(new Date(e.startTime), "yyyy-MM-dd"))
  );

  // ── Upcoming events = after today, chronological, max 5 ─────────────────
  const upcomingEvents = events
    .filter(
      (e) =>
        !isSameDay(new Date(e.startTime), today) &&
        new Date(e.startTime) > today
    )
    .slice(0, 5);

  // ── Sync Google Calendar ─────────────────────────────────────────────────
  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/google", { method: "POST" });
      const data = (await res.json()) as { synced?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      toast.success(
        `Synced ${data.synced ?? 0} event${data.synced === 1 ? "" : "s"} from Google Calendar`
      );
      onRefresh?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to sync Google Calendar"
      );
    } finally {
      setSyncing(false);
    }
  }

  // ── Add event ────────────────────────────────────────────────────────────
  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    setSubmitting(true);
    try {
      const durationMins = DURATION_MINUTES[form.duration];
      const startTime = new Date(`${form.date}T${form.time}`);
      const endTime = new Date(startTime.getTime() + durationMins * 60_000);

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          type: "MEETING",
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to create event");
      }

      toast.success(`"${form.title.trim()}" added to your calendar!`);
      setShowAddForm(false);
      setForm({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
        duration: "1 hour",
      });
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#131720] rounded-xl border border-white/[0.06] overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0f1420]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <CalendarDays size={15} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white leading-tight">
              Calendar
            </h2>
            <p className="text-[11px] text-slate-500 leading-tight">
              {format(today, "EEEE, d MMMM yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-slate-200",
              syncing && "opacity-60 cursor-not-allowed"
            )}
          >
            <RefreshCw
              size={11}
              className={cn("shrink-0", syncing && "animate-spin")}
            />
            Sync Google
          </button>

          <button
            onClick={() => setShowAddForm((v) => !v)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              showAddForm
                ? "bg-blue-500/30 border border-blue-500/50 text-blue-200"
                : "bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 hover:text-blue-200"
            )}
          >
            {showAddForm ? <X size={11} /> : <Plus size={11} />}
            {showAddForm ? "Cancel" : "Add Event"}
          </button>
        </div>
      </div>

      {/* ── Add Event inline form ────────────────────────────────────────── */}
      {showAddForm && (
        <div className="shrink-0 mx-4 mt-4 p-4 rounded-xl bg-[#0d1018] border border-white/[0.08] animate-fade-in">
          <h3 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <Plus size={10} className="text-blue-400" />
            New Event
          </h3>

          <form onSubmit={handleAddEvent} className="space-y-2.5">
            {/* Title */}
            <input
              type="text"
              placeholder="Event title…"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              autoFocus
              className={cn(
                "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm",
                "text-slate-200 placeholder:text-slate-600 outline-none",
                "focus:border-blue-500/40 focus:bg-white/[0.06] transition-all"
              )}
            />

            {/* Date + Time side by side */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={cn(
                  "bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm",
                  "text-slate-200 outline-none focus:border-blue-500/40 transition-all",
                  "[color-scheme:dark]"
                )}
              />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className={cn(
                  "bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm",
                  "text-slate-200 outline-none focus:border-blue-500/40 transition-all",
                  "[color-scheme:dark]"
                )}
              />
            </div>

            {/* Duration */}
            <select
              value={form.duration}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  duration: e.target.value as DurationOption,
                }))
              }
              className={cn(
                "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm",
                "text-slate-200 outline-none focus:border-blue-500/40 transition-all",
                "[color-scheme:dark]"
              )}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Actions */}
            <div className="flex gap-2 pt-0.5">
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20",
                  submitting && "opacity-60 cursor-not-allowed"
                )}
              >
                {submitting ? "Adding…" : "Add Event"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 7-day week strip ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-4">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const isCurrentDay = isToday(day);
            const hasEvents = daysWithEvents.has(dateKey);

            return (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center py-2.5 px-1 rounded-xl transition-all",
                  isCurrentDay
                    ? "bg-blue-500/20 border border-blue-500/40"
                    : "hover:bg-white/[0.03] border border-transparent"
                )}
              >
                <span
                  className={cn(
                    "text-[9px] font-semibold uppercase tracking-widest leading-none",
                    isCurrentDay ? "text-blue-400" : "text-slate-600"
                  )}
                >
                  {format(day, "EEE")}
                </span>
                <span
                  className={cn(
                    "text-sm font-bold mt-1 leading-none",
                    isCurrentDay ? "text-white" : "text-slate-400"
                  )}
                >
                  {format(day, "d")}
                </span>
                {/* Event dot indicator */}
                <div className="h-1.5 mt-1 flex items-center justify-center">
                  {hasEvents && (
                    <span
                      className={cn(
                        "w-1 h-1 rounded-full",
                        isCurrentDay ? "bg-blue-400" : "bg-slate-600"
                      )}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 space-y-5">
        {/* ── Today's Events ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-2.5">
            <Clock size={10} className="text-slate-600 shrink-0" />
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Today&apos;s Events
            </h3>
            {todayEvents.length > 0 && (
              <span className="ml-auto bg-blue-500/20 text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-500/20">
                {todayEvents.length}
              </span>
            )}
          </div>

          {/* Empty state */}
          {todayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <Calendar size={18} className="text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  No events today
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Ask AI to schedule something!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {todayEvents.map((event) => {
                const colors = getEventColors(event.type);
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "flex gap-3 p-3 rounded-xl border border-white/[0.06] transition-all hover:border-white/[0.10]",
                      colors.cardBg
                    )}
                  >
                    {/* Coloured left-border strip */}
                    <div
                      className={cn("w-0.5 rounded-full shrink-0 self-stretch", colors.borderLeft)}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 justify-between">
                        <p className="text-sm font-medium text-white truncate leading-tight">
                          {event.title}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase",
                            colors.badge
                          )}
                        >
                          {event.type.toLowerCase()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock size={9} className="shrink-0" />
                        {formatTimeRange(event.startTime, event.endTime)}
                      </p>

                      {event.location && (
                        <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 truncate">
                          <MapPin size={9} className="shrink-0" />
                          {event.location}
                        </p>
                      )}
                    </div>

                    {/* Join Meet button */}
                    {event.meetLink && (
                      <a
                        href={event.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "shrink-0 self-center flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
                          "bg-green-500/15 border border-green-500/25 text-green-400",
                          "hover:bg-green-500/25 hover:text-green-300 transition-all"
                        )}
                      >
                        <Video size={10} />
                        Join
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Upcoming ──────────────────────────────────────────────────── */}
        {upcomingEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2.5">
              <ChevronRight size={10} className="text-slate-600 shrink-0" />
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Upcoming
              </h3>
            </div>

            <div className="space-y-1.5">
              {upcomingEvents.map((event) => {
                const colors = getEventColors(event.type);
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all group cursor-default",
                      "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04] hover:border-white/[0.08]"
                    )}
                  >
                    {/* Coloured dot */}
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        colors.dot
                      )}
                    />

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate group-hover:text-white transition-colors leading-tight">
                        {event.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {friendlyDate(event.startTime)}
                        <span className="mx-1 text-slate-700">·</span>
                        {format(new Date(event.startTime), "HH:mm")}
                      </p>
                    </div>

                    <ChevronRight
                      size={12}
                      className="text-slate-700 group-hover:text-slate-500 shrink-0 transition-colors"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Fallback when there are truly no events at all */}
        {events.length === 0 && todayEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <CalendarDays size={22} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Your calendar is empty
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Add an event or sync with Google Calendar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
