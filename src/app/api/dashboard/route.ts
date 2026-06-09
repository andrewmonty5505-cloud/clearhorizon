import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfMonth, subMonths, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = startOfMonth(now);

  const [
    estimatesToday,
    estimatesThisMonth,
    estimatesLastMonth,
    allEstimates,
    recentEstimates,
    recentCustomers,
  ] = await Promise.all([
    prisma.estimate.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.estimate.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.estimate.count({ where: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
    prisma.estimate.findMany({
      where: { status: { not: "DRAFT" } },
      select: { roundedPrice: true, status: true, frequency: true, city: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.estimate.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, firstName: true, lastName: true, createdAt: true },
    }),
  ]);

  const converted = allEstimates.filter((e) => e.status === "CONVERTED");
  const conversionRate = allEstimates.length > 0 ? (converted.length / allEstimates.length) * 100 : 0;
  const totalRevenue = allEstimates.reduce((sum, e) => sum + e.roundedPrice, 0);
  const avgTicket = allEstimates.length > 0 ? totalRevenue / allEstimates.length : 0;

  // Monthly revenue (last 6 months)
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const start = startOfMonth(subMonths(now, i));
    const end = i === 0 ? now : startOfMonth(subMonths(now, i - 1));
    const monthEstimates = allEstimates.filter(
      (e) => new Date(e.createdAt) >= start && new Date(e.createdAt) < end
    );
    monthlyRevenue.push({
      month: format(start, "MMM"),
      revenue: monthEstimates.reduce((sum, e) => sum + e.roundedPrice, 0),
      count: monthEstimates.length,
    });
  }

  // By frequency
  const freqMap: Record<string, number> = {};
  allEstimates.forEach((e) => {
    freqMap[e.frequency] = (freqMap[e.frequency] || 0) + 1;
  });
  const estimatesByFrequency = Object.entries(freqMap).map(([frequency, count]) => ({ frequency, count }));

  // By city
  const cityMap: Record<string, { count: number; revenue: number }> = {};
  allEstimates.forEach((e) => {
    if (!cityMap[e.city]) cityMap[e.city] = { count: 0, revenue: 0 };
    cityMap[e.city].count++;
    cityMap[e.city].revenue += e.roundedPrice;
  });
  const estimatesByCity = Object.entries(cityMap)
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Activity feed
  const activity = [
    ...recentEstimates.map((e) => ({
      id: e.id,
      type: "estimate" as const,
      description: `New estimate ${e.estimateNumber} for ${e.customer.firstName} ${e.customer.lastName}`,
      createdAt: e.createdAt.toISOString(),
      user: e.createdBy.name || "Staff",
    })),
    ...recentCustomers.map((c) => ({
      id: c.id,
      type: "customer" as const,
      description: `New customer: ${c.firstName} ${c.lastName}`,
      createdAt: c.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  return NextResponse.json({
    kpi: {
      estimatesToday,
      estimatesThisMonth,
      totalEstimatedRevenue: totalRevenue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      averageTicketValue: Math.round(avgTicket),
      estimatesTodayChange: 0,
      estimatesMonthChange: estimatesLastMonth > 0 ? ((estimatesThisMonth - estimatesLastMonth) / estimatesLastMonth) * 100 : 0,
      revenueChange: 0,
    },
    monthlyRevenue,
    estimatesByFrequency,
    estimatesByCity,
    activity,
  });
}
