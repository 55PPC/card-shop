"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "登录失败");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submitLogin} className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          邮箱
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-blue-500"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          密码
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-blue-500"
          />
        </label>
      </div>
      {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-5 h-11 w-full rounded-md bg-blue-600 font-bold text-white disabled:bg-slate-300"
      >
        {loading ? "登录中" : "登录后台"}
      </button>
    </form>
  );
}
