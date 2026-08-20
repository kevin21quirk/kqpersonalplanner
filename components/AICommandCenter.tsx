"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { BrainCircuit, User, ArrowUp, Zap, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMsg = {
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt?: string;
};

type AICommandCenterProps = {
  onActionComplete?: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  "Today's agenda",
  "Create a task",
  "Schedule a meeting",
  "Add a note",
  "Show priorities",
] as const;

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function renderInline(text: string, baseKey: string): ReactNode {
  // Split on **bold** and *italic* patterns
  const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return segments.map((seg, si) => {
    if (seg.startsWith("**") && seg.endsWith("**") && seg.length > 4) {
      return (
        <strong key={`${baseKey}-b${si}`} className="font-semibold text-white">
          {seg.slice(2, -2)}
        </strong>
      );
    }
    if (seg.startsWith("*") && seg.endsWith("*") && seg.length > 2) {
      return (
        <em key={`${baseKey}-i${si}`} className="italic text-slate-300">
          {seg.slice(1, -1)}
        </em>
      );
    }
    return <span key={`${baseKey}-t${si}`}>{seg}</span>;
  });
}

function renderMessage(content: string): ReactNode {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  const pendingListItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (pendingListItems.length === 0) return;
    nodes.push(
      <ul key={`ul-${key}`} className="space-y-1.5 my-2">
        {pendingListItems.splice(0)}
      </ul>
    );
  };

  lines.forEach((line, i) => {
    const bulletMatch = /^[\u2022\-\*]\s+(.*)/.exec(line);
    const numberedMatch = /^(\d+)\.\s+(.*)/.exec(line);

    if (bulletMatch) {
      pendingListItems.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-slate-300">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span className="leading-relaxed">{renderInline(bulletMatch[1], `${i}`)}</span>
        </li>
      );
    } else if (numberedMatch) {
      pendingListItems.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-slate-300">
          <span className="text-blue-400 font-mono text-xs mt-0.5 shrink-0 w-4 text-right">
            {numberedMatch[1]}.
          </span>
          <span className="leading-relaxed">{renderInline(numberedMatch[2], `${i}`)}</span>
        </li>
      );
    } else {
      flushList(`${i}`);
      if (line.trim() === "") {
        // Blank line: only add a spacer if we're not at start/end
        if (i > 0 && i < lines.length - 1) {
          nodes.push(<div key={`sp-${i}`} className="h-1" />);
        }
      } else {
        nodes.push(
          <p key={`p-${i}`} className="leading-relaxed">
            {renderInline(line, `${i}`)}
          </p>
        );
      }
    }
  });

  flushList("end");
  return <>{nodes}</>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AICommandCenter({ onActionComplete }: AICommandCenterProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load chat history on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/ai")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setMessages(data as ChatMsg[]);
      })
      .catch(() => {
        // Silent – first load; no history yet
      });
  }, []);

  // ── Auto-scroll to latest message ──────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Auto-resize textarea (max 3 lines ≈ 96 px) ────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
  }, [input]);

  // ── Send message ───────────────────────────────────────────────────────────
  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMsg = {
      role: "USER",
      content,
      createdAt: new Date().toISOString(),
    };
    const updatedHistory = [...messages, userMsg];

    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      // Pass last 10 turns as context (already-stored messages map to openai role format)
      const recentHistory = updatedHistory.slice(-10).map((m) => ({
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history: recentHistory }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Request failed");
      }

      const data = (await res.json()) as {
        reply: string;
        action?: unknown;
        actionResult?: { success: boolean };
      };

      setMessages((prev) => [
        ...prev,
        {
          role: "ASSISTANT",
          content: data.reply,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (data.actionResult?.success) {
        onActionComplete?.();
        toast.success("Action completed successfully!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reach AI");
      setMessages((prev) => [
        ...prev,
        {
          role: "ASSISTANT",
          content:
            "Sorry, I couldn't connect right now. Please check your connection and try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    /*
     * Gradient-border wrapper:
     *   loading  → 1px padding + gradient bg  =  animated gradient border
     *   idle     → no padding, transparent outer = simple solid border on inner card
     */
    <div
      className={cn(
        "h-full flex flex-col rounded-xl overflow-hidden transition-all duration-500",
        loading
          ? "p-px bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 animate-pulse"
          : ""
      )}
    >
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden bg-[#131720] transition-all duration-500",
          loading ? "rounded-[10px]" : "rounded-xl border border-white/[0.06]"
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0f1420]">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
              <BrainCircuit size={18} className="text-blue-400" />
              {loading && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-[#0f1420] animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white leading-tight">
                AI Command Center
              </h2>
              <p className="text-[11px] text-slate-500 leading-tight">
                Powered by GPT-4o&nbsp;&nbsp;·&nbsp;&nbsp;Natural Language Planning
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("status-dot", loading ? "error animate-pulse" : "connected")} />
            <span className="text-xs text-slate-500">
              {loading ? "Thinking…" : "Ready"}
            </span>
          </div>
        </div>

        {/* ── Messages area ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
          {/* Empty state */}
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center pb-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <BrainCircuit size={28} className="text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-semibold text-sm">
                  How can I help you today?
                </p>
                <p className="text-slate-500 text-xs max-w-[220px] leading-relaxed">
                  Ask me to create tasks, schedule meetings, add notes, or summarise
                  your day.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                {QUICK_ACTIONS.slice(0, 3).map((a) => (
                  <button
                    key={a}
                    onClick={() => sendMessage(a)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5 animate-fade-in",
                msg.role === "USER" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5",
                  msg.role === "USER"
                    ? "bg-blue-500/25 border border-blue-500/40"
                    : "bg-[#1a2035] border border-blue-500/20"
                )}
              >
                {msg.role === "USER" ? (
                  <User size={13} className="text-blue-300" />
                ) : (
                  <BrainCircuit size={13} className="text-blue-400" />
                )}
              </div>

              {/* Bubble + timestamp */}
              <div
                className={cn(
                  "flex flex-col gap-1 max-w-[78%]",
                  msg.role === "USER" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-sm border",
                    msg.role === "USER"
                      ? "bg-blue-500/20 border-blue-500/30 text-blue-50 rounded-tr-sm"
                      : "bg-[#1a2035] border-white/[0.08] text-slate-200 rounded-tl-sm"
                  )}
                >
                  {msg.role === "ASSISTANT"
                    ? renderMessage(msg.content)
                    : <span className="leading-relaxed">{msg.content}</span>}
                </div>
                {msg.createdAt && (
                  <time
                    dateTime={msg.createdAt}
                    className="text-[10px] text-slate-600 px-1"
                  >
                    {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator – 3 animated dots */}
          {loading && (
            <div className="flex gap-2.5 animate-fade-in">
              <div className="shrink-0 w-7 h-7 rounded-lg bg-[#1a2035] border border-blue-500/20 flex items-center justify-center mt-0.5">
                <BrainCircuit size={13} className="text-blue-400" />
              </div>
              <div className="bg-[#1a2035] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5">
                {[0, 0.2, 0.4].map((delay, di) => (
                  <span
                    key={di}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    style={{
                      animation: `typing 1.2s ease-in-out infinite ${delay}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick action chips ──────────────────────────────────────────── */}
        <div className="shrink-0 px-4 pt-3 pb-1 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              disabled={loading}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.14]",
                "text-slate-400 hover:text-slate-200 transition-all duration-200",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/[0.04] disabled:hover:text-slate-400"
              )}
            >
              <Zap size={10} className="text-blue-400 shrink-0" />
              {action}
            </button>
          ))}
        </div>

        {/* ── Input bar ───────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 pb-4 pt-2.5">
          <div
            className={cn(
              "flex items-end gap-2.5 rounded-xl border p-2.5 transition-all duration-200",
              "bg-[#0d1018]",
              loading
                ? "border-white/[0.06]"
                : "border-white/[0.08] focus-within:border-blue-500/40 focus-within:bg-[#0f1420]"
            )}
          >
            <Sparkles
              size={14}
              className={cn(
                "shrink-0 mb-1.5 transition-colors",
                loading ? "text-blue-400 animate-pulse" : "text-slate-700"
              )}
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ask me anything… (Enter sends · Shift+Enter for newline)"
              rows={1}
              className={cn(
                "flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600",
                "resize-none outline-none leading-relaxed py-0.5",
                "disabled:opacity-40"
              )}
              style={{ maxHeight: "96px" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className={cn(
                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                input.trim() && !loading
                  ? "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25 scale-100"
                  : "bg-white/[0.05] text-slate-600 cursor-not-allowed"
              )}
            >
              <ArrowUp size={15} />
            </button>
          </div>
          <p className="text-[10px] text-slate-700 text-center mt-2">
            AI can make mistakes. Double-check important information.
          </p>
        </div>
      </div>
    </div>
  );
}
