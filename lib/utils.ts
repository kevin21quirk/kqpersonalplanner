import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return `Today at ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Tomorrow at ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Yesterday at ${format(d, "HH:mm")}`;
  return format(d, "d MMM yyyy, HH:mm");
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "d MMM");
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT": return "text-red-400 bg-red-400/10";
    case "HIGH":   return "text-orange-400 bg-orange-400/10";
    case "MEDIUM": return "text-yellow-400 bg-yellow-400/10";
    case "LOW":    return "text-green-400 bg-green-400/10";
    default:       return "text-slate-400 bg-slate-400/10";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":   return "text-green-400 bg-green-400/10";
    case "IN_PROGRESS": return "text-blue-400 bg-blue-400/10";
    case "PENDING":     return "text-yellow-400 bg-yellow-400/10";
    case "CANCELLED":   return "text-slate-400 bg-slate-400/10";
    default:            return "text-slate-400 bg-slate-400/10";
  }
}

export function parseAIAction(content: string): { text: string; action: Record<string, unknown> | null } {
  const actionMatch = content.match(/```action\s*([\s\S]*?)\s*```/);
  if (!actionMatch) return { text: content, action: null };

  try {
    const action = JSON.parse(actionMatch[1]);
    const text = content.replace(/```action[\s\S]*?```/, "").trim();
    return { text, action };
  } catch {
    return { text: content, action: null };
  }
}

export const DEFAULT_USER_ID = "kq-owner";
