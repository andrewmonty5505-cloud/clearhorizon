import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      customer: true,
      addOns: true,
    },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const companyData = {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || "SWFL Cleaning Pro",
    phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "(239) 555-0100",
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "info@swflcleaning.com",
    website: process.env.NEXT_PUBLIC_COMPANY_WEBSITE || "www.swflcleaning.com",
    address: "Southwest Florida",
  };

  return NextResponse.json({
    data: {
      estimate: {
        estimateNumber: estimate.estimateNumber,
        city: estimate.city,
        squareFootage: estimate.squareFootage,
        bedrooms: estimate.bedrooms,
        bathrooms: estimate.bathrooms,
        frequency: estimate.frequency,
        marketArea: estimate.marketArea,
        basePrice: estimate.basePrice,
        travelFee: estimate.travelFee,
        addOnTotal: estimate.addOnTotal,
        roundedPrice: estimate.roundedPrice,
        productionHours: estimate.productionHours,
        condition: estimate.condition,
        firstTimeType: estimate.firstTimeType,
        expiresAt: estimate.expiresAt?.toISOString() ?? null,
        notes: estimate.notes,
        createdAt: estimate.createdAt.toISOString(),
        addOns: estimate.addOns,
      },
      customer: {
        firstName: estimate.customer.firstName,
        lastName: estimate.customer.lastName,
        email: estimate.customer.email,
        phone: estimate.customer.phone,
        address: estimate.customer.address,
        city: estimate.customer.city,
        zip: estimate.customer.zip,
      },
      company: companyData,
    },
  });
}
