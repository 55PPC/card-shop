import { prisma } from "@/lib/db";
import { Announcement } from "@/components/store/Announcement";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { ProductCard } from "@/components/store/ProductCard";
import { SupportWidget } from "@/components/store/SupportWidget";
import { demoCategories, demoProducts, demoSettings, isDatabaseConfigured } from "@/lib/storefront/demo-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isDatabaseConfigured()) {
    return <DemoHomePage />;
  }

  const [settings, categories, recentOrders] = await Promise.all([
    getSettings(),
    prisma.category.findMany({
      where: { enabled: true },
      include: {
        products: {
          where: { enabled: true },
          orderBy: [{ sort: "asc" }, { createdAt: "desc" }]
        }
      },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }]
    }),
    prisma.order.findMany({
      where: { status: "DELIVERED" },
      orderBy: { deliveredAt: "desc" },
      take: 4,
      select: {
        email: true,
        items: {
          select: { productTitle: true }
        }
      }
    })
  ]);

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-gradient-to-r from-blue-500 to-cyan-400 px-4 pb-8 pt-5 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-black text-blue-600">
            X
          </span>
          <h1 className="text-lg font-bold">{settings.shopName}</h1>
        </div>
      </header>
      <div className="mx-auto -mt-4 max-w-3xl space-y-4 px-4">
        <Announcement shopName={settings.shopName} announcement={settings.announcement} />
        {recentOrders.length ? (
          <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="space-y-2">
              {recentOrders.map((order, index) => (
                <div key={`${order.email}-${index}`} className="flex items-center gap-3 rounded-lg border border-blue-50 p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {maskEmail(order.email)} 近期购买了{" "}
                    <span className="text-blue-600">{order.items[0]?.productTitle ?? "商品"}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <CategoryGrid
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            productCount: category.products.length
          }))}
        />
        {categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-5 w-5 rounded-md bg-cyan-500" />
              <h2 className="text-lg font-bold text-slate-800">{category.name}</h2>
            </div>
            <div className="space-y-3">
              {category.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    title: product.title,
                    description: product.description,
                    price: product.price.toNumber(),
                    originalPrice: product.originalPrice?.toNumber() ?? null,
                    stock: product.stock,
                    icon: product.icon
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <SupportWidget supportText={settings.supportText} />
    </main>
  );
}

function DemoHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-gradient-to-r from-blue-500 to-cyan-400 px-4 pb-8 pt-5 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-black text-blue-600">
            X
          </span>
          <h1 className="text-lg font-bold">{demoSettings.shopName}</h1>
        </div>
      </header>
      <div className="mx-auto -mt-4 max-w-3xl space-y-4 px-4">
        <Announcement shopName={demoSettings.shopName} announcement={demoSettings.announcement} />
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="space-y-2">
            {demoProducts.slice(0, 2).map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 rounded-lg border border-blue-50 p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  947***@qq.com 近期购买了 <span className="text-blue-600">{product.title}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
        <CategoryGrid
          categories={demoCategories.map((category) => ({
            id: category.id,
            name: category.name,
            productCount: demoProducts.filter((product) => product.categoryId === category.id).length
          }))}
        />
        {demoCategories.map((category) => {
          const products = demoProducts.filter((product) => product.categoryId === category.id);

          if (!products.length) {
            return null;
          }

          return (
            <section key={category.id} id={`category-${category.id}`} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-5 w-5 rounded-md bg-cyan-500" />
                <h2 className="text-lg font-bold text-slate-800">{category.name}</h2>
              </div>
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <SupportWidget supportText={demoSettings.supportText} />
    </main>
  );
}

async function getSettings() {
  const rows = await prisma.siteSetting.findMany();
  const settings = new Map(rows.map((row) => [row.key, row.value]));

  return {
    shopName: settings.get("shopName") ?? "xbrain商城",
    announcement: settings.get("announcement") ?? "商品只能用于单一服务，请按商品描述使用。",
    supportText: settings.get("supportText") ?? "提交订单号和联系方式，客服会尽快处理。"
  };
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!domain) {
    return email;
  }

  return `${name.slice(0, 3)}***@${domain}`;
}
