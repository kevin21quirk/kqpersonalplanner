"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";

// Dynamic imports for all panels (client-side only)
const Sidebar          = dynamic(() => import("@/components/Sidebar"), { ssr: false });
const Header           = dynamic(() => import("@/components/Header"), { ssr: false });
const StatsGrid        = dynamic(() => import("@/components/StatsGrid"), { ssr: false });
const AICommandCenter  = dynamic(() => import("@/components/AICommandCenter"), { ssr: false });
const CalendarPanel    = dynamic(() => import("@/components/CalendarPanel"), { ssr: false });
const TasksPanel       = dynamic(() => import("@/components/TasksPanel"), { ssr: false });
const NotesPanel       = dynamic(() => import("@/components/NotesPanel"), { ssr: false });
const ActivityFeed     = dynamic(() => import("@/components/ActivityFeed"), { ssr: false });
const IntegrationsPanel = dynamic(() => import("@/components/IntegrationsPanel"), { ssr: false });
const QuickActions     = dynamic(() => import("@/components/QuickActions"), { ssr: false });

type DashboardData = {
  user: { name: string; email: string } | null;
  stats: {
    totalTasks: number; pendingTasks: number; completedTasks: number;
    urgentTasks: number; todayEvents: number; weekEvents: number;
    totalNotes: number; pinnedNotes: number;
    connectedIntegrations: number; totalIntegrations: number;
  } | null;
  todayEvents: EventData[];
  weekEvents: EventData[];
  integrations: IntegrationData[];
  recentActivities: ActivityData[];
};

type EventData = {
  id: string; title: string; startTime: string; endTime: string;
  meetLink?: string | null; type: string; location?: string | null; description?: string | null;
};
type IntegrationData = { id: string; type: string; status: string; updatedAt: string };
type ActivityData = { id: string; type: string; description: string; createdAt: string };

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  ai: "AI Assistant",
  calendar: "Calendar",
  tasks: "Tasks & Projects",
  notes: "Notes & Documents",
  integrations: "Integrations",
  reports: "Reports & Analytics",
  settings: "Settings",
};

// Isolated component so useSearchParams is inside a Suspense boundary
function SearchParamsWatcher({ onParamsChange }: { onParamsChange: (params: URLSearchParams) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => { onParamsChange(searchParams); }, [searchParams, onParamsChange]);
  return null;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState<DashboardData>({
    user: null, stats: null, todayEvents: [], weekEvents: [], integrations: [], recentActivities: [],
  });
  const [seeded, setSeeded] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return;
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    }
  }, []);

  // Seed data once on first load
  useEffect(() => {
    if (seeded) return;
    setSeeded(true);
    fetch("/api/seed", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.seeded) toast.success("Welcome! Demo data loaded.");
        fetchDashboard();
      })
      .catch(() => fetchDashboard());
  }, [seeded, fetchDashboard]);

  const handleSearchParams = useCallback((params: URLSearchParams) => {
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected === "google") {
      toast.success("Google Calendar connected successfully!");
      fetchDashboard();
    }
    if (error === "google_auth_failed") toast.error("Google authentication failed. Please try again.");
  }, [fetchDashboard]);

  const notificationCount = (dashboard.stats?.urgentTasks ?? 0) + (dashboard.todayEvents?.length ?? 0);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0f14]">
      {/* OAuth redirect param handler — must be in Suspense */}
      <Suspense fallback={null}>
        <SearchParamsWatcher onParamsChange={handleSearchParams} />
      </Suspense>

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onNavigate={setActiveTab} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={PAGE_TITLES[activeTab] ?? "Dashboard"}
          notificationCount={notificationCount}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              {/* Stats row */}
              <StatsGrid stats={dashboard.stats} />

              {/* Main grid: AI + Calendar */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3">
                  <AICommandCenter onActionComplete={fetchDashboard} />
                </div>
                <div className="xl:col-span-2">
                  <CalendarPanel
                    events={dashboard.weekEvents}
                    todayEvents={dashboard.todayEvents}
                    onRefresh={fetchDashboard}
                  />
                </div>
              </div>

              {/* Bottom grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="space-y-4">
                  <QuickActions onRefresh={fetchDashboard} />
                  <IntegrationsPanel integrations={dashboard.integrations as never} />
                </div>

                {/* Activity feed */}
                <div className="lg:col-span-2">
                  <ActivityFeed activities={dashboard.recentActivities} />
                </div>
              </div>
            </div>
          )}

          {/* ── AI TAB ── */}
          {activeTab === "ai" && (
            <div className="h-full animate-fade-in">
              <AICommandCenter onActionComplete={fetchDashboard} />
            </div>
          )}

          {/* ── CALENDAR TAB ── */}
          {activeTab === "calendar" && (
            <div className="animate-fade-in">
              <CalendarPanel
                events={dashboard.weekEvents}
                todayEvents={dashboard.todayEvents}
                onRefresh={fetchDashboard}
              />
            </div>
          )}

          {/* ── TASKS TAB ── */}
          {activeTab === "tasks" && (
            <div className="animate-fade-in">
              <TasksPanel onRefresh={fetchDashboard} />
            </div>
          )}

          {/* ── NOTES TAB ── */}
          {activeTab === "notes" && (
            <div className="animate-fade-in">
              <NotesPanel onRefresh={fetchDashboard} />
            </div>
          )}

          {/* ── INTEGRATIONS TAB ── */}
          {activeTab === "integrations" && (
            <div className="animate-fade-in">
              <IntegrationsPanel integrations={dashboard.integrations as never} />
            </div>
          )}

          {/* ── REPORTS TAB ── */}
          {activeTab === "reports" && (
            <div className="animate-fade-in flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                  <span className="text-3xl">📊</span>
                </div>
                <p className="text-slate-400 text-sm">Reports & Analytics coming soon</p>
                <p className="text-slate-600 text-xs">Ask the AI assistant for insights about your productivity</p>
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <SettingsPanel />
          )}
        </main>
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="bg-[#131720] border border-white/6 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white">KQ</div>
          <div>
            <p className="font-medium text-slate-200">Kevin</p>
            <p className="text-sm text-slate-400">kevin@aibridgesolutions.com</p>
            <p className="text-xs text-blue-400 mt-0.5">Owner · AI Bridge Solutions</p>
          </div>
        </div>
      </div>

      <div className="bg-[#131720] border border-white/6 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">AI Configuration</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-400 block mb-1">OpenAI API Key</label>
            <input
              type="password"
              placeholder="sk-..."
              className="w-full bg-[#0d0f14] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
            <p className="text-xs text-slate-600 mt-1">Get your key at platform.openai.com. Set via OPENAI_API_KEY env variable for production.</p>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">AI Model</label>
            <select className="w-full bg-[#0d0f14] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50">
              <option value="gpt-4o">GPT-4o (Recommended)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Faster)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#131720] border border-white/6 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">Preferences</h2>
        <div className="space-y-3">
          {[
            { label: "Email notifications", desc: "Get notified of upcoming events" },
            { label: "AI auto-actions", desc: "Allow AI to create tasks without confirmation" },
            { label: "Daily digest", desc: "Morning summary of the day's agenda" },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between py-2 border-b border-white/4">
              <div>
                <p className="text-sm text-slate-200">{pref.label}</p>
                <p className="text-xs text-slate-500">{pref.desc}</p>
              </div>
              <div className="w-10 h-6 bg-blue-500/20 border border-blue-500/30 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-blue-400 rounded-full absolute top-1 right-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
