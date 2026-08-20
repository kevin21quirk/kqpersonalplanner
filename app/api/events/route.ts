import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const events = await prisma.event.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        ...(from && { startTime: { gte: new Date(from) } }),
        ...(to && { endTime: { lte: new Date(to) } }),
      },
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("[events GET]", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        location: body.location,
        meetLink: body.meetLink,
        type: body.type ?? "MEETING",
        attendees: body.attendees ?? [],
        color: body.color,
        isAllDay: body.isAllDay ?? false,
        userId: DEFAULT_USER_ID,
      },
    });
    await prisma.activity.create({
      data: {
        type: "EVENT_CREATED",
        description: `Scheduled: ${event.title}`,
        userId: DEFAULT_USER_ID,
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("[events POST]", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
