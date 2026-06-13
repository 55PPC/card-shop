import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { priceQuoteSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = priceQuoteSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid price request" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId }
  });

  if (!product || !product.enabled) {
    return NextResponse.json({ error: "Product is unavailable" }, { status: 404 });
  }

  const subtotal = product.price.mul(parsed.data.quantity);
  const couponDiscount = await calculateCouponDiscount(parsed.data.couponCode, subtotal);
  const total = Prisma.Decimal.max(subtotal.sub(couponDiscount), new Prisma.Decimal(0));

  return NextResponse.json({
    unitPrice: product.price.toNumber(),
    quantity: parsed.data.quantity,
    couponDiscount: couponDiscount.toNumber(),
    total: total.toNumber()
  });
}

async function calculateCouponDiscount(code: string | null | undefined, subtotal: Prisma.Decimal) {
  if (!code) {
    return new Prisma.Decimal(0);
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code }
  });
  const now = new Date();

  if (
    !coupon ||
    !coupon.enabled ||
    (coupon.startsAt && coupon.startsAt > now) ||
    (coupon.endsAt && coupon.endsAt < now) ||
    (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
  ) {
    return new Prisma.Decimal(0);
  }

  const percentDiscount = coupon.discountPercent
    ? subtotal.mul(coupon.discountPercent).div(100)
    : new Prisma.Decimal(0);
  const amountDiscount = coupon.discountAmount ?? new Prisma.Decimal(0);

  return Prisma.Decimal.min(subtotal, percentDiscount.add(amountDiscount));
}
