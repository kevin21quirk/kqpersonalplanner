"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import {
  Building2,
  LayoutDashboard,
  BrainCircuit,
  CalendarDays,
  CheckSquare,
  StickyNote,
  Plug2,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type NavSection = {
  section: string;
  items: NavItem[];
};

const navItems: NavSection[] = [
  {
    section: "Main",
    items: [
      { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard },
      { id: "ai",           label: "AI Assistant", icon: BrainCircuit    },
      { id: "calendar",     label: "Calendar",     icon: CalendarDays    },
      { id: "tasks",        label: "Tasks",        icon: CheckSquare     },
      { id: "notes",        label: "Notes",        icon: StickyNote      },
    ],
  },
  {
    section: "Tools",
    items: [
      { id: "integrations", label: "Integrations", icon: Plug2     },
      { id: "reports",      label: "Reports",      icon: BarChart3  },
      { id: "settings",     label: "Settings",     icon: Settings   },
    ],
  },
];

export default function Sidebar({ activeTab, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#090b0f] border-r border-white/5 flex flex-col z-20 select-none">

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-[18px] border-b border-white/5 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
          <Building2 className="w-[18px] h-[18px] text-blue-400" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold bg-gradient-to-r from-blue-400 via-blue-300 to-sky-300 bg-clip-text text-transparent tracking-tight">
            AI Bridge
          </span>
          <span className="mt-0.5 text-[10px] text-slate-600 tracking-widest uppercase font-medium">
            Solutions
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
        {navItems.map(({ section, items }) => (
          <div key={section}>
            {/* Section label */}
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
              {section}
            </p>

            {/* Items */}
            <ul className="space-y-0.5">
              {items.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <li key={id}>
                    <button
                      onClick={() => onNavigate(id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm",
                        "transition-all duration-150 outline-none group",
                        isActive
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_1px_0_rgba(59,130,246,0.08)]"
                          : "text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors duration-150",
                          isActive
                            ? "text-blue-400"
                            : "text-slate-600 group-hover:text-slate-400"
                        )}
                      />
                      <span className="flex-1 text-left font-medium">{label}</span>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400/50 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User card ── */}
      <div className="shrink-0 px-3 pt-3 pb-4 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-150 group">

          {/* Gradient avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 text-[11px] font-bold text-white shadow-md shadow-blue-900/40">
            KQ
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-200 leading-tight">Kevin</p>
            <p className="text-[10px] text-slate-600 truncate leading-tight mt-0.5">
              AI Bridge Solutions
            </p>
          </div>

          {/* Settings cog */}
          <button
            onClick={() => onNavigate("settings")}
            aria-label="Open settings"
            className="shrink-0 p-1.5 rounded-lg text-slate-700 hover:text-slate-400 hover:bg-white/5 transition-colors duration-150"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
