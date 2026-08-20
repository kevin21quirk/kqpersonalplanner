import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      urgentTasks,
      todayEvents,
      weekEvents,
      totalNotes,
      pinnedNotes,
      integrations,
      recentActivities,
      user,
    ] = await Promise.all([
      prisma.task.count({ where: { userId: DEFAULT_USER_ID } }),
      prisma.task.count({ where: { userId: DEFAULT_USER_ID, status: "PENDING" } }),
      prisma.task.count({ where: { userId: DEFAULT_USER_ID, status: "COMPLETED" } }),
      prisma.task.count({ where: { userId: DEFAULT_USER_ID, priority: "URGENT", status: { not: "COMPLETED" } } }),
      prisma.event.findMany({
        where: { userId: DEFAULT_USER_ID, startTime: { gte: startOfDay, lt: endOfDay } },
        orderBy: { startTime: "asc" },
      }),
      prisma.event.findMany({
        where: { userId: DEFAULT_USER_ID, startTime: { gte: now, lt: endOfWeek } },
        orderBy: { startTime: "asc" },
        take: 10,
      }),
      prisma.note.count({ where: { userId: DEFAULT_USER_ID } }),
      prisma.note.count({ where: { userId: DEFAULT_USER_ID, pinned: true } }),
      prisma.integration.findMany({ where: { userId: DEFAULT_USER_ID } }),
      prisma.activity.findMany({
        where: { userId: DEFAULT_USER_ID },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } }),
    ]);

    const connectedIntegrations = integrations.filter((i) => i.status === "CONNECTED").length;

    return NextResponse.json({
      user,
      stats: {
        totalTasks,
        pendingTasks,
        completedTasks,
        urgentTasks,
        todayEvents: todayEvents.length,
        weekEvents: weekEvents.length,
        totalNotes,
        pinnedNotes,
        connectedIntegrations,
        totalIntegrations: integrations.length,
      },
      todayEvents,
      weekEvents,
      integrations,
      recentActivities,
    });
  } catch (error) {
    console.error("[dashboard GET]", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
