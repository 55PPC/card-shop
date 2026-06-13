import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders/create-order";
import { createOrderSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order request" }, { status: 400 });
  }

  try {
    const order = await createOrder({
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      email: parsed.data.email,
      queryPassword: parsed.data.queryPassword,
      couponCode: parsed.data.couponCode
    });

    return NextResponse.json({
      orderNo: order.orderNo,
      checkoutUrl: `/checkout/${order.orderNo}`,
      paymentChannelCode: parsed.data.paymentChannelCode
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 400 }
    );
  }
}
