import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CheckoutPanel } from "@/components/store/CheckoutPanel";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  params: Promise<{ orderNo: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { orderNo } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: true }
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-gradient-to-r from-blue-500 to-cyan-400 px-4 pb-8 pt-5 text-white">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-sm font-bold">
            返回商城
          </Link>
          <h1 className="mt-4 text-2xl font-bold">收银台</h1>
        </div>
      </header>
      <div className="mx-auto -mt-4 grid max-w-3xl gap-4 px-4 md:grid-cols-[1fr_22rem]">
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-500">订单号</p>
          <p className="mt-1 break-all text-lg font-bold text-slate-900">{order.orderNo}</p>
          <div className="mt-4 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between rounded-md bg-slate-50 p-3 text-sm">
                <span>{item.productTitle} x {item.quantity}</span>
                <span className="font-bold">￥{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">应付</span>
            <span className="text-2xl font-bold text-blue-600">￥{order.total.toFixed(2)}</span>
          </div>
        </section>
        <CheckoutPanel orderNo={order.orderNo} initialStatus={order.status} />
      </div>
    </main>
  );
}
