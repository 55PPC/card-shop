import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ orderNo: string }>;
};

const STATUS_TEXT: Record<OrderStatus, string> = {
  PENDING: "待支付",
  PAID: "已支付",
  DELIVERED: "已发货",
  EXPIRED: "已过期",
  CANCELLED: "已取消",
  REFUNDED: "已退款"
};

export async function GET(_request: Request, context: RouteContext) {
  const { orderNo } = await context.params;
  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: {
      orderNo: true,
      status: true,
      total: true,
      paidAt: true,
      deliveredAt: true,
      createdAt: true
    }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    orderNo: order.orderNo,
    paid: order.status === OrderStatus.PAID || order.status === OrderStatus.DELIVERED,
    status: order.status,
    statusText: STATUS_TEXT[order.status],
    total: order.total.toNumber(),
    paidAt: order.paidAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt
  });
}
