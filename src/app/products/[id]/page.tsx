import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductOrderForm } from "@/components/store/ProductOrderForm";
import { SupportWidget } from "@/components/store/SupportWidget";
import { demoProducts, demoSettings, isDatabaseConfigured } from "@/lib/storefront/demo-data";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    const product = demoProducts.find((item) => item.id === id);

    if (!product) {
      notFound();
    }

    return (
      <ProductPageShell
        product={{
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          stock: product.stock,
          categoryName: product.categoryName
        }}
        supportText={demoSettings.supportText}
      />
    );
  }

  const [product, supportText] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { category: true }
    }),
    getSupportText()
  ]);

  if (!product || !product.enabled) {
    notFound();
  }

  return (
    <ProductPageShell
      product={{
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price.toNumber(),
        originalPrice: product.originalPrice?.toNumber() ?? null,
        stock: product.stock,
        categoryName: product.category.name
      }}
      supportText={supportText}
    />
  );
}

function ProductPageShell({
  product,
  supportText
}: {
  product: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    originalPrice: number | null;
    stock: number;
    categoryName: string;
  };
  supportText: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-gradient-to-r from-blue-500 to-cyan-400 px-4 pb-8 pt-5 text-white">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-sm font-bold">
            返回商城
          </Link>
          <h1 className="mt-4 text-2xl font-bold leading-8">{product.title}</h1>
          <p className="mt-2 text-sm text-white/85">{product.categoryName}</p>
        </div>
      </header>
      <div className="mx-auto -mt-4 grid max-w-3xl gap-4 px-4 md:grid-cols-[1fr_22rem]">
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-2xl font-bold text-blue-600">￥{product.price.toFixed(2)}</p>
          {product.originalPrice ? (
            <p className="mt-1 text-sm text-slate-400 line-through">￥{product.originalPrice.toFixed(2)}</p>
          ) : null}
          <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            {product.description ?? "自动发货，付款后在订单页查看卡密。"}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
            <span className="text-slate-500">库存</span>
            <span className="font-bold text-emerald-600">{product.stock}</span>
          </div>
        </section>
        <ProductOrderForm productId={product.id} unitPrice={product.price} stock={product.stock} />
      </div>
      <SupportWidget supportText={supportText} />
    </main>
  );
}

async function getSupportText() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "supportText" }
  });

  return setting?.value ?? "提交订单号和联系方式，客服会尽快处理。";
}
