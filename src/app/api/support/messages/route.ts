import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { supportMessageSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = supportMessageSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid support message" }, { status: 400 });
  }

  const message = await prisma.supportMessage.create({
    data: {
      name: parsed.data.name || null,
      contact: parsed.data.contact || null,
      email: parsed.data.email || null,
      message: parsed.data.message,
      source: parsed.data.source || null
    },
    select: {
      id: true,
      createdAt: true
    }
  });

  return NextResponse.json({ id: message.id, createdAt: message.createdAt }, { status: 201 });
}
