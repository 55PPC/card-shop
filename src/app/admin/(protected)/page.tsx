import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [productCount, availableInventoryCount, pendingOrderCount, deliveredOrderCount, recentOrders] =
    await Promise.all([
      prisma.product.count(),
      prisma.inventoryItem.count({ where: { status: "AVAILABLE" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { items: true }
      })
    ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">概览</h1>
        <p className="mt-1 text-sm text-slate-500">查看商城库存、订单和最近交易。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="商品数" value={productCount} />
        <MetricCard label="可售库存" value={availableInventoryCount} />
        <MetricCard label="待支付订单" value={pendingOrderCount} />
        <MetricCard label="已发货订单" value={deliveredOrderCount} />
      </div>
      <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-bold text-slate-900">最近订单</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">订单号</th>
                <th className="px-4 py-3">邮箱</th>
                <th className="px-4 py-3">商品</th>
                <th className="px-4 py-3">金额</th>
                <th className="px-4 py-3">状态</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-800">{order.orderNo}</td>
                  <td className="px-4 py-3 text-slate-600">{order.email}</td>
                  <td className="px-4 py-3 text-slate-600">{order.items[0]?.productTitle ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">￥{order.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{order.status}</td>
                </tr>
              ))}
              {!recentOrders.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
