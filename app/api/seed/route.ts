import { NextResponse } from "next/server";
import { seedDefaultUser } from "@/lib/seed";

export async function POST() {
  try {
    const result = await seedDefaultUser();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[seed]", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
