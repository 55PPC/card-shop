import Link from "next/link";

export type CategoryTile = {
  id: string;
  name: string;
  productCount: number;
};

type CategoryGridProps = {
  categories: CategoryTile[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-5 w-5 rounded-md bg-cyan-500" />
        <h2 className="text-lg font-bold text-slate-800">选择分类</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/#category-${category.id}`}
            className={
              index === 0
                ? "rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 p-4 text-white"
                : "rounded-lg bg-slate-100 p-4 text-slate-700 hover:bg-slate-200"
            }
          >
            <p className="text-sm font-semibold">{category.name}</p>
            <p className={index === 0 ? "mt-3 text-sm text-white/90" : "mt-3 text-sm text-slate-500"}>
              商品数量：{category.productCount}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
