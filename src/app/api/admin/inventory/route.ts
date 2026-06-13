import { NextResponse } from "next/server";
import { InventoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin-api";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const counts = await prisma.inventoryItem.groupBy({
    by: ["productId", "status"],
    _count: true
  });

  return NextResponse.json({ counts });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    productId?: string;
    secrets?: string;
  };
  const secrets = (body.secrets ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!body.productId || !secrets.length) {
    return NextResponse.json({ error: "Product and secrets are required" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventoryItem.createMany({
      data: secrets.map((secret) => ({
        productId: body.productId as string,
        secret,
        status: InventoryStatus.AVAILABLE
      }))
    });

    const stock = await tx.inventoryItem.count({
      where: {
        productId: body.productId,
        status: InventoryStatus.AVAILABLE
      }
    });

    await tx.product.update({
      where: { id: body.productId },
      data: { stock }
    });
  });

  return NextResponse.json({ imported: secrets.length });
}
