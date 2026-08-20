import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "COMPLETED") data.completedAt = new Date();
    }
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.tags !== undefined) data.tags = body.tags;

    const task = await prisma.task.update({ where: { id, userId: DEFAULT_USER_ID }, data });

    if (body.status === "COMPLETED") {
      await prisma.activity.create({
        data: { type: "TASK_COMPLETED", description: `Completed: ${task.title}`, userId: DEFAULT_USER_ID },
      });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error("[tasks PATCH]", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.task.delete({ where: { id, userId: DEFAULT_USER_ID } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tasks DELETE]", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
