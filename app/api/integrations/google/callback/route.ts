import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/integrations/google/callback`
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?error=google_auth_failed", req.url));
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    await prisma.integration.upsert({
      where: { userId_type: { userId: DEFAULT_USER_ID, type: "GOOGLE_CALENDAR" } },
      update: {
        status: "CONNECTED",
        accessToken: tokens.access_token ?? undefined,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt,
      },
      create: {
        type: "GOOGLE_CALENDAR",
        status: "CONNECTED",
        accessToken: tokens.access_token ?? undefined,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt,
        userId: DEFAULT_USER_ID,
      },
    });

    await prisma.integration.upsert({
      where: { userId_type: { userId: DEFAULT_USER_ID, type: "GOOGLE_MEET" } },
      update: { status: "CONNECTED" },
      create: { type: "GOOGLE_MEET", status: "CONNECTED", userId: DEFAULT_USER_ID },
    });

    await prisma.activity.create({
      data: {
        type: "INTEGRATION_CONNECTED",
        description: "Connected: Google Calendar & Meet",
        userId: DEFAULT_USER_ID,
      },
    });

    return NextResponse.redirect(new URL("/?connected=google", req.url));
  } catch (error) {
    console.error("[google callback]", error);
    return NextResponse.redirect(new URL("/?error=google_auth_failed", req.url));
  }
}
