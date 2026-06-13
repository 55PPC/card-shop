import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const messages = await prisma.supportMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });

  async function toggleHandled(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "");
    const handled = formData.get("handled") === "true";

    await prisma.supportMessage.update({
      where: { id },
      data: { handled: !handled }
    });

    revalidatePath("/admin/support");
  }

  return (
    <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
      <div className="border-b border-slate-100 p-4">
        <h1 className="text-xl font-bold">客服消息</h1>
      </div>
      <div className="divide-y divide-slate-100">
        {messages.map((message) => (
          <div key={message.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{message.contact || message.email || message.name || "匿名用户"}</p>
                <p className="mt-1 text-xs text-slate-400">{message.createdAt.toLocaleString("zh-CN")} / {message.source || "-"}</p>
              </div>
              <form action={toggleHandled}>
                <input type="hidden" name="id" value={message.id} />
                <input type="hidden" name="handled" value={String(message.handled)} />
                <button className={message.handled ? "rounded-md bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600" : "rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"}>
                  {message.handled ? "标为未处理" : "标为已处理"}
                </button>
              </form>
            </div>
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{message.message}</p>
          </div>
        ))}
        {!messages.length ? <p className="p-8 text-center text-sm text-slate-500">暂无客服消息</p> : null}
      </div>
    </section>
  );
}
