import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const leadCount = await prisma.lead.count();
  const orders = await prisma.order.findMany({ select: { id: true, status: true } });
  const successful = orders.filter((o) => o.status === "paid" || o.status === "completed").length;
  const conversionRate = leadCount ? successful / leadCount : 0;
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = Math.max(0, Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const tasks = await prisma.task.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true } });
  const events = await prisma.event.findMany({ take: 5, orderBy: { when: "asc" }, select: { id: true, title: true, when: true } });

  const conversionBySource = await prisma.lead.groupBy({ by: ["source"], _count: { _all: true }, where: { source: { not: null } } });
  const ordersBySource = await prisma.order.findMany({ select: { id: true, leadId: true, status: true }, where: { status: { in: ["paid", "completed"] } } });
  const map = new Map<string, { leads: number; sales: number }>();
  for (const g of conversionBySource) {
    const key = (g.source as string) || "نامشخص";
    map.set(key, { leads: g._count._all, sales: 0 });
  }
  for (const o of ordersBySource) {
    if (!o.leadId) continue;
    const lead = await prisma.lead.findUnique({ where: { id: o.leadId } });
    const key = lead?.source || "نامشخص";
    const entry = map.get(key) || { leads: 0, sales: 0 };
    entry.sales += 1;
    map.set(key, entry);
  }
  const bySource = Array.from(map.entries()).map(([source, v]) => ({ source, rate: v.leads ? v.sales / v.leads : 0 }));

  const quotes = [
    "هر تماس یک فرصت است.",
    "تمرکز بر ارزش، فروش را آسان می‌کند.",
    "پشتکار، کلید موفقیت در فروش است.",
  ];

  return NextResponse.json({ leadCount, conversionRate, daysRemaining, tasks, events, quotes, conversionBySource: bySource });
}