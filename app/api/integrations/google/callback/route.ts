import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { IntegrationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/integrations/google/callback`
);

// Which integration types to mark CONNECTED for each OAuth flow
const CONNECTED_TYPES: Record<string, string[]> = {
  GOOGLE_CALENDAR: ["GOOGLE_CALENDAR", "GOOGLE_MEET"],
  GOOGLE_MEET:     ["GOOGLE_CALENDAR", "GOOGLE_MEET"],
  GMAIL:           ["GMAIL"],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state") ?? "GOOGLE_CALENDAR"; // which service initiated

  if (!code) {
    return NextResponse.redirect(new URL("/?error=google_auth_failed", req.url));
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    const typesToConnect = CONNECTED_TYPES[state] ?? CONNECTED_TYPES.GOOGLE_CALENDAR;

    for (const type of typesToConnect) {
      const integType = type as IntegrationType;
      // Primary type (first one) stores the real tokens; companion types just get CONNECTED status
      const isPrimary = type === typesToConnect[0];
      await prisma.integration.upsert({
        where: { userId_type: { userId: DEFAULT_USER_ID, type: integType } },
        update: {
          status: "CONNECTED",
          ...(isPrimary && {
            accessToken:  tokens.access_token  ?? undefined,
            refreshToken: tokens.refresh_token ?? undefined,
            expiresAt,
          }),
        },
        create: {
          type: integType,
          status: "CONNECTED",
          userId: DEFAULT_USER_ID,
          ...(isPrimary && {
            accessToken:  tokens.access_token  ?? undefined,
            refreshToken: tokens.refresh_token ?? undefined,
            expiresAt,
          }),
        },
      });
    }

    const labelMap: Record<string, string> = {
      GOOGLE_CALENDAR: "Google Calendar & Meet",
      GOOGLE_MEET:     "Google Calendar & Meet",
      GMAIL:           "Gmail",
    };

    await prisma.activity.create({
      data: {
        type: "INTEGRATION_CONNECTED",
        description: `Connected: ${labelMap[state] ?? state}`,
        userId: DEFAULT_USER_ID,
      },
    });

    return NextResponse.redirect(new URL("/?connected=google", req.url));
  } catch (error) {
    console.error("[google callback]", error);
    return NextResponse.redirect(new URL("/?error=google_auth_failed", req.url));
  }
}
