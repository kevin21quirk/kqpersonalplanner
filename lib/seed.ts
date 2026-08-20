/**
 * Ensures the owner user record exists on first app load.
 * No demo data is created — the app starts completely clean.
 */
import { prisma } from "./prisma";

export async function seedDefaultUser() {
  await prisma.user.upsert({
    where: { id: "kq-owner" },
    update: {},
    create: {
      id: "kq-owner",
      email: process.env.OWNER_EMAIL ?? "kevin@aibridgesolutions.com",
      name: process.env.OWNER_NAME ?? "Kevin",
      role: "owner",
      timezone: "Europe/London",
    },
  });
  return { ready: true };
}
