import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNo = url.searchParams.get("out_trade_no");

  if (!orderNo) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  return NextResponse.redirect(new URL(`/orders/${encodeURIComponent(orderNo)}`, url.origin));
}
