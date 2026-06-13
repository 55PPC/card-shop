import Link from "next/link";
import { OrderSearchForm } from "@/components/store/OrderSearchForm";

export default function OrderSearchPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-gradient-to-r from-blue-500 to-cyan-400 px-4 pb-8 pt-5 text-white">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-sm font-bold">
            返回商城
          </Link>
          <h1 className="mt-4 text-2xl font-bold">订单查询</h1>
        </div>
      </header>
      <div className="mx-auto -mt-4 max-w-3xl px-4">
        <OrderSearchForm />
      </div>
    </main>
  );
}
