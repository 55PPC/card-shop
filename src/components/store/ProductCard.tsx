import Link from "next/link";
import { Bot, BadgeCheck, Search, Sparkles } from "lucide-react";

export type ProductCardData = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  icon: string | null;
};

type ProductCardProps = {
  product: ProductCardData;
};

const iconMap = {
  bot: Bot,
  badge: BadgeCheck,
  search: Search,
  sparkles: Sparkles
};

export function ProductCard({ product }: ProductCardProps) {
  const Icon = iconMap[product.icon as keyof typeof iconMap] ?? Sparkles;
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={soldOut ? "#" : `/products/${product.id}`}
      aria-disabled={soldOut}
      className="grid min-h-32 grid-cols-[72px_1fr] gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-300 via-blue-500 to-cyan-400 text-white">
        <Icon size={32} strokeWidth={2.5} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-6 text-slate-800">{product.title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {product.description || "自动发货，付款后立即显示卡密"}
        </span>
        <span className="mt-3 flex items-center gap-3">
          <span className="text-base font-bold text-blue-600">￥{product.price.toFixed(2)}</span>
          {product.originalPrice ? (
            <span className="text-xs text-slate-400 line-through">￥{product.originalPrice.toFixed(2)}</span>
          ) : null}
        </span>
        <span className="mt-3 flex items-center gap-3 text-xs">
          <span className="h-1 w-12 rounded-full bg-emerald-400" />
          <span className={soldOut ? "font-semibold text-red-500" : "text-emerald-600"}>
            {soldOut ? "已售罄" : `剩余${product.stock}件`}
          </span>
        </span>
      </span>
    </Link>
  );
}
