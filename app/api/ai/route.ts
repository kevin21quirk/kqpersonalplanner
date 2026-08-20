import { NextRequest, NextResponse } from "next/server";
import { openai, SYSTEM_PROMPT } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID, parseAIAction } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build message history for context
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...((history ?? []).slice(-10) as { role: "user" | "assistant"; content: string }[]),
      { role: "user", content: message },
    ];

    let assistantReply = "";

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here") {
      // Fallback demo response when no API key is set
      assistantReply = await generateDemoResponse(message);
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      assistantReply = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";
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

async function generateDemoResponse(message: string): Promise<string> {
  const lower = message.toLowerCase();

  if (lower.includes("task") && (lower.includes("create") || lower.includes("add"))) {
    const title = message.replace(/create|add|a task|task/gi, "").trim() || "New Task";
    return `I've created a new task for you: "${title}". It's been added to your task list with medium priority.\n\n\`\`\`action\n{"type":"CREATE_TASK","payload":{"title":"${title}","priority":"MEDIUM"}}\n\`\`\``;
  }
  if (lower.includes("meeting") || lower.includes("schedule") || lower.includes("event")) {
    return "I'd love to schedule that meeting for you! Once you add your OpenAI API key, I can fully parse your request and create the event with all the details automatically.";
  }
  if (lower.includes("note")) {
    return "Great idea! I'll make a note of that. With your OpenAI API key configured, I can intelligently extract the title, content, and tags from your message.";
  }
  if (lower.includes("today") || lower.includes("agenda") || lower.includes("schedule")) {
    const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    return `Here's a summary for ${today}:\n\n• **Team standup** at 9:00 AM\n• **Client call – TechCorp demo** at 2:00 PM\n• **5 tasks** in your queue (1 urgent, 2 high priority)\n\nAdd your OpenAI API key in the settings to enable full natural language planning.`;
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello Kevin! 👋 I'm your AI personal assistant for AI Bridge Solutions. I can help you manage tasks, schedule meetings, create notes, and organise your day. What would you like to do?";
  }
  return `I received your message: *"${message}"*\n\nTo enable full AI capabilities, please add your **OpenAI API key** to the environment settings. I can then understand any natural language instruction and take action across your calendar, tasks, notes, and integrations.`;
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
