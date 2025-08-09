import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const users = await prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json(users);
}