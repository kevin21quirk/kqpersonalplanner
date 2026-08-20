/**
 * Seed a default user and demo data on first run.
 * Called from the /api/seed endpoint.
 */
import { prisma } from "./prisma";

export async function seedDefaultUser() {
  const userId = "kq-owner";

  // Upsert owner user
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: process.env.OWNER_EMAIL ?? "kevin@aibridgesolutions.com",
      name: process.env.OWNER_NAME ?? "Kevin",
      role: "owner",
      timezone: "Europe/London",
    },
  });

  // Check if demo data exists
  const taskCount = await prisma.task.count({ where: { userId } });
  if (taskCount > 0) return { seeded: false, message: "Data already exists" };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Demo tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Review Q3 business strategy",
        description: "Go through the AI Bridge Solutions Q3 roadmap and identify key milestones",
        priority: "HIGH",
        status: "IN_PROGRESS",
        userId,
        dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        tags: ["strategy", "business"],
      },
      {
        title: "Prepare client demo for TechCorp",
        priority: "URGENT",
        status: "PENDING",
        userId,
        dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        tags: ["client", "demo"],
      },
      {
        title: "Review API integration documentation",
        priority: "MEDIUM",
        status: "PENDING",
        userId,
        tags: ["development", "api"],
      },
      {
        title: "Send weekly update to team",
        priority: "LOW",
        status: "COMPLETED",
        completedAt: new Date(),
        userId,
        tags: ["team"],
      },
      {
        title: "Set up Stripe payments for new SaaS product",
        priority: "HIGH",
        status: "PENDING",
        userId,
        dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        tags: ["development", "payments"],
      },
    ],
  });

  // Demo events
  await prisma.event.createMany({
    data: [
      {
        title: "Team standup",
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 9.25 * 60 * 60 * 1000),
        type: "MEETING",
        meetLink: "https://meet.google.com/abc-defg-hij",
        userId,
      },
      {
        title: "Client call – TechCorp demo",
        startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000),
        description: "Present AI Bridge Solutions' integration platform",
        type: "MEETING",
        attendees: [{ name: "TechCorp CEO", email: "ceo@techcorp.example" }],
        userId,
      },
      {
        title: "1:1 with Product Lead",
        startTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
        type: "MEETING",
        userId,
      },
      {
        title: "Investor update call",
        startTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
        type: "MEETING",
        userId,
      },
    ],
  });

  // Demo notes
  await prisma.note.createMany({
    data: [
      {
        title: "AI Bridge Solutions – Product Vision 2026",
        content: "Focus on enterprise integrations. Key verticals: healthcare, fintech, legal. Core differentiator: natural language interface for any business tool.",
        tags: ["vision", "strategy"],
        pinned: true,
        userId,
      },
      {
        title: "TechCorp meeting notes",
        content: "They need Google Workspace + Salesforce integration. Budget: £50k. Decision timeline: 3 weeks. Contact: John Smith.",
        tags: ["client", "sales"],
        userId,
      },
      {
        title: "Ideas for next sprint",
        content: "1. Auto-scheduling feature\n2. Email triage with AI\n3. Slack integration\n4. Mobile app prototype",
        tags: ["ideas", "development"],
        userId,
      },
    ],
  });

  // Demo integrations
  await prisma.integration.createMany({
    data: [
      { type: "GOOGLE_CALENDAR", status: "DISCONNECTED", userId },
      { type: "GOOGLE_MEET", status: "DISCONNECTED", userId },
      { type: "GMAIL", status: "DISCONNECTED", userId },
      { type: "SLACK", status: "DISCONNECTED", userId },
      { type: "LINKEDIN", status: "DISCONNECTED", userId },
      { type: "NOTION", status: "DISCONNECTED", userId },
    ],
  });

  // Demo activities
  await prisma.activity.createMany({
    data: [
      { type: "TASK_CREATED", description: "Created task: Review Q3 business strategy", userId },
      { type: "EVENT_CREATED", description: "Scheduled: Team standup", userId },
      { type: "NOTE_CREATED", description: "Added note: AI Bridge Solutions – Product Vision 2026", userId },
      { type: "TASK_COMPLETED", description: "Completed: Send weekly update to team", userId },
    ],
  });

  return { seeded: true, message: "Demo data created successfully" };
}
