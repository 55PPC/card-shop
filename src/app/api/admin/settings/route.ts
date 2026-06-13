import { NextResponse } from "next/server";
import { PaymentChannelType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin-api";

export async function GET() {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const [settings, paymentChannels] = await Promise.all([
    prisma.siteSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.paymentChannel.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }] })
  ]);

  return NextResponse.json({ settings, paymentChannels });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();

  if (response) {
    return response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    settings?: Record<string, string>;
    epay?: {
      enabled?: boolean;
      pid?: string;
      key?: string;
      type?: string;
      apiUrl?: string;
      sitename?: string;
    };
  };

  for (const [key, value] of Object.entries(body.settings ?? {})) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }

  if (body.epay) {
    await prisma.paymentChannel.upsert({
      where: { code: "epay" },
      update: {
        name: "EPay",
        type: PaymentChannelType.epay,
        enabled: body.epay.enabled ?? false,
        config: body.epay,
        sort: 20
      },
      create: {
        name: "EPay",
        code: "epay",
        type: PaymentChannelType.epay,
        enabled: body.epay.enabled ?? false,
        config: body.epay,
        sort: 20
      }
    });
  }

  return NextResponse.json({ ok: true });
}
