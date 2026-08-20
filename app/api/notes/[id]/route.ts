import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const note = await prisma.note.update({
      where: { id, userId: DEFAULT_USER_ID },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.pinned !== undefined && { pinned: body.pinned }),
      },
    });
    return NextResponse.json(note);
  } catch (error) {
    console.error("[notes PATCH]", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.note.delete({ where: { id, userId: DEFAULT_USER_ID } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[notes DELETE]", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
