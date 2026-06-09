import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateEstimateNumber } from "@/lib/utils";
import { parsePricingConfig, calculateEstimate } from "@/lib/pricing-engine";

const createEstimateSchema = z.object({
  customerId: z.string().optional(),
  // Customer info (for new customers)
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  customerCity: z.string().optional(),
  zip: z.string().optional(),
  // Property
  squareFootage: z.number().min(100).max(20000),
  bedrooms: z.number().min(1).max(20),
  bathrooms: z.number().min(0.5).max(20),
  city: z.string().min(1),
  propertyType: z.string().optional(),
  // Conditions
  occupancy: z.string(),
  flooringType: z.string(),
  condition: z.string(),
  petLevel: z.string(),
  firstTimeType: z.string(),
  // Features
  hasStairs: z.boolean().default(false),
  hasElevator: z.boolean().default(false),
  hasHomeOffice: z.boolean().default(false),
  hasGym: z.boolean().default(false),
  hasTheaterRoom: z.boolean().default(false),
  hasLanai: z.boolean().default(false),
  hasPoolBath: z.boolean().default(false),
  // Service
  frequency: z.string(),
  marketArea: z.string(),
  distanceMiles: z.number().default(0),
  seasonalOverride: z.number().nullable().optional(),
  // Add-ons
  addOns: z.array(z.object({ key: z.string(), quantity: z.number() })).default([]),
  // Metadata
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const q = searchParams.get("q") || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (q) {
    where.OR = [
      { estimateNumber: { contains: q, mode: "insensitive" } },
      { customer: { firstName: { contains: q, mode: "insensitive" } } },
      { customer: { lastName: { contains: q, mode: "insensitive" } } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * pageSize;
  const [estimates, total] = await Promise.all([
    prisma.estimate.findMany({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
        addOns: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.estimate.count({ where }),
  ]);

  return NextResponse.json({
    data: estimates,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createEstimateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Get or create customer
  let customerId = data.customerId;
  if (!customerId && data.firstName && data.lastName) {
    const customer = await prisma.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.customerCity || null,
        zip: data.zip || null,
      },
    });
    customerId = customer.id;
  }

  if (!customerId) {
    return NextResponse.json({ error: "Customer is required" }, { status: 400 });
  }

  // Load pricing config
  const configs = await prisma.pricingConfig.findMany();
  const pricingConfig = parsePricingConfig(configs);

  // Calculate
  const breakdown = calculateEstimate({
    squareFootage: data.squareFootage,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    petLevel: data.petLevel as never,
    hasStairs: data.hasStairs,
    hasElevator: data.hasElevator,
    hasHomeOffice: data.hasHomeOffice,
    hasGym: data.hasGym,
    hasTheaterRoom: data.hasTheaterRoom,
    hasLanai: data.hasLanai,
    hasPoolBath: data.hasPoolBath,
    occupancy: data.occupancy as never,
    flooringType: data.flooringType as never,
    condition: data.condition as never,
    firstTimeType: data.firstTimeType as never,
    frequency: data.frequency as never,
    marketArea: data.marketArea as never,
    distanceMiles: data.distanceMiles,
    addOns: data.addOns,
    seasonalOverride: data.seasonalOverride,
    config: pricingConfig,
  });

  const estimateNumber = generateEstimateNumber();

  const estimate = await prisma.estimate.create({
    data: {
      estimateNumber,
      customerId,
      createdById: session.user.id,
      squareFootage: data.squareFootage,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      city: data.city,
      propertyType: data.propertyType || null,
      occupancy: data.occupancy as never,
      flooringType: data.flooringType as never,
      condition: data.condition as never,
      petLevel: data.petLevel as never,
      firstTimeType: data.firstTimeType as never,
      hasStairs: data.hasStairs,
      hasElevator: data.hasElevator,
      hasHomeOffice: data.hasHomeOffice,
      hasGym: data.hasGym,
      hasTheaterRoom: data.hasTheaterRoom,
      hasLanai: data.hasLanai,
      hasPoolBath: data.hasPoolBath,
      frequency: data.frequency as never,
      marketArea: data.marketArea as never,
      distanceMiles: data.distanceMiles,
      seasonalMultiplierOverride: data.seasonalOverride,
      baseHours: breakdown.totalLaborHours,
      productionHours: breakdown.productionHours,
      basePrice: breakdown.basePrice,
      travelFee: breakdown.travelFee,
      addOnTotal: breakdown.addOnTotal,
      finalPrice: breakdown.finalPriceAfterMinimum,
      roundedPrice: breakdown.roundedPrice,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 30 * 86400000),
      notes: data.notes || null,
      internalNotes: data.internalNotes || null,
      addOns: {
        create: breakdown.addOnBreakdown.map((a) => ({
          addOnKey: a.key,
          name: a.name,
          quantity: a.quantity,
          unitPrice: a.unitPrice,
          totalPrice: a.totalPrice,
        })),
      },
    },
    include: {
      customer: true,
      addOns: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: estimate, breakdown }, { status: 201 });
}
