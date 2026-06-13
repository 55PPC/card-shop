"use client";

import { useState } from "react";

type SearchResult = {
  orderNo: string;
  status: string;
  total: number;
  items: Array<{ productTitle: string; quantity: number; total: number }>;
  deliveryItems: Array<{ productTitle: string; secret: string }> | null;
};

export function OrderSearchForm() {
  const [orderNo, setOrderNo] = useState("");
  const [email, setEmail] = useState("");
  const [queryPassword, setQueryPassword] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const response = await fetch("/api/orders/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderNo: orderNo || undefined,
        email: email || undefined,
        queryPassword
      })
    });
    const payload = (await response.json()) as SearchResult & { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "查询失败");
      return;
    }

    setResult(payload);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-3">
          <input
            value={orderNo}
            onChange={(event) => setOrderNo(event.target.value)}
            placeholder="订单号"
            className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:border-blue-400"
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="邮箱"
            className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:border-blue-400"
          />
          <input
            type="password"
            value={queryPassword}
            onChange={(event) => setQueryPassword(event.target.value)}
            placeholder="查询密码"
            required
            className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:border-blue-400"
          />
        </div>
        {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
        <button className="mt-4 h-11 w-full rounded-md bg-blue-600 font-bold text-white">查询</button>
      </form>
      {result ? (
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-800">{result.orderNo}</p>
            <p className="text-sm font-bold text-blue-600">{result.status}</p>
          </div>
          <p className="mt-2 text-sm text-slate-500">合计 ￥{result.total.toFixed(2)}</p>
          <div className="mt-4 space-y-2">
            {result.items.map((item) => (
              <div key={item.productTitle} className="rounded-md bg-slate-50 p-3 text-sm">
                {item.productTitle} x {item.quantity}
              </div>
            ))}
          </div>
          {result.deliveryItems?.length ? (
            <div className="mt-4 space-y-2">
              {result.deliveryItems.map((item) => (
                <pre key={`${item.productTitle}-${item.secret}`} className="overflow-auto rounded-md bg-slate-950 p-3 text-sm text-white">
                  {item.productTitle}
                  {"\n"}
                  {item.secret}
                </pre>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
