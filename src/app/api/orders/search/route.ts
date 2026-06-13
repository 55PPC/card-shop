import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { orderSearchSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = orderSearchSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order search request" }, { status: 400 });
  }

  const order = parsed.data.orderNo
    ? await findOrderByNo(parsed.data.orderNo)
    : await findLatestOrderByEmail(parsed.data.email);

  if (!order || !(await verifyPassword(parsed.data.queryPassword, order.queryPasswordHash))) {
    return NextResponse.json({ error: "Order not found or password is incorrect" }, { status: 404 });
  }

  return NextResponse.json({
    orderNo: order.orderNo,
    email: order.email,
    status: order.status,
    total: order.total.toNumber(),
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    deliveredAt: order.deliveredAt,
    items: order.items.map((item) => ({
      productTitle: item.productTitle,
      quantity: item.quantity,
      total: item.total.toNumber()
    })),
    deliveryItems: order.status === OrderStatus.DELIVERED ? order.deliveryItems : null,
    deliverySummary: order.status === OrderStatus.DELIVERED ? order.deliverySummary : null
  });
}

function orderInclude() {
  return {
    items: true
  } as const;
}

async function findOrderByNo(orderNo: string) {
  return prisma.order.findUnique({
    where: { orderNo },
    include: orderInclude()
  });
}

async function findLatestOrderByEmail(email: string | undefined) {
  if (!email) {
    return null;
  }

  return prisma.order.findFirst({
    where: { email },
    include: orderInclude(),
    orderBy: { createdAt: "desc" }
  });
}
