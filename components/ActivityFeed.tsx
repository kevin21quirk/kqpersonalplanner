"use client";

import {
  Zap,
  CheckSquare,
  CheckCircle2,
  Calendar,
  StickyNote,
  BrainCircuit,
  Plug2,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Activity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};

// ─── Activity type config ─────────────────────────────────────────────────────

type ActivityConfig = {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  borderClass: string;
  bgClass: string;
};

const ACTIVITY_CONFIG: Record<string, ActivityConfig> = {
  TASK_CREATED: {
    icon: CheckSquare,
    iconClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    bgClass: "bg-blue-500/10",
  },
  TASK_COMPLETED: {
    icon: CheckCircle2,
    iconClass: "text-green-400",
    borderClass: "border-green-500/30",
    bgClass: "bg-green-500/10",
  },
  EVENT_CREATED: {
    icon: Calendar,
    iconClass: "text-purple-400",
    borderClass: "border-purple-500/30",
    bgClass: "bg-purple-500/10",
  },
  NOTE_CREATED: {
    icon: StickyNote,
    iconClass: "text-yellow-400",
    borderClass: "border-yellow-500/30",
    bgClass: "bg-yellow-500/10",
  },
  AI_COMMAND: {
    icon: BrainCircuit,
    iconClass: "text-cyan-400",
    borderClass: "border-cyan-500/30",
    bgClass: "bg-cyan-500/10",
  },
  INTEGRATION_CONNECTED: {
    icon: Plug2,
    iconClass: "text-green-400",
    borderClass: "border-green-500/30",
    bgClass: "bg-green-500/10",
  },
};

const FALLBACK_CONFIG: ActivityConfig = {
  icon: Zap,
  iconClass: "text-slate-400",
  borderClass: "border-slate-500/30",
  bgClass: "bg-slate-500/10",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="flex flex-col h-full bg-[#131720] rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
        <Zap className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
          Recent Activity
        </h2>
        {activities.length > 0 && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-cyan-500/15 text-cyan-400 rounded-full">
            {activities.length}
          </span>
        )}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto max-h-64 min-h-0 py-2">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Zap className="w-7 h-7 text-slate-700" />
            <p className="text-xs text-slate-500">No recent activity yet.</p>
          </div>
        ) : (
          <ul className="space-y-0.5 px-3">
            {activities.map((activity, i) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isLast={i === activities.length - 1}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── ActivityItem ─────────────────────────────────────────────────────────────

interface ActivityItemProps {
  activity: Activity;
  isLast: boolean;
}

function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const config = ACTIVITY_CONFIG[activity.type] ?? FALLBACK_CONFIG;
  const Icon = config.icon;

  return (
    <li
      className={cn(
        "flex items-start gap-3 px-2 py-2.5 rounded-lg",
        "border-l-2 pl-3",
        config.borderClass,
        "hover:bg-white/[0.03] transition-colors duration-150"
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          "flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md mt-0.5",
          config.bgClass
        )}
      >
        <Icon className={cn("w-3.5 h-3.5", config.iconClass)} />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 leading-relaxed break-words">
          {activity.description}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(activity.createdAt)}</p>
      </div>
    </li>
  );
}
