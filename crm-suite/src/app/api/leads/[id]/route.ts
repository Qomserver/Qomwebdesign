import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({ where: { id: params.id }, include: { status: true, owner: true, events: true } });
  if (!lead) return NextResponse.json({ message: "یافت نشد" }, { status: 404 });
  return NextResponse.json(lead);
}