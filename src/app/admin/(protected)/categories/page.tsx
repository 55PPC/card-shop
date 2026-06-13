import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }]
  });

  async function saveCategory(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "");
    const data = {
      name: String(formData.get("name") || ""),
      slug: String(formData.get("slug") || ""),
      description: String(formData.get("description") || "") || null,
      sort: Number(formData.get("sort") || 0),
      enabled: formData.get("enabled") === "on"
    };

    if (id) {
      await prisma.category.update({ where: { id }, data });
    } else {
      await prisma.category.create({ data });
    }

    revalidatePath("/admin/categories");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-xl font-bold">新增分类</h1>
        <CategoryForm action={saveCategory} />
      </section>
      <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-bold">分类列表</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {categories.map((category) => (
            <details key={category.id} className="p-4">
              <summary className="cursor-pointer font-semibold text-slate-800">
                {category.name} <span className="text-sm text-slate-400">/{category.slug}</span>
              </summary>
              <CategoryForm action={saveCategory} category={category} />
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function CategoryForm({
  action,
  category
}: {
  action: (formData: FormData) => Promise<void>;
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sort: number;
    enabled: boolean;
  };
}) {
  return (
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="id" defaultValue={category?.id} />
      <input name="name" placeholder="分类名称" defaultValue={category?.name} required className="admin-input" />
      <input name="slug" placeholder="slug" defaultValue={category?.slug} required className="admin-input" />
      <textarea name="description" placeholder="描述" defaultValue={category?.description ?? ""} rows={3} className="admin-input" />
      <input name="sort" type="number" placeholder="排序" defaultValue={category?.sort ?? 0} className="admin-input" />
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <input type="checkbox" name="enabled" defaultChecked={category?.enabled ?? true} />
        启用
      </label>
      <button className="h-10 rounded-md bg-blue-600 font-bold text-white">保存</button>
    </form>
  );
}
