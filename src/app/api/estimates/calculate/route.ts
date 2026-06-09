import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePricingConfig, calculateEstimate } from "@/lib/pricing-engine";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const configs = await prisma.pricingConfig.findMany();
  const pricingConfig = parsePricingConfig(configs);

  const breakdown = calculateEstimate({ ...body, config: pricingConfig });
  return NextResponse.json({ data: breakdown });
}
