import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/integrations/google/callback`
);

// Scopes per service — all share the same Google OAuth flow
const SCOPES: Record<string, string[]> = {
  GOOGLE_CALENDAR: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/meetings.space.created",
  ],
  GOOGLE_MEET: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/meetings.space.created",
  ],
  GMAIL: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://mail.google.com/",
  ],
};

export async function GET(req: NextRequest) {
  const service = new URL(req.url).searchParams.get("service") ?? "GOOGLE_CALENDAR";
  const scopes = SCOPES[service] ?? SCOPES.GOOGLE_CALENDAR;

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    // state carries which service initiated the flow so the callback knows
    state: service,
  });

  return NextResponse.json({ url });
}

export async function POST(req: NextRequest) {
  // Sync events from Google Calendar
  try {
    const integration = await prisma.integration.findFirst({
      where: { userId: DEFAULT_USER_ID, type: "GOOGLE_CALENDAR" },
    });
    if (!integration?.accessToken) {
      return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 });
    }

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken ?? undefined,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const now = new Date();
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const gcalEvents = res.data.items ?? [];
    let synced = 0;
    for (const ev of gcalEvents) {
      if (!ev.summary || !ev.start?.dateTime) continue;
      await prisma.event.upsert({
        where: { googleEventId: ev.id! } as never,
        update: {
          title: ev.summary,
          startTime: new Date(ev.start.dateTime),
          endTime: new Date(ev.end?.dateTime ?? ev.start.dateTime),
          description: ev.description ?? undefined,
          location: ev.location ?? undefined,
          meetLink: ev.hangoutLink ?? undefined,
        },
        create: {
          title: ev.summary,
          startTime: new Date(ev.start.dateTime),
          endTime: new Date(ev.end?.dateTime ?? ev.start.dateTime),
          description: ev.description ?? undefined,
          location: ev.location ?? undefined,
          meetLink: ev.hangoutLink ?? undefined,
          googleEventId: ev.id!,
          type: "MEETING",
          userId: DEFAULT_USER_ID,
        },
      });
      synced++;
    }

    return NextResponse.json({ synced });
  } catch (error) {
    console.error("[google POST]", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
