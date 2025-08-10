import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { status: true, owner: true },
    take: 200,
  });
  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  const body = await request.json();
  const status = await prisma.leadStatus.findFirst({ orderBy: { order: "asc" } });
  const lead = await prisma.lead.create({
    data: {
      primaryFieldKey: body.primaryFieldKey || "phone",
      primaryFieldValue: body.primaryFieldValue || body.phone || body.email || "",
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      source: body.source,
      statusId: status?.id || (await prisma.leadStatus.create({ data: { name: "جدید" } })).id,
    },
  });
  return NextResponse.json(lead);
}