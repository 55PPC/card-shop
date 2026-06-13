import { NextResponse } from "next/server";
import { PaymentChannelType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildEpaySubmitFields, type EpayChannelConfig } from "@/lib/payments/epay";

type RouteContext = {
  params: Promise<{ orderNo: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { orderNo } = await context.params;
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: true }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const channel = await prisma.paymentChannel.findFirst({
    where: {
      type: PaymentChannelType.epay,
      code: "epay",
      enabled: true
    }
  });

  if (!channel) {
    return NextResponse.json({ error: "EPay is disabled" }, { status: 404 });
  }

  const config = parseEpayConfig(channel.config);
  const origin = new URL(request.url).origin;
  const fields = buildEpaySubmitFields(order, config, {
    notifyUrl: `${origin}/api/payments/epay/notify`,
    returnUrl: `${origin}/api/payments/epay/callback`
  });

  return NextResponse.json({
    action: config.apiUrl ?? "https://pay.example.com/submit.php",
    method: "POST",
    fields
  });
}

function parseEpayConfig(value: unknown): EpayChannelConfig & { apiUrl?: string } {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid EPay config");
  }

  const config = value as Partial<EpayChannelConfig & { apiUrl: string }>;

  if (!config.pid || !config.key) {
    throw new Error("Invalid EPay config");
  }

  return {
    pid: config.pid,
    key: config.key,
    type: config.type,
    sitename: config.sitename,
    apiUrl: config.apiUrl
  };
}
