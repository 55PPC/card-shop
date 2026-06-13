type AnnouncementProps = {
  shopName: string;
  announcement: string;
};

export function Announcement({ shopName, announcement }: AnnouncementProps) {
  return (
    <section className="rounded-lg bg-white p-5 text-center shadow-sm ring-1 ring-slate-100">
      <p className="text-xl font-bold text-slate-950">{shopName}</p>
      <div className="mt-3 space-y-2 text-lg font-bold leading-8">
        <p>
          支付时请使用 <span className="text-blue-600">当前设备</span> 完成付款，付款后系统自动发货。
        </p>
        <p className="text-red-600">遇到问题请联系客服处理，核实后会协助补发或退款。</p>
        <p className="text-emerald-600">{announcement}</p>
      </div>
    </section>
  );
}
