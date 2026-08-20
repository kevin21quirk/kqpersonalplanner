"use client";

import { useEffect, useState, useRef } from "react";
import { StickyNote, Pin, PinOff, X, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn, timeAgo } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

interface NotesPanelProps {
  onRefresh?: () => void;
}

export default function NotesPanel({ onRefresh }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newPinned, setNewPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data: Note[] = await res.json();
      setNotes(data);
    } catch {
      toast.error("Could not load notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (showForm) {
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [showForm]);

  // ── Pin toggle ─────────────────────────────────────────────────────────────

  const handlePinToggle = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPinned = !note.pinned;
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, pinned: nextPinned } : n))
    );
    // If expanded note is the same, sync it too
    if (expandedNote?.id === note.id) {
      setExpandedNote((prev) => (prev ? { ...prev, pinned: nextPinned } : prev));
    }
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: nextPinned }),
      });
      if (!res.ok) throw new Error();
      onRefresh?.();
    } catch {
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, pinned: note.pinned } : n))
      );
      toast.error("Failed to update note.");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (expandedNote?.id === id) setExpandedNote(null);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Note deleted.");
      onRefresh?.();
    } catch {
      toast.error("Failed to delete note.");
      fetchNotes();
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
        content: newContent.trim(),
        pinned: newPinned,
        tags: newTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create note");
      const created: Note = await res.json();

      setNotes((prev) => {
        const withNew = [created, ...prev];
        return sortNotes(withNew);
      });
      toast.success("Note created!");
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setNewPinned(false);
      setShowForm(false);
      onRefresh?.();
    } catch {
      toast.error("Failed to create note.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Sort: pinned first, then by updatedAt ──────────────────────────────────

  const sorted = sortNotes(notes);

  return (
    <div className="flex flex-col h-full bg-[#131720] rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">Notes</h2>
          <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-500/15 text-yellow-400 rounded-full">
            {notes.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Note
        </button>
      </div>

      {/* Notes grid */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <StickyNote className="w-8 h-8 text-slate-700" />
            <p className="text-xs text-slate-500">No notes yet. Create one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {sorted.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPinToggle={handlePinToggle}
                onDelete={handleDelete}
                onClick={() => setExpandedNote(note)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New note form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border-t border-white/[0.06] px-4 py-3 space-y-2 bg-[#0f1219]"
        >
          <input
            ref={titleInputRef}
            type="text"
            placeholder="Note title…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 focus:bg-white/[0.06] transition-colors"
          />
          <textarea
            placeholder="Content…"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 resize-none transition-colors"
          />
          <input
            type="text"
            placeholder="Tags (comma-separated, optional)"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newPinned}
              onChange={(e) => setNewPinned(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-yellow-400"
            />
            <span className="text-xs text-slate-400">Pin this note</span>
          </label>
          <div className="flex gap-2 pt-0.5">
            <button
              type="submit"
              disabled={submitting || !newTitle.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-yellow-600/80 hover:bg-yellow-500/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Save Note
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

      {/* Expanded note overlay */}
      {expandedNote && (
        <NoteModal
          note={expandedNote}
          onClose={() => setExpandedNote(null)}
          onPinToggle={(note, e) => handlePinToggle(note, e)}
          onDelete={(id, e) => handleDelete(id, e)}
        />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────

interface NoteCardProps {
  note: Note;
  onPinToggle: (note: Note, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
}

function NoteCard({ note, onPinToggle, onDelete, onClick }: NoteCardProps) {
  const preview =
    note.content.length > 120 ? note.content.slice(0, 120) + "…" : note.content;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2 p-3.5 rounded-xl border cursor-pointer",
        "bg-white/[0.03] border-white/[0.06]",
        "hover:bg-white/[0.06] hover:border-white/[0.10] transition-all duration-200",
        note.pinned && "border-yellow-500/20 bg-yellow-500/[0.03]"
      )}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <span className="absolute top-2.5 right-10 text-yellow-400/60">
          <Pin className="w-3 h-3 fill-yellow-400/40" />
        </span>
      )}

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => onPinToggle(note, e)}
          aria-label={note.pinned ? "Unpin note" : "Pin note"}
          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-md transition-colors"
        >
          {note.pinned ? (
            <PinOff className="w-3.5 h-3.5" />
          ) : (
            <Pin className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          onClick={(e) => onDelete(note.id, e)}
          aria-label="Delete note"
          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-slate-100 pr-14 leading-snug line-clamp-1">
        {note.title}
      </p>

      {/* Content preview */}
      {preview && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{preview}</p>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[10px] bg-white/[0.05] text-slate-400 rounded-md border border-white/[0.06]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-[10px] text-slate-600 mt-auto">{timeAgo(note.updatedAt)}</p>
    </div>
  );
}

// ─── NoteModal ────────────────────────────────────────────────────────────────

interface NoteModalProps {
  note: Note;
  onClose: () => void;
  onPinToggle: (note: Note, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

function NoteModal({ note, onClose, onPinToggle, onDelete }: NoteModalProps) {
  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-lg bg-[#1a2030] border border-white/[0.10] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 gap-3">
          <h3 className="text-base font-semibold text-slate-100 leading-snug flex-1">
            {note.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => onPinToggle(note, e)}
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                note.pinned
                  ? "text-yellow-400 bg-yellow-400/15"
                  : "text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10"
              )}
            >
              {note.pinned ? (
                <PinOff className="w-4 h-4" />
              ) : (
                <Pin className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => onDelete(note.id, e)}
              aria-label="Delete note"
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-2 max-h-[50vh] overflow-y-auto">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {note.content || <span className="text-slate-600 italic">No content.</span>}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-white/[0.06] text-slate-400 rounded-md border border-white/[0.08]"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-[11px] text-slate-600 flex-shrink-0 ml-3">
            {timeAgo(note.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}


