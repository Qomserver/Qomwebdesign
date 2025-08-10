import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const roleAdmin = await prisma.role.upsert({ where: { name: "admin" }, create: { name: "admin" }, update: {} });
  const roleSales = await prisma.role.upsert({ where: { name: "sales" }, create: { name: "sales" }, update: {} });

  await prisma.leadStatus.upsert({ where: { name: "جدید" }, create: { name: "جدید", order: 1 }, update: {} });
  await prisma.leadStatus.upsert({ where: { name: "در حال پیگیری" }, create: { name: "در حال پیگیری", order: 2 }, update: {} });
  await prisma.leadStatus.upsert({ where: { name: "بسته شده" }, create: { name: "بسته شده", order: 3 }, update: {} });

  const adminEmail = "admin@example.com";
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({ data: { email: adminEmail, firstName: "مدیر", lastName: "سیستم", passwordHash, roleId: roleAdmin.id, isActive: true } });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});