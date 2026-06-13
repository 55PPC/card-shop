import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { deliverOrder } from "@/lib/orders/deliver-order";

export const dynamic = "force-dynamic";

type OrdersPageProps = {
  searchParams: Promise<{
    orderNo?: string;
    email?: string;
    status?: OrderStatus;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const filters = await searchParams;
  const orders = await prisma.order.findMany({
    where: {
      orderNo: filters.orderNo ? { contains: filters.orderNo } : undefined,
      email: filters.email ? { contains: filters.email } : undefined,
      status: filters.status || undefined
    },
    include: {
      items: true,
      paymentRecords: true
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  async function markPaid(formData: FormData) {
    "use server";

    const orderNo = String(formData.get("orderNo") || "");
    await prisma.order.update({
      where: { orderNo },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date()
      }
    });
    revalidatePath("/admin/orders");
  }

  async function deliver(formData: FormData) {
    "use server";

    const orderNo = String(formData.get("orderNo") || "");
    await deliverOrder(orderNo);
    revalidatePath("/admin/orders");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-xl font-bold">订单管理</h1>
        <form className="mt-4 grid gap-3 md:grid-cols-4">
          <input name="orderNo" placeholder="订单号" defaultValue={filters.orderNo} className="admin-input" />
          <input name="email" placeholder="邮箱" defaultValue={filters.email} className="admin-input" />
          <select name="status" defaultValue={filters.status ?? ""} className="admin-input">
            <option value="">全部状态</option>
            {Object.values(OrderStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button className="h-10 rounded-md bg-slate-900 font-bold text-white">筛选</button>
        </form>
      </section>
      <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">订单号</th>
                <th className="px-4 py-3">邮箱</th>
                <th className="px-4 py-3">商品</th>
                <th className="px-4 py-3">金额</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">支付记录</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 font-semibold text-slate-800">{order.orderNo}</td>
                  <td className="px-4 py-3 text-slate-600">{order.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.items.map((item) => `${item.productTitle} x ${item.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-600">￥{order.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{order.status}</td>
                  <td className="px-4 py-3 text-slate-600">{order.paymentRecords.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <form action={markPaid}>
                        <input type="hidden" name="orderNo" value={order.orderNo} />
                        <button className="rounded-md bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">标记支付</button>
                      </form>
                      <form action={deliver}>
                        <input type="hidden" name="orderNo" value={order.orderNo} />
                        <button className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">发货</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {!orders.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                    暂无订单
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
