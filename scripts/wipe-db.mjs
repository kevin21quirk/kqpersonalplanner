import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const tables = [
  "chatMessage",
  "activity",
  "integration",
  "note",
  "event",
  "task",
  "user",
];

for (const table of tables) {
  const result = await prisma[table].deleteMany({});
  console.log(`Deleted ${result.count} rows from ${table}`);
}

console.log("Database wiped clean.");
await prisma.$disconnect();
