"use client";

import { Plug2, Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { cn, timeAgo } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type IntegrationStatus = "CONNECTED" | "DISCONNECTED" | "ERROR" | "PENDING";

type Integration = {
  id: string;
  type: string;
  status: IntegrationStatus;
  updatedAt: string;
};

// ─── Integration definitions ──────────────────────────────────────────────────

type IntegrationDef = {
  key: string;
  label: string;
  emoji: string;
  color: string;          // Tailwind text/border accent
  bgAccent: string;       // Tailwind bg accent
  oauthSupported: boolean;
};

const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    key: "GOOGLE_CALENDAR",
    label: "Google Calendar",
    emoji: "📅",
    color: "text-blue-400",
    bgAccent: "bg-blue-500/10",
    oauthSupported: true,
  },
  {
    key: "GOOGLE_MEET",
    label: "Google Meet",
    emoji: "🎥",
    color: "text-green-400",
    bgAccent: "bg-green-500/10",
    oauthSupported: true,
  },
  {
    key: "GMAIL",
    label: "Gmail",
    emoji: "✉️",
    color: "text-red-400",
    bgAccent: "bg-red-500/10",
    oauthSupported: false,
  },
  {
    key: "SLACK",
    label: "Slack",
    emoji: "💬",
    color: "text-purple-400",
    bgAccent: "bg-purple-500/10",
    oauthSupported: false,
  },
  {
    key: "LINKEDIN",
    label: "LinkedIn",
    emoji: "💼",
    color: "text-sky-400",
    bgAccent: "bg-sky-500/10",
    oauthSupported: false,
  },
  {
    key: "NOTION",
    label: "Notion",
    emoji: "📝",
    color: "text-slate-300",
    bgAccent: "bg-slate-500/10",
    oauthSupported: false,
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusLabel(status: IntegrationStatus): string {
  switch (status) {
    case "CONNECTED":    return "Connected";
    case "DISCONNECTED": return "Disconnected";
    case "ERROR":        return "Error";
    case "PENDING":      return "Pending";
    default:             return "Unknown";
  }
}

function statusBadgeClass(status: IntegrationStatus): string {
  switch (status) {
    case "CONNECTED":    return "text-green-400 bg-green-400/10";
    case "DISCONNECTED": return "text-slate-400 bg-slate-400/10";
    case "ERROR":        return "text-red-400 bg-red-400/10";
    case "PENDING":      return "text-yellow-400 bg-yellow-400/10";
    default:             return "text-slate-400 bg-slate-400/10";
  }
}

function statusDotClass(status: IntegrationStatus): string {
  switch (status) {
    case "CONNECTED":    return "bg-green-400";
    case "DISCONNECTED": return "bg-slate-500";
    case "ERROR":        return "bg-red-400";
    case "PENDING":      return "bg-yellow-400";
    default:             return "bg-slate-500";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface IntegrationsPanelProps {
  integrations: Integration[];
}

export default function IntegrationsPanel({ integrations }: IntegrationsPanelProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  // Build a lookup map: type → integration record
  const integrationMap = new Map<string, Integration>(
    integrations.map((i) => [i.type, i])
  );

  const connectedCount = integrations.filter((i) => i.status === "CONNECTED").length;

  // ── Connect / Disconnect ───────────────────────────────────────────────────

  const handleConnect = async (def: IntegrationDef) => {
    if (!def.oauthSupported) {
      toast("Coming Soon! This integration will be available shortly.", {
        icon: "🚧",
      });
      return;
    }

    setConnecting(def.key);
    try {
      const res = await fetch("/api/integrations/google");
      if (!res.ok) throw new Error("Failed to get OAuth URL");
      const data: { url: string } = await res.json();
      window.location.href = data.url;
    } catch {
      toast.error("Failed to initiate connection. Please try again.");
      setConnecting(null);
    }
  };

  const handleDisconnect = async (def: IntegrationDef) => {
    const integration = integrationMap.get(def.key);
    if (!integration) return;

    setConnecting(def.key);
    try {
      const res = await fetch(`/api/integrations/${integration.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success(`${def.label} disconnected.`);
      // The parent will re-fetch / re-render — here we just optimistically clear
    } catch {
      toast.error("Failed to disconnect. Please try again.");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#131720] rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Plug2 className="w-4 h-4 text-green-400" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
            Integrations
          </h2>
          {connectedCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-green-500/15 text-green-400 rounded-full">
              {connectedCount} connected
            </span>
          )}
        </div>
      </div>

      {/* Integration grid */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="grid grid-cols-2 gap-3">
          {INTEGRATION_DEFS.map((def) => {
            const integration = integrationMap.get(def.key);
            const status: IntegrationStatus = integration?.status ?? "DISCONNECTED";
            const isConnected = status === "CONNECTED";
            const isLoading = connecting === def.key;

            return (
              <IntegrationCard
                key={def.key}
                def={def}
                status={status}
                updatedAt={integration?.updatedAt}
                isConnected={isConnected}
                isLoading={isLoading}
                onConnect={() => handleConnect(def)}
                onDisconnect={() => handleDisconnect(def)}
              />
            );
          })}
        </div>

        {/* Add integration CTA */}
        <button
          onClick={() =>
            toast("More integrations coming soon!", { icon: "🔌" })
          }
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-xs text-slate-500 hover:text-slate-300 border border-dashed border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-colors"
        >
          <Plug2 className="w-3.5 h-3.5" />
          Add Integration
        </button>
      </div>
    </div>
  );
}

// ─── IntegrationCard ──────────────────────────────────────────────────────────

interface IntegrationCardProps {
  def: IntegrationDef;
  status: IntegrationStatus;
  updatedAt?: string;
  isConnected: boolean;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function IntegrationCard({
  def,
  status,
  updatedAt,
  isConnected,
  isLoading,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-3.5 rounded-xl border transition-all duration-200",
        "bg-white/[0.02] border-white/[0.06]",
        isConnected && "border-green-500/20 bg-green-500/[0.02]"
      )}
    >
      {/* Top row: icon + name + status dot */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg text-base flex-shrink-0",
              def.bgAccent
            )}
          >
            {def.emoji}
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-200 leading-tight">
              {def.label}
            </p>
            {updatedAt && (
              <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                {timeAgo(updatedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Animated status dot */}
        <span className="relative flex items-center justify-center mt-0.5 flex-shrink-0">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              statusDotClass(status),
              isConnected && "animate-pulse"
            )}
          />
        </span>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          "self-start px-2 py-0.5 text-[10px] font-medium rounded-full",
          statusBadgeClass(status)
        )}
      >
        {statusLabel(status)}
      </span>

      {/* Action button */}
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isLoading}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150",
          isLoading && "opacity-60 cursor-not-allowed",
          isConnected
            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
            : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.09] border border-white/[0.08]"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isConnected ? (
          "Disconnect"
        ) : (
          <>
            <ExternalLink className="w-3 h-3" />
            Connect
          </>
        )}
      </button>
    </div>
  );
}
