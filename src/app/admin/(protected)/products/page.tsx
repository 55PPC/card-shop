import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }] }),
    prisma.product.findMany({
      include: { category: true },
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }]
    })
  ]);

  async function saveProduct(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "");
    const data = {
      categoryId: String(formData.get("categoryId") || ""),
      title: String(formData.get("title") || ""),
      slug: String(formData.get("slug") || ""),
      description: String(formData.get("description") || "") || null,
      price: String(formData.get("price") || "0"),
      originalPrice: String(formData.get("originalPrice") || "") || null,
      icon: String(formData.get("icon") || "sparkles"),
      sort: Number(formData.get("sort") || 0),
      enabled: formData.get("enabled") === "on"
    };

    if (id) {
      await prisma.product.update({ where: { id }, data });
    } else {
      await prisma.product.create({ data: { ...data, stock: 0 } });
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-xl font-bold">新增商品</h1>
        <ProductForm action={saveProduct} categories={categories} />
      </section>
      <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-bold">商品列表</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {products.map((product) => (
            <details key={product.id} className="p-4">
              <summary className="cursor-pointer font-semibold text-slate-800">
                {product.title} <span className="text-sm text-slate-400">{product.category.name} / 库存 {product.stock}</span>
              </summary>
              <ProductForm action={saveProduct} categories={categories} product={product} />
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductForm({
  action,
  categories,
  product
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Array<{ id: string; name: string }>;
  product?: {
    id: string;
    categoryId: string;
    title: string;
    slug: string;
    description: string | null;
    price: { toString(): string };
    originalPrice: { toString(): string } | null;
    icon: string | null;
    sort: number;
    enabled: boolean;
  };
}) {
  return (
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="id" defaultValue={product?.id} />
      <select name="categoryId" defaultValue={product?.categoryId} required className="admin-input">
        <option value="">选择分类</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <input name="title" placeholder="商品标题" defaultValue={product?.title} required className="admin-input" />
      <input name="slug" placeholder="slug" defaultValue={product?.slug} required className="admin-input" />
      <textarea name="description" placeholder="描述" defaultValue={product?.description ?? ""} rows={3} className="admin-input" />
      <div className="grid grid-cols-2 gap-3">
        <input name="price" type="number" step="0.01" placeholder="售价" defaultValue={product?.price.toString()} required className="admin-input" />
        <input name="originalPrice" type="number" step="0.01" placeholder="原价" defaultValue={product?.originalPrice?.toString() ?? ""} className="admin-input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="icon" placeholder="图标" defaultValue={product?.icon ?? "sparkles"} className="admin-input" />
        <input name="sort" type="number" placeholder="排序" defaultValue={product?.sort ?? 0} className="admin-input" />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <input type="checkbox" name="enabled" defaultChecked={product?.enabled ?? true} />
        启用
      </label>
      <button className="h-10 rounded-md bg-blue-600 font-bold text-white">保存</button>
    </form>
  );
}
