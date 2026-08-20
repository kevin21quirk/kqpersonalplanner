import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/utils";

export async function GET() {
  try {
    const integrations = await prisma.integration.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { type: "asc" },
    });
    return NextResponse.json(integrations);
  } catch (error) {
    console.error("[integrations GET]", error);
    return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 });
  }
}
