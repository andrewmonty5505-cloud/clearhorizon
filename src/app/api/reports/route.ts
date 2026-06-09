import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const city = searchParams.get("city");
  const status = searchParams.get("status");
  const frequency = searchParams.get("frequency");

  const where: Record<string, unknown> = {};

  if (startDate && endDate) {
    where.createdAt = {
      gte: startOfDay(new Date(startDate)),
      lte: endOfDay(new Date(endDate)),
    };
  }
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (status) where.status = status;
  if (frequency) where.frequency = frequency;

  const estimates = await prisma.estimate.findMany({
    where,
    include: {
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      createdBy: { select: { name: true } },
      addOns: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = estimates.map((e) => ({
    id: e.id,
    estimateNumber: e.estimateNumber,
    customerName: `${e.customer.firstName} ${e.customer.lastName}`,
    customerEmail: e.customer.email,
    customerPhone: e.customer.phone,
    city: e.city,
    frequency: e.frequency,
    status: e.status,
    squareFootage: e.squareFootage,
    bedrooms: e.bedrooms,
    bathrooms: e.bathrooms,
    marketArea: e.marketArea,
    basePrice: e.basePrice,
    travelFee: e.travelFee,
    addOnTotal: e.addOnTotal,
    roundedPrice: e.roundedPrice,
    convertedToJob: e.convertedToJob,
    createdBy: e.createdBy.name,
    createdAt: e.createdAt.toISOString(),
  }));

  const summary = {
    total: rows.length,
    totalRevenue: rows.reduce((s, r) => s + r.roundedPrice, 0),
    avgTicket: rows.length > 0 ? rows.reduce((s, r) => s + r.roundedPrice, 0) / rows.length : 0,
    converted: rows.filter((r) => r.status === "CONVERTED").length,
    conversionRate: rows.length > 0 ? (rows.filter((r) => r.status === "CONVERTED").length / rows.length) * 100 : 0,
  };

  return NextResponse.json({ data: rows, summary });
}
