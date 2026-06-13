import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Boxes, CreditCard, FolderTree, LayoutDashboard, MessageSquare, Package, Settings } from "lucide-react";
import { isDatabaseConfigured } from "@/lib/storefront/demo-data";
import { getCurrentAdmin } from "@/lib/auth/session";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

const navItems = [
  { href: "/admin", label: "概览", icon: LayoutDashboard },
  { href: "/admin/categories", label: "分类", icon: FolderTree },
  { href: "/admin/products", label: "商品", icon: Package },
  { href: "/admin/inventory", label: "库存", icon: Boxes },
  { href: "/admin/orders", label: "订单", icon: CreditCard },
  { href: "/admin/settings", label: "设置", icon: Settings },
  { href: "/admin/support", label: "客服", icon: MessageSquare }
];

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isDatabaseConfigured()) {
    redirect("/admin/login");
  }

  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[16rem_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-black text-white">
              X
            </span>
            <div>
              <p className="text-sm font-bold">Card Shop</p>
              <p className="text-xs text-slate-500">管理后台</p>
            </div>
          </div>
          <nav className="grid gap-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="min-w-0">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <BarChart3 size={17} />
              {admin.name}
            </div>
            <AdminLogoutButton />
          </header>
          <div className="p-5">{children}</div>
        </section>
      </div>
    </main>
  );
}
