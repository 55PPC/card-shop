import { PaymentChannelType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, epay] = await Promise.all([
    prisma.siteSetting.findMany(),
    prisma.paymentChannel.findUnique({ where: { code: "epay" } })
  ]);
  const settingMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const epayConfig = parseConfig(epay?.config);

  async function saveSettings(formData: FormData) {
    "use server";

    const rows = [
      ["shopName", String(formData.get("shopName") || "")],
      ["announcement", String(formData.get("announcement") || "")],
      ["supportText", String(formData.get("supportText") || "")]
    ];

    for (const [key, value] of rows) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }

    await prisma.paymentChannel.upsert({
      where: { code: "epay" },
      update: {
        name: "EPay",
        type: PaymentChannelType.epay,
        enabled: formData.get("epayEnabled") === "on",
        config: {
          pid: String(formData.get("epayPid") || ""),
          key: String(formData.get("epayKey") || ""),
          type: String(formData.get("epayType") || "alipay"),
          apiUrl: String(formData.get("epayApiUrl") || ""),
          sitename: String(formData.get("epaySitename") || "")
        },
        sort: 20
      },
      create: {
        name: "EPay",
        code: "epay",
        type: PaymentChannelType.epay,
        enabled: formData.get("epayEnabled") === "on",
        config: {
          pid: String(formData.get("epayPid") || ""),
          key: String(formData.get("epayKey") || ""),
          type: String(formData.get("epayType") || "alipay"),
          apiUrl: String(formData.get("epayApiUrl") || ""),
          sitename: String(formData.get("epaySitename") || "")
        },
        sort: 20
      }
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
  }

  return (
    <section className="max-w-3xl rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <h1 className="text-xl font-bold">站点与支付设置</h1>
      <form action={saveSettings} className="mt-4 grid gap-4">
        <label className="text-sm font-semibold text-slate-700">
          商城名称
          <input name="shopName" defaultValue={settingMap.get("shopName") ?? "Card Shop"} className="admin-input mt-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          公告
          <textarea name="announcement" defaultValue={settingMap.get("announcement") ?? ""} rows={4} className="admin-input mt-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          客服提示
          <textarea name="supportText" defaultValue={settingMap.get("supportText") ?? ""} rows={3} className="admin-input mt-2" />
        </label>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">EPay 配置</h2>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" name="epayEnabled" defaultChecked={epay?.enabled ?? false} />
              启用
            </label>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="epayPid" placeholder="PID" defaultValue={epayConfig.pid} className="admin-input" />
            <input name="epayKey" placeholder="KEY" defaultValue={epayConfig.key} className="admin-input" />
            <input name="epayType" placeholder="支付类型 alipay/wechat/qqpay" defaultValue={epayConfig.type || "alipay"} className="admin-input" />
            <input name="epayApiUrl" placeholder="提交网关 URL" defaultValue={epayConfig.apiUrl} className="admin-input" />
            <input name="epaySitename" placeholder="站点名" defaultValue={epayConfig.sitename} className="admin-input md:col-span-2" />
          </div>
        </div>
        <button className="h-10 rounded-md bg-blue-600 font-bold text-white">保存设置</button>
      </form>
    </section>
  );
}

function parseConfig(value: unknown) {
  if (!value || typeof value !== "object") {
    return { pid: "", key: "", type: "alipay", apiUrl: "", sitename: "" };
  }

  const config = value as Partial<Record<"pid" | "key" | "type" | "apiUrl" | "sitename", string>>;

  return {
    pid: config.pid ?? "",
    key: config.key ?? "",
    type: config.type ?? "alipay",
    apiUrl: config.apiUrl ?? "",
    sitename: config.sitename ?? ""
  };
}
