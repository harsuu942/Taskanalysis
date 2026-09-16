import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

async function main() {
  const passwordHash = hashPassword("harsh123");
  console.log("Generated hash with 100,000 PBKDF2 iterations.");

  const user = await prisma.user.upsert({
    where: { userId: "harsh" },
    update: {
      password: passwordHash,
      name: "Harsh",
      email: "harsh@personal.studio",
      role: "ADMIN",
    },
    create: {
      userId: "harsh",
      name: "Harsh",
      email: "harsh@personal.studio",
      role: "ADMIN",
      password: passwordHash,
    },
  });

  console.log("Upserted user:", { id: user.id, userId: user.userId, name: user.name, role: user.role });

  // Update permissions on dev.db
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  if (fs.existsSync(dbPath)) {
    fs.chmodSync(dbPath, 0o600);
    console.log("Successfully set chmod 600 on prisma/dev.db");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
