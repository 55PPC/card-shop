import { InventoryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    include: {
      _count: {
        select: { inventory: true }
      }
    },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }]
  });
  const counts = await prisma.inventoryItem.groupBy({
    by: ["productId", "status"],
    _count: true
  });

  async function importInventory(formData: FormData) {
    "use server";

    const productId = String(formData.get("productId") || "");
    const secrets = String(formData.get("secrets") || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!productId || !secrets.length) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.createMany({
        data: secrets.map((secret) => ({
          productId,
          secret,
          status: InventoryStatus.AVAILABLE
        }))
      });
      const stock = await tx.inventoryItem.count({
        where: { productId, status: InventoryStatus.AVAILABLE }
      });
      await tx.product.update({
        where: { id: productId },
        data: { stock }
      });
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-xl font-bold">导入库存</h1>
        <form action={importInventory} className="mt-4 grid gap-3">
          <select name="productId" required className="admin-input">
            <option value="">选择商品</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
          <textarea name="secrets" placeholder="一行一个卡密" rows={12} required className="admin-input font-mono text-xs" />
          <button className="h-10 rounded-md bg-blue-600 font-bold text-white">导入</button>
        </form>
      </section>
      <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-bold">库存概览</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {products.map((product) => (
            <div key={product.id} className="p-4">
              <p className="font-semibold text-slate-800">{product.title}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {Object.values(InventoryStatus).map((status) => (
                  <div key={status} className="rounded-md bg-slate-50 p-3">
                    <p className="text-slate-500">{status}</p>
                    <p className="mt-1 text-xl font-bold">{countFor(counts, product.id, status)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function countFor(
  counts: Array<{ productId: string; status: InventoryStatus; _count: number }>,
  productId: string,
  status: InventoryStatus
) {
  return counts.find((item) => item.productId === productId && item.status === status)?._count ?? 0;
}
