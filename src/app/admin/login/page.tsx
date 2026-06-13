import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/storefront/demo-data";
import { getCurrentAdmin } from "@/lib/auth/session";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (isDatabaseConfigured() && (await getCurrentAdmin())) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-black text-white">
            X
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">后台登录</h1>
          <p className="mt-2 text-sm text-slate-500">管理商品、库存、订单和支付配置</p>
        </div>
        {!isDatabaseConfigured() ? (
          <div className="rounded-lg bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm ring-1 ring-slate-100">
            当前未配置 <span className="font-bold text-slate-900">DATABASE_URL</span>，后台登录需要连接 PostgreSQL 后使用。
          </div>
        ) : (
          <AdminLoginForm />
        )}
      </div>
    </main>
  );
}
