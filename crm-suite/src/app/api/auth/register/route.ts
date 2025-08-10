import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password, firstName, lastName } = await request.json();
  if (!email || !password || !firstName || !lastName) return NextResponse.json({ message: "اطلاعات ناقص است" }, { status: 400 });
  let role = await prisma.role.findFirst({ where: { name: "admin" } });
  if (!role) role = await prisma.role.create({ data: { name: "admin" } });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ message: "ایمیل تکراری است" }, { status: 409 });
  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { email, passwordHash, firstName, lastName, roleId: role.id, isActive: true } });
  return NextResponse.json({ ok: true });
}