"use client";

import { useState } from "react";
import { Headphones, Search } from "lucide-react";

type SupportWidgetProps = {
  supportText: string;
};

export function SupportWidget({ supportText }: SupportWidgetProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);

  async function submitSupport() {
    if (!message.trim()) {
      return;
    }

    await fetch("/api/support/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contact,
        message,
        source: window.location.pathname
      })
    });
    setSent(true);
    setMessage("");
  }

  return (
    <>
      <a
        href="/order-search"
        className="fixed bottom-6 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg"
        title="查单"
      >
        <Search size={22} />
      </a>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg"
        title="客服"
      >
        <Headphones size={23} />
      </button>
      {open ? (
        <div className="fixed bottom-24 right-5 z-40 w-[min(22rem,calc(100vw-2.5rem))] rounded-lg bg-white p-4 shadow-xl ring-1 ring-slate-200">
          <p className="text-sm font-bold text-slate-800">客服</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{supportText}</p>
          <input
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="联系方式"
            className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="问题描述"
            rows={4}
            className="mt-2 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="button"
            onClick={submitSupport}
            className="mt-2 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-bold text-white"
          >
            {sent ? "已提交" : "提交"}
          </button>
        </div>
      ) : null}
    </>
  );
}
