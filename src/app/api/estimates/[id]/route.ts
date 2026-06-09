import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      customer: true,
      addOns: true,
      createdBy: { select: { id: true, name: true } },
      proposals: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: estimate });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const estimate = await prisma.estimate.update({
    where: { id },
    data: body,
    include: { customer: true, addOns: true },
  });

  return NextResponse.json({ data: estimate });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.estimate.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
