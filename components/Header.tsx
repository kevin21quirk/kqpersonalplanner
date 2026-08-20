"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Bell, ChevronRight, Command } from "lucide-react";

interface HeaderProps {
  title: string;
  notificationCount?: number;
}

export default function Header({ title, notificationCount = 0 }: HeaderProps) {
  // Start null so the server HTML matches (avoids hydration mismatch)
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now
    ? now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : null;

  const dateStr = now
    ? now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  // Normalise title → "Dashboard", "AI Assistant", etc.
  const displayTitle = title
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return (
    <header
      className={cn(
        "h-16 flex items-center gap-4 px-6",
        "bg-[#0d0f14]/80 backdrop-blur-md",
        "border-b border-white/5",
        "relative z-10"
      )}
    >
      {/* ── Left: breadcrumb ── */}
      <div className="flex items-center gap-1.5 shrink-0 select-none">
        <span className="text-xs text-slate-700 font-medium">KQ Planner</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
        <span className="text-sm font-semibold text-slate-200">{displayTitle}</span>
      </div>

      {/* ── Center: search bar ── */}
      <div className="flex-1 max-w-lg mx-auto">
        <div className="relative flex items-center">
          {/* Leading icon */}
          <Search className="absolute left-3.5 w-4 h-4 text-slate-600 pointer-events-none" />

          {/* Input (read-only — wired up later) */}
          <input
            type="text"
            readOnly
            placeholder="Ask me anything or search..."
            className={cn(
              "w-full h-9 pl-10 pr-20 rounded-xl text-sm",
              "bg-white/[0.03] border border-white/[0.07]",
              "text-slate-400 placeholder:text-slate-700",
              "cursor-default select-none outline-none",
              "transition-colors duration-150",
              "hover:bg-white/[0.05] hover:border-white/10",
              "focus:bg-white/[0.05] focus:border-blue-500/30"
            )}
          />

          {/* ⌘K badge */}
          <div className="absolute right-2.5 flex items-center gap-0.5 pointer-events-none">
            <kbd
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md",
                "bg-white/[0.05] border border-white/[0.08]",
                "text-[10px] font-medium text-slate-600"
              )}
            >
              <Command className="w-2.5 h-2.5" />
              K
            </kbd>
          </div>
        </div>
      </div>

      {/* ── Right: clock, bell, avatar ── */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Live clock */}
        <div className="hidden md:flex flex-col items-end gap-0.5 min-w-[88px]">
          {timeStr ? (
            <>
              <span className="text-xs font-semibold text-slate-300 tabular-nums leading-none tracking-tight">
                {timeStr}
              </span>
              <span className="text-[10px] text-slate-600 leading-none">
                {dateStr}
              </span>
            </>
          ) : (
            /* Skeleton while hydrating */
            <>
              <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
              <div className="h-2.5 w-16 rounded bg-white/5 animate-pulse mt-0.5" />
            </>
          )}
        </div>

        {/* Divider */}
        <div className="hidden md:block h-5 w-px bg-white/[0.07]" />

        {/* Notification bell */}
        <button
          aria-label={
            notificationCount > 0
              ? `${notificationCount} unread notifications`
              : "Notifications"
          }
          className={cn(
            "relative flex items-center justify-center w-8 h-8 rounded-xl",
            "text-slate-500 hover:text-slate-300 hover:bg-white/5",
            "transition-colors duration-150"
          )}
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                "min-w-[15px] h-[15px] px-[3px] rounded-full",
                "bg-red-500 text-[9px] font-bold text-white leading-none",
                "shadow-lg shadow-red-600/30"
              )}
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-full cursor-pointer select-none",
            "bg-gradient-to-br from-blue-500 to-violet-600",
            "flex items-center justify-center",
            "text-[11px] font-bold text-white",
            "shadow-md shadow-blue-900/40",
            "ring-2 ring-transparent",
            "hover:ring-blue-500/30 hover:shadow-blue-700/40",
            "transition-all duration-150"
          )}
          aria-label="User menu"
        >
          KQ
        </div>
      </div>
    </header>
  );
}
