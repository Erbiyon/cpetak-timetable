import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Ensure the connection is established
if (process.env.NODE_ENV === "production") {
  prisma.$connect().catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
