import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, SYSTEM_PROMPT, CLAUDE_MODEL } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID, parseAIAction } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Anthropic API: system prompt is separate; messages are user/assistant only
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...((history ?? []).slice(-10) as { role: "user" | "assistant"; content: string }[]),
      { role: "user", content: message },
    ];

    let assistantReply = "";

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback demo response when no API key is set
      assistantReply = await generateDemoResponse(message);
    } else {
      const response = await getOpenAI().messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      });
      const block = response.content[0];
      assistantReply = block.type === "text" ? block.text : "I'm sorry, I couldn't generate a response.";
    }

    // Parse any action from the response
    const { text, action } = parseAIAction(assistantReply);
    let actionResult = null;

    if (action) {
      actionResult = await executeAction(action as { type: string; payload: Record<string, unknown> });
    }

    // Save to chat history
    await prisma.chatMessage.createMany({
      data: [
        { role: "USER", content: message, userId: DEFAULT_USER_ID },
        { role: "ASSISTANT", content: text, metadata: action ? ({ action, actionResult } as object) : undefined, userId: DEFAULT_USER_ID },
      ],
    });

    await prisma.activity.create({
      data: { type: "AI_COMMAND", description: `AI: ${message.slice(0, 80)}`, userId: DEFAULT_USER_ID },
    });

    return NextResponse.json({ reply: text, action, actionResult });
  } catch (error) {
    console.error("[ai POST]", error);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}

async function executeAction(action: { type: string; payload: Record<string, unknown> }) {
  const { type, payload } = action;
  try {
    switch (type) {
      case "CREATE_TASK": {
        const task = await prisma.task.create({
          data: {
            title: payload.title as string,
            description: payload.description as string | undefined,
            priority: (payload.priority as never) ?? "MEDIUM",
            dueDate: payload.dueDate ? new Date(payload.dueDate as string) : undefined,
            tags: (payload.tags as string[]) ?? [],
            userId: DEFAULT_USER_ID,
          },
        });
        await prisma.activity.create({
          data: { type: "TASK_CREATED", description: `Created task: ${task.title}`, userId: DEFAULT_USER_ID },
        });
        return { success: true, id: task.id };
      }

      case "CREATE_EVENT": {
        const event = await prisma.event.create({
          data: {
            title: payload.title as string,
            startTime: new Date(payload.startTime as string),
            endTime: new Date(payload.endTime as string),
            description: payload.description as string | undefined,
            location: payload.location as string | undefined,
            meetLink: payload.meetLink as string | undefined,
            type: (payload.type as never) ?? "MEETING",
            attendees: (payload.attendees as object[]) ?? [],
            userId: DEFAULT_USER_ID,
          },
        });
        await prisma.activity.create({
          data: { type: "EVENT_CREATED", description: `Scheduled: ${event.title}`, userId: DEFAULT_USER_ID },
        });
        return { success: true, id: event.id };
      }

      case "CREATE_NOTE": {
        const note = await prisma.note.create({
          data: {
            title: payload.title as string,
            content: payload.content as string,
            tags: (payload.tags as string[]) ?? [],
            pinned: (payload.pinned as boolean) ?? false,
            userId: DEFAULT_USER_ID,
          },
        });
        await prisma.activity.create({
          data: { type: "NOTE_CREATED", description: `Added note: ${note.title}`, userId: DEFAULT_USER_ID },
        });
        return { success: true, id: note.id };
      }

      default:
        return { success: false, message: "Unknown action type" };
    }
  } catch (err) {
    console.error("[executeAction]", err);
    return { success: false, error: String(err) };
  }
}

async function generateDemoResponse(_message: string): Promise<string> {
  return "To enable the AI assistant, add your **ANTHROPIC_API_KEY** in Vercel → Settings → Environment Variables, then redeploy. Once connected, you can speak naturally — \"Create a task to review the proposal\", \"Schedule a meeting with John on Friday at 2pm\", \"Show me today's agenda\" — and I'll take care of it automatically.";
}

export async function GET() {
  try {
    const history = await prisma.chatMessage.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    return NextResponse.json(history);
  } catch (error) {
    console.error("[ai GET]", error);
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}
