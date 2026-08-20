import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const event = await prisma.event.update({
      where: { id, userId: DEFAULT_USER_ID },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.startTime && { startTime: new Date(body.startTime) }),
        ...(body.endTime && { endTime: new Date(body.endTime) }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.meetLink !== undefined && { meetLink: body.meetLink }),
        ...(body.type && { type: body.type }),
        ...(body.attendees !== undefined && { attendees: body.attendees }),
      },
    });
    await prisma.activity.create({
      data: { type: "EVENT_UPDATED", description: `Updated: ${event.title}`, userId: DEFAULT_USER_ID },
    });
    return NextResponse.json(event);
  } catch (error) {
    console.error("[events PATCH]", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.event.delete({ where: { id, userId: DEFAULT_USER_ID } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[events DELETE]", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
