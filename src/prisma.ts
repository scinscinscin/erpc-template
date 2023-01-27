import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient({
  log:
    process.env.NODE_ENV === "dev"
      ? [
          { emit: "stdout", level: "error" },
          { emit: "stdout", level: "info" },
          { emit: "stdout", level: "query" },
          { emit: "stdout", level: "warn" },
        ]
      : [],
});
