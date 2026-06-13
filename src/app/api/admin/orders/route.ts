import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin-api";
import { deliverOrder } from "@/lib/orders/deliver-order";

export async function GET(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const url = new URL(request.url);
  const orderNo = url.searchParams.get("orderNo") || undefined;
  const email = url.searchParams.get("email") || undefined;
  const status = url.searchParams.get("status") as OrderStatus | null;

  const orders = await prisma.order.findMany({
    where: {
      orderNo: orderNo ? { contains: orderNo } : undefined,
      email: email ? { contains: email } : undefined,
      status: status || undefined
    },
    include: {
      items: true,
      paymentRecords: true
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    orderNo?: string;
    action?: "markPaid" | "deliver";
  };

  if (!body.orderNo || !body.action) {
    return NextResponse.json({ error: "Order number and action are required" }, { status: 400 });
  }

  if (body.action === "markPaid") {
    await prisma.order.update({
      where: { orderNo: body.orderNo },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date()
      }
    });
  }

  if (body.action === "deliver") {
    await deliverOrder(body.orderNo);
  }

  return NextResponse.json({ ok: true });
}
