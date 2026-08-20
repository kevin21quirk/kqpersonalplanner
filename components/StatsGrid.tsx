"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckSquare, Video, StickyNote, Plug2, TrendingUp } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  urgentTasks: number;
  todayEvents: number;
  weekEvents: number;
  totalNotes: number;
  pinnedNotes?: number;
  connectedIntegrations: number;
  totalIntegrations: number;
}

interface StatsGridProps {
  stats: DashboardStats | null;
}

interface StatCardConfig {
  label: string;
  icon: ReactNode;
  iconWrapperClass: string;
  value: string | number;
  subtitle: string;
  trend?: ReactNode;
  hoverGlow: string;
}

/* ─── Skeleton card ──────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-[#131720] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        {/* icon placeholder */}
        <div className="w-10 h-10 rounded-xl bg-white/[0.05]" />
        {/* label pill placeholder */}
        <div className="w-20 h-5 rounded-full bg-white/[0.05]" />
      </div>
      {/* value placeholder */}
      <div className="w-12 h-8 rounded-lg bg-white/[0.05] mb-2.5" />
      {/* subtitle placeholder */}
      <div className="w-28 h-3 rounded bg-white/[0.04]" />
    </div>
  );
}

/* ─── Single stat card ───────────────────────────────────────────────────── */

function StatCard({
  label,
  icon,
  iconWrapperClass,
  value,
  subtitle,
  trend,
  hoverGlow,
}: StatCardConfig) {
  return (
    <div
      className={cn(
        "bg-[#131720] border border-white/[0.06] rounded-2xl p-5",
        "transition-all duration-300 ease-out",
        "hover:border-white/10 hover:-translate-y-0.5",
        hoverGlow
      )}
    >
      {/* Top row: icon + label pill */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            iconWrapperClass
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-widest",
            "text-slate-600 bg-white/[0.04] border border-white/[0.06]",
            "px-2.5 py-1 rounded-full"
          )}
        >
          {label}
        </span>
      </div>

      {/* Value row */}
      <div className="flex items-end gap-2 mb-1.5">
        <span className="text-[2rem] font-bold text-slate-100 leading-none tabular-nums">
          {value}
        </span>
        {trend && <span className="mb-0.5 leading-none">{trend}</span>}
      </div>

      {/* Subtitle */}
      <p className="text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}

/* ─── Grid ───────────────────────────────────────────────────────────────── */

export default function StatsGrid({ stats }: StatsGridProps) {
  /* Loading state */
  if (!stats) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const {
    pendingTasks,
    completedTasks,
    todayEvents,
    weekEvents,
    totalNotes,
    connectedIntegrations,
    totalIntegrations,
  } = stats;

  const pinnedNotes = stats.pinnedNotes ?? 0;

  const cards: StatCardConfig[] = [
    /* 1 – Tasks Today */
    {
      label: "Tasks Today",
      icon: <CheckSquare className="w-[18px] h-[18px] text-blue-400" />,
      iconWrapperClass: "bg-blue-500/10 border border-blue-500/[0.18]",
      value: pendingTasks,
      subtitle: `${completedTasks} completed`,
      trend:
        completedTasks > 0 ? (
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-green-400">
            <TrendingUp className="w-3 h-3" />
            {completedTasks}
          </span>
        ) : undefined,
      hoverGlow: "hover:shadow-[0_4px_24px_-4px_rgba(59,130,246,0.18)]",
    },

    /* 2 – Meetings */
    {
      label: "Meetings",
      icon: <Video className="w-[18px] h-[18px] text-violet-400" />,
      iconWrapperClass: "bg-violet-500/10 border border-violet-500/[0.18]",
      value: todayEvents,
      subtitle: `${weekEvents} this week`,
      hoverGlow: "hover:shadow-[0_4px_24px_-4px_rgba(139,92,246,0.18)]",
    },

    /* 3 – Notes */
    {
      label: "Notes",
      icon: <StickyNote className="w-[18px] h-[18px] text-yellow-400" />,
      iconWrapperClass: "bg-yellow-500/10 border border-yellow-500/[0.18]",
      value: totalNotes,
      subtitle: `${pinnedNotes} pinned`,
      hoverGlow: "hover:shadow-[0_4px_24px_-4px_rgba(234,179,8,0.18)]",
    },

    /* 4 – Integrations */
    {
      label: "Integrations",
      icon: <Plug2 className="w-[18px] h-[18px] text-emerald-400" />,
      iconWrapperClass: "bg-emerald-500/10 border border-emerald-500/[0.18]",
      value: `${connectedIntegrations}/${totalIntegrations}`,
      subtitle: "connected apps",
      hoverGlow: "hover:shadow-[0_4px_24px_-4px_rgba(52,211,153,0.18)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
