"use client";

import { useEffect, useState, useRef } from "react";
import { CheckSquare, Plus, X, ChevronDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatShortDate, getPriorityColor } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string | null;
  tags: string[];
  completedAt?: string | null;
  createdAt: string;
};

type FilterTab = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED";

const PRIORITY_ORDER: Record<Task["priority"], number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Completed tasks sink to the bottom
    const aCompleted = a.status === "COMPLETED" || a.status === "CANCELLED";
    const bCompleted = b.status === "COMPLETED" || b.status === "CANCELLED";
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    // Then sort by priority
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

const FILTER_LABELS: Record<FilterTab, string> = {
  ALL: "All",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

const EMPTY_MESSAGES: Record<FilterTab, string> = {
  ALL: "No tasks yet. Add one below.",
  PENDING: "No pending tasks.",
  IN_PROGRESS: "Nothing in progress right now.",
  COMPLETED: "No completed tasks yet.",
};

// ─── Priority dot colours ─────────────────────────────────────────────────────

function priorityDot(priority: Task["priority"]): string {
  switch (priority) {
    case "URGENT": return "bg-red-400";
    case "HIGH":   return "bg-orange-400";
    case "MEDIUM": return "bg-yellow-400";
    case "LOW":    return "bg-green-400";
    default:       return "bg-slate-400";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TasksPanelProps {
  onRefresh?: () => void;
}

export default function TasksPanel({ onRefresh }: TasksPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  // Add-task form state
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("MEDIUM");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTags, setNewTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data: Task[] = await res.json();
      setTasks(data);
    } catch {
      toast.error("Could not load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (showForm) {
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [showForm]);

  // ── Toggle completion ──────────────────────────────────────────────────────

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      onRefresh?.();
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
      toast.error("Failed to update task.");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Task deleted.");
      onRefresh?.();
    } catch {
      toast.error("Failed to delete task.");
      fetchTasks();
    }
  };

  // ── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: newTitle.trim(),
        priority: newPriority,
      };
      if (newDueDate) body.dueDate = new Date(newDueDate).toISOString();
      if (newTags.trim()) {
        body.tags = newTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const created: Task = await res.json();

      setTasks((prev) => sortTasks([created, ...prev]));
      setNewIds((prev) => new Set(prev).add(created.id));
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          next.delete(created.id);
          return next;
        });
      }, 700);

      toast.success("Task created!");
      setNewTitle("");
      setNewPriority("MEDIUM");
      setNewDueDate("");
      setNewTags("");
      setShowForm(false);
      onRefresh?.();
    } catch {
      toast.error("Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered & sorted list ─────────────────────────────────────────────────

  const filtered = sortTasks(
    activeFilter === "ALL"
      ? tasks
      : tasks.filter((t) => t.status === activeFilter)
  );

  const counts: Record<FilterTab, number> = {
    ALL: tasks.length,
    PENDING: tasks.filter((t) => t.status === "PENDING").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    COMPLETED: tasks.filter((t) => t.status === "COMPLETED").length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[#131720] rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">Tasks</h2>
          <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-500/15 text-blue-400 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0.5 px-4 pt-3 pb-1">
        {(Object.keys(FILTER_LABELS) as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md transition-colors font-medium",
              activeFilter === tab
                ? "bg-blue-500/20 text-blue-400"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            {FILTER_LABELS[tab]}
            {counts[tab] > 0 && (
              <span
                className={cn(
                  "ml-1 text-[10px]",
                  activeFilter === tab ? "text-blue-400/70" : "text-slate-600"
                )}
              >
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <CheckSquare className="w-8 h-8 text-slate-700" />
            <p className="text-xs text-slate-500">{EMPTY_MESSAGES[activeFilter]}</p>
          </div>
        ) : (
          filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isNew={newIds.has(task.id)}
              onToggle={handleToggleComplete}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Add task form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border-t border-white/[0.06] px-4 py-3 space-y-2 bg-[#0f1219]"
        >
          <input
            ref={titleInputRef}
            type="text"
            placeholder="Task title…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-colors"
          />
          <div className="flex gap-2">
            {/* Priority */}
            <div className="relative flex-1">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Task["priority"])}
                className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
            {/* Due date */}
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]"
            />
          </div>
          {/* Tags */}
          <input
            type="text"
            placeholder="Tags (comma-separated, optional)"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <div className="flex gap-2 pt-0.5">
            <button
              type="submit"
              disabled={submitting || !newTitle.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Create Task
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  isNew: boolean;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}

function TaskRow({ task, isNew, onToggle, onDelete }: TaskRowProps) {
  const completed = task.status === "COMPLETED";

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        "hover:bg-white/[0.04]",
        isNew && "animate-fade-in",
        completed && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "flex-shrink-0 w-4.5 h-4.5 rounded border transition-all duration-150",
          completed
            ? "bg-green-500/30 border-green-500/50 text-green-400"
            : "border-slate-600 hover:border-blue-400"
        )}
      >
        {completed && (
          <svg viewBox="0 0 12 12" className="w-full h-full p-0.5 text-green-400" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
              getPriorityColor(task.priority)
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", priorityDot(task.priority))} />
            {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
          </span>

          {/* Title */}
          <span
            className={cn(
              "text-sm text-slate-200 truncate",
              completed && "line-through text-slate-500"
            )}
          >
            {task.title}
          </span>
        </div>

        {/* Meta row */}
        {(task.dueDate || task.tags.length > 0) && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.dueDate && (
              <span className="text-[10px] text-slate-500">
                📅 {formatShortDate(task.dueDate)}
              </span>
            )}
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] bg-white/[0.05] text-slate-400 rounded-md border border-white/[0.06]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete button (visible on hover) */}
      <button
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-all duration-150"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
