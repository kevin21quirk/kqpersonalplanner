import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("[notes GET]", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const note = await prisma.note.create({
      data: {
        title: body.title,
        content: body.content,
        tags: body.tags ?? [],
        pinned: body.pinned ?? false,
        userId: DEFAULT_USER_ID,
      },
    });
    await prisma.activity.create({
      data: { type: "NOTE_CREATED", description: `Added note: ${note.title}`, userId: DEFAULT_USER_ID },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("[notes POST]", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
