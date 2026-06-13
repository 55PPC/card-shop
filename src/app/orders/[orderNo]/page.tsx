import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type OrderPageProps = {
  params: Promise<{ orderNo: string }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderNo } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: true }
  });

  if (!order) {
    notFound();
  }

  const deliveryItems = parseDeliveryItems(order.deliveryItems);

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-gradient-to-r from-blue-500 to-cyan-400 px-4 pb-8 pt-5 text-white">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-sm font-bold">
            返回商城
          </Link>
          <h1 className="mt-4 text-2xl font-bold">订单详情</h1>
        </div>
      </header>
      <div className="mx-auto -mt-4 max-w-3xl space-y-4 px-4">
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">订单号</p>
              <p className="mt-1 break-all font-bold text-slate-900">{order.orderNo}</p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600">
              {order.status}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                {item.productTitle} x {item.quantity}
              </div>
            ))}
          </div>
        </section>
        {order.status === OrderStatus.DELIVERED && deliveryItems.length ? (
          <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-bold text-slate-800">卡密</h2>
            <div className="mt-3 space-y-2">
              {deliveryItems.map((item) => (
                <pre key={`${item.productTitle}-${item.secret}`} className="overflow-auto rounded-md bg-slate-950 p-3 text-sm text-white">
                  {item.productTitle}
                  {"\n"}
                  {item.secret}
                </pre>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-lg bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
            订单发货后会在这里显示卡密。需要输入查询密码查看完整信息时，可使用查单入口。
          </section>
        )}
      </div>
    </main>
  );
}

function parseDeliveryItems(value: unknown): Array<{ productTitle: string; secret: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is { productTitle: string; secret: string } => {
    return (
      typeof item === "object" &&
      item !== null &&
      "productTitle" in item &&
      "secret" in item &&
      typeof item.productTitle === "string" &&
      typeof item.secret === "string"
    );
  });
}
