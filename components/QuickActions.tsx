"use client";

import { useState } from "react";
import { Plus, CalendarPlus, FileText, Video, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface QuickActionsProps {
  onRefresh?: () => void;
}

type ActionType = "task" | "event" | "note" | "meet" | null;

export default function QuickActions({ onRefresh }: QuickActionsProps) {
  const [active, setActive] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");

  // Event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  // Note form state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const closeForm = () => {
    setActive(null);
    setTaskTitle(""); setTaskPriority("MEDIUM");
    setEventTitle(""); setEventDate(""); setEventTime("");
    setNoteTitle(""); setNoteContent("");
  };

  const createTask = async () => {
    if (!taskTitle.trim()) return toast.error("Task title required");
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: taskTitle.trim(), priority: taskPriority }),
      });
      if (!res.ok) throw new Error();
      toast.success("Task created!");
      closeForm();
      onRefresh?.();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    if (!eventTitle.trim() || !eventDate || !eventTime) return toast.error("Title, date and time required");
    setLoading(true);
    try {
      const startTime = new Date(`${eventDate}T${eventTime}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: eventTitle.trim(), startTime: startTime.toISOString(), endTime: endTime.toISOString(), type: "MEETING" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Event scheduled!");
      closeForm();
      onRefresh?.();
    } catch {
      toast.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return toast.error("Title and content required");
    setLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle.trim(), content: noteContent.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("Note saved!");
      closeForm();
      onRefresh?.();
    } catch {
      toast.error("Failed to save note");
    } finally {
      setLoading(false);
    }
  };

  const quickButtons = [
    { id: "task" as ActionType, label: "New Task", icon: Plus, color: "text-blue-400 border-blue-500/30 hover:bg-blue-500/10" },
    { id: "event" as ActionType, label: "Schedule", icon: CalendarPlus, color: "text-purple-400 border-purple-500/30 hover:bg-purple-500/10" },
    { id: "note" as ActionType, label: "New Note", icon: FileText, color: "text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10" },
    { id: "meet" as ActionType, label: "Meet Link", icon: Video, color: "text-green-400 border-green-500/30 hover:bg-green-500/10" },
  ];

  return (
    <div className="bg-[#131720] border border-white/6 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-medium text-slate-300">Quick Actions</span>
      </div>

      {!active && (
        <div className="grid grid-cols-2 gap-2">
          {quickButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => btn.id === "meet" ? toast("Coming soon! Use AI to generate Meet links.", { icon: "🎥" }) : setActive(btn.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200",
                btn.color
              )}
            >
              <btn.icon className="w-3.5 h-3.5" />
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Task form */}
      {active === "task" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-400">Create Task</span>
            <button onClick={closeForm}><X className="w-4 h-4 text-slate-500 hover:text-slate-300" /></button>
          </div>
          <input
            autoFocus
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTask()}
            placeholder="Task title..."
            className="w-full bg-[#0d0f14] border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
          />
          <select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
            className="w-full bg-[#0d0f14] border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          >
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="URGENT">Urgent</option>
          </select>
          <button
            onClick={createTask}
            disabled={loading}
            className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      )}

      {/* Event form */}
      {active === "event" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-400">Schedule Event</span>
            <button onClick={closeForm}><X className="w-4 h-4 text-slate-500 hover:text-slate-300" /></button>
          </div>
          <input
            autoFocus
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Event title..."
            className="w-full bg-[#0d0f14] border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full bg-[#0d0f14] border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50"
          />
          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="w-full bg-[#0d0f14] border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={createEvent}
            disabled={loading}
            className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Scheduling..." : "Schedule Event"}
          </button>
        </div>
      )}

      {/* Note form */}
      {active === "note" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-yellow-400">New Note</span>
            <button onClick={closeForm}><X className="w-4 h-4 text-slate-500 hover:text-slate-300" /></button>
          </div>
          <input
            autoFocus
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full bg-[#0d0f14] border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-500/50"
          />
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Note content..."
            rows={3}
            className="w-full bg-[#0d0f14] border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-500/50 resize-none"
          />
          <button
            onClick={createNote}
            disabled={loading}
            className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Note"}
          </button>
        </div>
      )}
    </div>
  );
}
