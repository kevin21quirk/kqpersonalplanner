import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error("[activities GET]", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
