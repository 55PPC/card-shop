"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutPanelProps = {
  orderNo: string;
  initialStatus: string;
};

type StatusPayload = {
  status: string;
  statusText: string;
};

export function CheckoutPanel({ orderNo, initialStatus }: CheckoutPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/orders/${orderNo}/status`);

      if (response.ok) {
        const payload = (await response.json()) as StatusPayload;
        setStatus(payload.status);
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [orderNo]);

  async function manualPay() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/payments/manual/pay/${orderNo}`, {
      method: "POST"
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "支付失败");
      return;
    }

    router.push(`/orders/${orderNo}`);
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">订单状态</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600">{status}</span>
      </div>
      <button
        type="button"
        onClick={manualPay}
        disabled={loading || status === "DELIVERED"}
        className="mt-4 h-11 w-full rounded-md bg-blue-600 font-bold text-white disabled:bg-slate-300"
      >
        {loading ? "处理中" : "手动测试支付"}
      </button>
      {message ? <p className="mt-3 text-sm font-semibold text-red-600">{message}</p> : null}
    </div>
  );
}
