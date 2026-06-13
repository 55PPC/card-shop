"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";

type ProductOrderFormProps = {
  productId: string;
  unitPrice: number;
  stock: number;
};

export function ProductOrderForm({ productId, unitPrice, stock }: ProductOrderFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [queryPassword, setQueryPassword] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const total = useMemo(() => unitPrice * quantity, [quantity, unitPrice]);

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity,
        email,
        queryPassword,
        couponCode: couponCode || undefined,
        paymentChannelCode: "manual"
      })
    });
    const payload = (await response.json()) as { checkoutUrl?: string; error?: string };

    setLoading(false);

    if (!response.ok || !payload.checkoutUrl) {
      setError(payload.error ?? "下单失败");
      return;
    }

    router.push(payload.checkoutUrl);
  }

  return (
    <form onSubmit={submitOrder} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="grid gap-3">
        <label className="text-sm font-semibold text-slate-700">
          购买数量
          <span className="mt-2 flex h-11 items-center overflow-hidden rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="flex h-full w-11 items-center justify-center bg-slate-50"
            >
              <Minus size={16} />
            </button>
            <input
              value={quantity}
              onChange={(event) => setQuantity(Math.min(stock, Math.max(1, Number(event.target.value) || 1)))}
              className="h-full min-w-0 flex-1 text-center outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
              className="flex h-full w-11 items-center justify-center bg-slate-50"
            >
              <Plus size={16} />
            </button>
          </span>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          接收邮箱
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-blue-400"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          查询密码
          <input
            type="password"
            value={queryPassword}
            onChange={(event) => setQueryPassword(event.target.value)}
            required
            minLength={4}
            className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-blue-400"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          优惠码
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-blue-400"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-md bg-slate-50 p-3">
        <span className="text-sm text-slate-500">应付</span>
        <span className="text-xl font-bold text-blue-600">￥{total.toFixed(2)}</span>
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading || stock <= 0}
        className="mt-4 h-11 w-full rounded-md bg-blue-600 font-bold text-white disabled:bg-slate-300"
      >
        {loading ? "提交中" : stock <= 0 ? "已售罄" : "立即下单"}
      </button>
    </form>
  );
}
