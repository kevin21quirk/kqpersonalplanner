import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        ...(status && { status: status as never }),
        ...(priority && { priority: priority as never }),
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[tasks GET]", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        priority: body.priority ?? "MEDIUM",
        status: body.status ?? "PENDING",
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        tags: body.tags ?? [],
        userId: DEFAULT_USER_ID,
      },
    });
    // Log activity
    await prisma.activity.create({
      data: {
        type: "TASK_CREATED",
        description: `Created task: ${task.title}`,
        userId: DEFAULT_USER_ID,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[tasks POST]", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
