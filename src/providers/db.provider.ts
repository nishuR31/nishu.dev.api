import { PrismaClient } from "@prisma/client";
import { NODE_ENV } from "../config/envConfig";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
