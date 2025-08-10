import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) return NextResponse.json({ message: "ایمیل و رمز عبور الزامی است" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return NextResponse.json({ message: "کاربر یافت نشد" }, { status: 401 });
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ message: "اطلاعات ورود نادرست است" }, { status: 401 });
  const token = await signToken({ sub: user.id, roleId: user.roleId });
  cookies().set("token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return NextResponse.json({ ok: true });
}