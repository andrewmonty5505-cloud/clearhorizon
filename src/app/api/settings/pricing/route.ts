import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configs = await prisma.pricingConfig.findMany({
    orderBy: [{ category: "asc" }, { label: "asc" }],
  });

  return NextResponse.json({ data: configs });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updates = body as Array<{ key: string; value: string }>;

  const results = await Promise.all(
    updates.map(async (update) => {
      const old = await prisma.pricingConfig.findUnique({ where: { key: update.key } });
      const updated = await prisma.pricingConfig.update({
        where: { key: update.key },
        data: { value: update.value, updatedById: session.user.id },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_PRICING",
          entity: "PricingConfig",
          entityId: update.key,
          oldValues: { value: old?.value },
          newValues: { value: update.value },
        },
      });

      return updated;
    })
  );

  return NextResponse.json({ data: results });
}
