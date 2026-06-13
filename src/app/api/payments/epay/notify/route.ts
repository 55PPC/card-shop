import { NextResponse } from "next/server";
import { OrderStatus, PaymentChannelType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deliverOrder } from "@/lib/orders/deliver-order";
import { verifyEpayNotify, type EpayChannelConfig, type EpayParams } from "@/lib/payments/epay";

export async function POST(request: Request) {
  const params = await readNotifyParams(request);
  const channel = await prisma.paymentChannel.findFirst({
    where: {
      type: PaymentChannelType.epay,
      code: "epay",
      enabled: true
    }
  });

  if (!channel) {
    return text("fail", 404);
  }

  const config = parseEpayConfig(channel.config);

  if (!verifyEpayNotify(params, config.key) || params.trade_status !== "TRADE_SUCCESS") {
    return text("fail", 400);
  }

  const orderNo = String(params.out_trade_no ?? "");
  const tradeNo = String(params.trade_no ?? "");

  if (!orderNo || !tradeNo) {
    return text("fail", 400);
  }

  const order = await prisma.order.findUnique({
    where: { orderNo }
  });

  if (!order) {
    return text("fail", 404);
  }

  if (params.money && !new Prisma.Decimal(String(params.money)).equals(order.total)) {
    return text("fail", 400);
  }

  const paidAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const existingRecord = await tx.paymentRecord.findUnique({
        where: {
          paymentChannelId_providerTransactionId: {
            paymentChannelId: channel.id,
            providerTransactionId: tradeNo
          }
        }
      });

      if (existingRecord && existingRecord.orderId !== order.id) {
        throw new Error("Provider transaction belongs to another order");
      }

      await tx.paymentRecord.upsert({
        where: {
          paymentChannelId_providerTransactionId: {
            paymentChannelId: channel.id,
            providerTransactionId: tradeNo
          }
        },
        create: {
          orderId: order.id,
          paymentChannelId: channel.id,
          amount: order.total,
          status: "paid",
          providerTransactionId: tradeNo,
          providerPayload: params,
          paidAt
        },
        update: {
          status: "paid",
          providerPayload: params,
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

    await deliverOrder(order.orderNo);
  } catch {
    return text("fail", 400);
  }

  return text("success");
}

export async function GET(request: Request) {
  return POST(request);
}

async function readNotifyParams(request: Request): Promise<EpayParams> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => ({}))) as EpayParams;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return Object.fromEntries(Array.from(form.entries()).map(([key, value]) => [key, String(value)]));
  }

  return Object.fromEntries(new URL(request.url).searchParams.entries());
}

function parseEpayConfig(value: unknown): EpayChannelConfig {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid EPay config");
  }

  const config = value as Partial<EpayChannelConfig>;

  if (!config.pid || !config.key) {
    throw new Error("Invalid EPay config");
  }

  return {
    pid: config.pid,
    key: config.key,
    type: config.type,
    sitename: config.sitename
  };
}

function text(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
