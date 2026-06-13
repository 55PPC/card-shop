import { NextResponse } from "next/server";
import { OrderStatus, PaymentChannelType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deliverOrder } from "@/lib/orders/deliver-order";

type RouteContext = {
  params: Promise<{ orderNo: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { orderNo } = await context.params;
  const channel = await prisma.paymentChannel.findFirst({
    where: {
      type: PaymentChannelType.manual,
      code: "manual",
      enabled: true
    }
  });

  if (!channel) {
    return NextResponse.json({ error: "Manual payment is disabled" }, { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNo }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === OrderStatus.PENDING) {
    const paidAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.paymentRecord.upsert({
        where: {
          paymentChannelId_providerTransactionId: {
            paymentChannelId: channel.id,
            providerTransactionId: `manual:${order.orderNo}`
          }
        },
        create: {
          orderId: order.id,
          paymentChannelId: channel.id,
          amount: order.total,
          status: "paid",
          providerTransactionId: `manual:${order.orderNo}`,
          providerPayload: { source: "manual-test" },
          paidAt
        },
        update: {
          status: "paid",
          amount: order.total,
          paidAt
        }
      });

      await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING
        },
        data: {
          status: OrderStatus.PAID,
          paidAt
        }
      });
    });
  }

  try {
    const delivered = await deliverOrder(order.orderNo);

    return NextResponse.json({
      orderNo: delivered.order.orderNo,
      status: delivered.order.status,
      delivered: true,
      items: delivered.items
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Manual payment failed" },
      { status: 400 }
    );
  }
}
